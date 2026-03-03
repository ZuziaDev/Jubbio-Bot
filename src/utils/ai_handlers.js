const openai = require("./ai");

/**
 * @typedef {Object} CircuitBreakerState
 * @property {number} failures - Consecutive failure count
 * @property {number} nextAttempt - Timestamp (ms) when the model can be tried again
 * @property {boolean} isOpen - Whether the circuit is open (blocked)
 */

/**
 * Configuration for Fallback Models
 */
const FALLBACK_MODELS = {
    text: ["gpt-4o-mini", "gpt-4.1-mini"],
    moderation: ["gpt-4o-mini", "gpt-4.1-nano"],
    image: ["flux-schnell", "stable-image-core", "dall-e-3"]
};

/**
 * AI Handler - Enterprise Grade
 * Features:
 * - Smart Fallbacks
 * - Circuit Breaker Pattern
 * - Exponential Backoff
 * - Detailed Error Classification
 * - Singleton State Management
 */
class AIHandler {
    constructor() {
        /** @type {Map<string, CircuitBreakerState>} */
        this.modelHealth = new Map();
        
        // Configuration constants
        this.CIRCUIT_THRESHOLD = 1; // Failures before opening circuit
        this.CIRCUIT_TIMEOUT = 60000; // 1 minute cooldown
    }

    /**
     * Checks if a model is currently healthy/available.
     * @param {string} model 
     * @returns {boolean}
     */
    isModelHealthy(model) {
        const health = this.modelHealth.get(model);
        if (!health) return true; // Assume healthy if unknown

        if (health.isOpen) {
            if (Date.now() > health.nextAttempt) {
                // Cooldown over, try partially (Half-Open state effectively)
                return true;
            }
            return false;
        }
        return true;
    }

    /**
     * Records a success for a model, resetting its health stats.
     * @param {string} model 
     */
    recordSuccess(model) {
        if (this.modelHealth.has(model)) {
            this.modelHealth.delete(model);
        }
    }

    /**
     * Records a failure for a model and potentially opens the circuit.
     * @param {string} model 
     */
    recordFailure(model) {
        const health = this.modelHealth.get(model) || { failures: 0, nextAttempt: 0, isOpen: false };
        health.failures++;

        if (health.failures >= this.CIRCUIT_THRESHOLD) {
            health.isOpen = true;
            health.nextAttempt = Date.now() + this.CIRCUIT_TIMEOUT;
            console.warn(`[AI-Circuit] 🔌 Circuit OPEN for model: ${model}. Pausing for ${this.CIRCUIT_TIMEOUT/1000}s.`);
        }

        this.modelHealth.set(model, health);
    }

    /**
     * Calculates delay for exponential backoff.
     * @param {number} attempt - Current attempt index (0-based)
     * @returns {number} Delay in ms
     */
    getBackoffDelay(attempt) {
        // 1s, 2s, 4s, 8s...
        return Math.min(1000 * Math.pow(2, attempt), 10000); 
    }

    /**
     * Generates text using OpenAI chat completions with robust fallback and retry logic.
     * @param {Object} options
     * @param {Array} options.messages - Chat messages
     * @param {String} options.model - Primary model to use
     * @param {Array} [options.tools] - Function calling tools
     * @param {String} [options.tool_choice] - Tool choice
     * @param {String} [options.provider] - Specific provider
     * @param {Array} [options.fallbacks] - Custom fallback models
     * @param {Number} [options.retries=2] - Retries per model
     * @param {Number} [options.timeout=45000] - Timeout in ms
     */
    async generateText({ messages, model, tools, tool_choice, provider = null, fallbacks = undefined, retries = 2, timeout = 45000 }) {
        const defaultFallbacks = FALLBACK_MODELS.text;
        const modelsToUse = (fallbacks !== undefined && fallbacks !== null) ? fallbacks : defaultFallbacks;
        
        // Filter models: Remove duplicates and unhealthy models (unless all are unhealthy)
        let modelsToTry = [model, ...modelsToUse].filter((m, i, self) => m && self.indexOf(m) === i);
        
        // Optimization: prioritize healthy models, but keep unhealthy ones at the end just in case
        modelsToTry.sort((a, b) => {
            const aHealthy = this.isModelHealthy(a);
            const bHealthy = this.isModelHealthy(b);
            if (aHealthy && !bHealthy) return -1;
            if (!aHealthy && bHealthy) return 1;
            return 0;
        });

        let lastError = null;

        for (const currentModel of modelsToTry) {
            // Skip if circuit is open (unless it's the only option left)
            if (!this.isModelHealthy(currentModel) && modelsToTry.length > 1) {
                // console.log(`[AI] Skipping unhealthy model: ${currentModel}`);
                continue;
            }

            // Retry loop for the current model
            for (let attempt = 0; attempt <= retries; attempt++) {
                try {
                    const params = {
                        model: currentModel,
                        messages: messages,
                        timeout: timeout, 
                    };
                    
                    if (tools) {
                        params.tools = tools;
                        params.tool_choice = tool_choice;
                    }
                    
                    if (provider) {
                        params.provider = provider;
                    }

                    if (attempt > 0) console.log(`[AI] 🔄 Retrying ${currentModel} (Attempt ${attempt + 1})...`);
                    
                    const completion = await openai.chat.completions.create(params);
                    
                    // Success!
                    this.recordSuccess(currentModel);
                    
                    if (currentModel !== model || attempt > 0) {
                        console.log(`[AI] ✅ Recovered with ${currentModel}`);
                    }
                    
                    return completion;

                } catch (error) {
                    const isRetryable = this.isRetryableError(error);
                    console.error(`[AI] ❌ Error with ${currentModel} (${attempt + 1}/${retries + 1}): ${error.message}`);
                    lastError = error;
                    
                    // Critical errors: Break immediately to try next model
                    if (!isRetryable) {
                        this.recordFailure(currentModel);
                        break; 
                    }
                    
                    // If it's the last attempt for this model, record failure
                    if (attempt === retries) {
                        this.recordFailure(currentModel);
                    } else {
                        // Wait before retry
                        await new Promise(r => setTimeout(r, this.getBackoffDelay(attempt)));
                    }
                }
            }
            
            // If we are here, retries for currentModel failed.
            if (modelsToTry.indexOf(currentModel) < modelsToTry.length - 1) {
                console.log(`[AI] ⚠️ Switching to fallback: ${modelsToTry[modelsToTry.indexOf(currentModel) + 1]}...`);
            }
        }
        
        throw lastError;
    }

    /**
     * Generates an image using OpenAI images generate with fallback.
     */
    async generateImage({ prompt, model, n = 1, size = "1024x1024", retries = 1, timeout = 60000 }) {
        const modelsToTry = [model, ...FALLBACK_MODELS.image].filter((m, i, self) => m && self.indexOf(m) === i);
        let lastError = null;

        for (const currentModel of modelsToTry) {
            for (let attempt = 0; attempt <= retries; attempt++) {
                try {
                    const response = await openai.images.generate({
                        model: currentModel,
                        prompt: prompt,
                        n: n,
                        size: size,
                        timeout: timeout
                    });
                    
                    this.recordSuccess(currentModel);
                    return response;
                } catch (error) {
                    console.error(`[AI] ❌ Image Error with ${currentModel}: ${error.message}`);
                    lastError = error;

                    if (!this.isRetryableError(error)) {
                        this.recordFailure(currentModel);
                        break;
                    }

                    if (attempt === retries) {
                        this.recordFailure(currentModel);
                    } else {
                        await new Promise(r => setTimeout(r, this.getBackoffDelay(attempt)));
                    }
                }
            }
        }
        throw lastError;
    }

    /**
     * Determines if an error is transient and worth retrying.
     * @param {Error} error 
     * @returns {boolean}
     */
    isRetryableError(error) {
        // 400: Bad Request (Invalid parameters) - NOT Retryable
        // 401: Unauthorized (Bad Key) - NOT Retryable
        // 403: Forbidden - NOT Retryable
        // 404: Not Found (Model doesn't exist) - NOT Retryable
        if (error.status && [400, 401, 403, 404].includes(error.status)) {
            return false;
        }
        
        // 429: Rate Limit - Retryable
        // 500, 502, 503: Server Errors - Retryable
        // Network errors (no status) - Retryable
        return true;
    }
}

// Export a singleton instance
module.exports = new AIHandler();
