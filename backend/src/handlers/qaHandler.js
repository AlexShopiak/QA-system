import { retrieveRelevantChunksFromPinecone } from '../services/pinecone.js';
import { queryGPT } from '../services/openai.js'
import { timestamp } from '../utils/timestamp.js';

/**
 * Handles the Question-Answer request and returns an answer based on relevant data retrieved from Pinecone and processed by the GPT API.
 * @async
 * @function handleQA
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Next middleware function for error handling.
 * @returns {Promise<void>} - Sends a JSON response with the answer and relevant context chunks.
 * @throws {Error} - Passes the error to the next middleware if an exception occurs.
 */
export const handleQA = async (req, res, next) => {
    try {
        if (!req.body) {
            return res.status(400).send('No question provided.');
        }
        
        const { question } = req.body;

        // Retrieve relevant chunks from Pinecone
        const relevantChunks = await retrieveRelevantChunksFromPinecone(question);
        console.log(timestamp(), "Pynecone: chunks retrieved");

        if (!relevantChunks || relevantChunks.length === 0) {
            return res.json({ answer: "No relevant information found in the document", context: [] });
        }

        // Format context for GPT prompt
        const context = relevantChunks.map(chunk => chunk.text).join('\n');
        const prompt = `\nContext:\n${context}\n\nQuestion: ${question}\nAnswer:`;

        // Query GPT API for answer
        const answer = await queryGPT(prompt);
        console.log(timestamp(), "OpenAI: gpt queried");
        console.log("======================================");

        res.json({ answer, context: relevantChunks });
    } catch (error) {
        next(error);
    }
}