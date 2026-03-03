const openai = require("./ai");
const AIHandler = require("./ai_handler");
const { db } = require("./database");

class KnowledgeBase {
    /**
     * Calculates the cosine similarity between two vectors.
     * @param {number[]} vecA 
     * @param {number[]} vecB 
     * @returns {number} Similarity score (-1 to 1)
     */
    static cosineSimilarity(vecA, vecB) {
        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            magnitudeA += vecA[i] * vecA[i];
            magnitudeB += vecB[i] * vecB[i];
        }
        return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
    }

    /**
     * Generates an embedding vector for the given text.
     * @param {string} text 
     * @returns {Promise<number[]>}
     */
    static async getEmbedding(text) {
        try {
            const response = await openai.embeddings.create({
                model: "text-embedding-3-large", // Cost effective and fast
                input: text,
                provider: "void"
            });
            return response.data[0].embedding;
        } catch (error) {
            try {
                const response = await openai.embeddings.create({
                model: "text-embedding-3-small", // Cost effective and fast
                input: text,
                provider: "void"
            });
            return response.data[0].embedding;
            } catch (err) {
                console.error("Embedding Error:", err);
            throw err;
            }
            
        }
    }

    /**
     * Adds a new piece of knowledge to the guild's database.
     * @param {string} guildId 
     * @param {string} topic - Short topic/title
     * @param {string} content - The detailed information
     */
    static async addKnowledge(guildId, topic, content) {
        const embedding = await this.getEmbedding(content);
        const knowledgeId = Date.now().toString();
        
        await db.set(`guilds/${guildId}/knowledge/${knowledgeId}`, {
            id: knowledgeId,
            topic,
            content,
            embedding,
            createdAt: Date.now()
        });
        
        return knowledgeId;
    }

    /**
     * Searches for relevant knowledge based on a query.
     * @param {string} guildId 
     * @param {string} query 
     * @param {number} limit - Max results
     * @param {number} threshold - Min similarity (0.4 is usually good)
     */
    static async search(guildId, query, limit = 3, threshold = 0.4) {
        // 1. Get query embedding
        const queryEmbedding = await this.getEmbedding(query);
        
        // 2. Fetch all knowledge for this guild
        // Note: For very large datasets, use a Vector DB (Pinecone/Milvus). 
        // For a Discord bot with <1000 docs per guild, in-memory linear scan is fine.
        const allKnowledge = await db.get(`guilds/${guildId}/knowledge`) || {};
        
        const results = [];

        for (const key in allKnowledge) {
            const doc = allKnowledge[key];
            if (!doc.embedding) continue;

            const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
            
            if (similarity >= threshold) {
                results.push({
                    topic: doc.topic,
                    content: doc.content,
                    similarity
                });
            }
        }

        // 3. Sort by similarity desc
        results.sort((a, b) => b.similarity - a.similarity);

        return results.slice(0, limit);
    }
    
    /**
     * Deletes a knowledge entry.
     * @param {string} guildId
     * @param {string} topic
     */
    static async removeKnowledge(guildId, topic) {
        const allKnowledge = await db.get(`guilds/${guildId}/knowledge`) || {};
        let deletedCount = 0;
        
        for (const key in allKnowledge) {
            if (allKnowledge[key].topic.toLowerCase() === topic.toLowerCase()) {
                await db.delete(`guilds/${guildId}/knowledge/${key}`);
                deletedCount++;
            }
        }
        return deletedCount;
    }
    /**
     * Automatically extracts and learns useful information from a conversation or text.
     * @param {string} guildId
     * @param {string} text - The text to analyze
     * @returns {Promise<boolean>} True if something was learned
     */
    static async autoLearn(guildId, text) {
        if (!text || text.length < 20) return false;

        try {
            // Ask AI if there is any permanent knowledge worth saving using Function Calling
            const analysis = await AIHandler.generateText({
                model: "gpt-4o-mini",
                messages: [
                    { 
                        role: "system", 
                        content: "You are a Knowledge Extractor. Analyze the text. If it contains factual, useful, long-term information about the server, community, rules, or technical definitions (NOT casual chat), extract it. If nothing worth saving, return null." 
                    },
                    { role: "user", content: text }
                ],
                tools: [
                    {
                        type: "function",
                        function: {
                            name: "extract_knowledge",
                            description: "Extracts structured knowledge from text.",
                            parameters: {
                                type: "object",
                                properties: {
                                    topic: {
                                        type: "string",
                                        description: "A short, descriptive title for the knowledge."
                                    },
                                    content: {
                                        type: "string",
                                        description: "The detailed factual information to be stored."
                                    },
                                    is_worth_saving: {
                                        type: "boolean",
                                        description: "True if this is valuable long-term knowledge, False if it's just chat."
                                    }
                                },
                                required: ["topic", "content", "is_worth_saving"]
                            }
                        }
                    }
                ],
                tool_choice: "required"
            });

            const toolCalls = analysis.choices[0].message.tool_calls;
            
            if (toolCalls && toolCalls.length > 0) {
                const functionArgs = JSON.parse(toolCalls[0].function.arguments);
                
                if (functionArgs.is_worth_saving && functionArgs.topic && functionArgs.content) {
                    // Check if we already know this (simple check)
                    const search = await this.search(guildId, functionArgs.topic, 1, 0.9);
                    if (search.length > 0) {
                        console.log(`[Auto-Learn] Skipped duplicate: ${functionArgs.topic}`);
                        return false;
                    }

                    await this.addKnowledge(guildId, functionArgs.topic, functionArgs.content);
                    console.log(`[Auto-Learn] Learned: ${functionArgs.topic}`);
                    return true;
                }
            }
        } catch (error) {
            console.error("Auto-Learn Error:", error.message);
        }
        return false;
    }
}

module.exports = KnowledgeBase;
