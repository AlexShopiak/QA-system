import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


/**
 * Generates a single embedding for the provided text using the OpenAI API.
 * 
 * @async
 * @function generateOneEmbeddingWithGPT
 * @param {string} text - The input text for which to generate an embedding.
 * @returns {Promise<Array<number>>} - The embedding vector as an array of numbers.
 * @throws {Error} - Throws an error if embedding generation fails.
 * 
 */
export const generateOneEmbeddingWithGPT = async (text) => {
    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: text,
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw new Error('Failed to generate embedding');
    }
};


/**
 * Generates embeddings for an array of chunks using the generateOneEmbeddingWithGPT.
 *  
 * @async
 * @function generateChunksEmbeddingsWithGPT
 * @param {Array<Object>} chunks - An array of chunk objects, where each chunk contains 'id', 'text', and 'entities'.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of objects, each containing the chunk 'id', the generated 'vector' (embedding), and the chunk metadata.
 * @throws {Error} - Throws an error if embedding generation fails for any chunk.
 * 
 */
export const generateChunksEmbeddingsWithGPT = async (chunks) => {
    const embeddings = await Promise.all(
        chunks.map(async (chunk) => {
            const textWithMeta = `${chunk.entities.join(" ")} ${chunk.topics.join(" ")} ${chunk.text}`;
            const vector = await generateOneEmbeddingWithGPT(textWithMeta);
            return { id: chunk.id, vector, metadata: chunk };
        })
    );
    return embeddings;
};


/**
 * Generates an answer from GPT-4 given a prompt.
 * 
 * @async
 * @function queryGPT
 * @param {string} prompt - The prompt to send to GPT-4.
 * @returns {Promise<string>} - The response from GPT-4 as a string.
 * @throws {Error} - Throws an error if the query fails.
 * 
 */
export const queryGPT = async (prompt) => {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-0125", //"gpt-4",
            messages: [
                { role: "system", content: "You are an assistant that responds only based on the context provided." },
                { role: "user", content: prompt },
            ],
        });
        const answer = response.choices[0].message.content;
        return answer;
    } catch (error) {
        console.error('Error generating answer:', error);
        throw new Error('Failed to generate answer');
    }
};
