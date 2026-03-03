const { db } = require('../config');

class MemorySystem {
    /**
     * Stores a piece of information about a user
     * @param {string} userId - The user's ID
     * @param {string} key - The key for the memory (e.g., 'name', 'hobby', 'job')
     * @param {any} value - The value to store
     */
    static async remember(userId, key, value) {
        try {
            if (!db?.set) return false;
            // Firebase keys cannot contain certain characters
            const safeKey = key.replace(/[.#$/[\]]/g, '_');
            
            await db.set(`users/${userId}/memory/${safeKey}`, {
                value: value,
                timestamp: Date.now()
            });
            console.log(`[Memory] Stored for ${userId}: ${safeKey} = ${value}`);
            return true;
        } catch (error) {
            console.error("Memory Store Error:", error);
            return false;
        }
    }

    /**
     * Retrieves a specific memory about a user
     * @param {string} userId 
     * @param {string} key 
     */
    static async recall(userId, key) {
        try {
            if (!db?.get) return null;
            const data = await db.get(`users/${userId}/memory/${key}`);
            return data ? data.value : null;
        } catch (error) {
            console.error("Memory Recall Error:", error);
            return null;
        }
    }

    /**
     * Retrieves all memories about a user formatted as context string
     * @param {string} userId 
     */
    static async getContext(userId) {
        try {
            if (!db?.get) return "";
            const memories = await db.get(`users/${userId}/memory`);
            if (!memories) return "";

            let context = "USER MEMORY CONTEXT:\n";
            for (const [key, data] of Object.entries(memories)) {
                context += `- ${key}: ${data.value}\n`;
            }
            return context;
        } catch (error) {
            console.error("Memory Context Error:", error);
            return "";
        }
    }

    /**
     * Forgets a specific memory
     * @param {string} userId 
     * @param {string} key 
     */
    static async forget(userId, key) {
        try {
            if (!db?.delete) return false;
            await db.delete(`users/${userId}/memory/${key}`);
            return true;
        } catch (error) {
            console.error("Memory Forget Error:", error);
            return false;
        }
    }
}

module.exports = MemorySystem;
