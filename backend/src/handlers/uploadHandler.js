import { extractText, chunkText, cleanText, getEntitiesFromText} from '../utils/textProcessing.js';
import { saveEmbeddingsToPinecone, clearPineconeIndex } from '../services/pinecone.js';
import { generateChunksEmbeddingsWithGPT } from '../services/openai.js';
import { runTopicModeling } from '../services/topicModeling.js';

/**
 * Handles the document upload request, processes the document, and stores embeddings in Pinecone.
 * The function extracts text from the uploaded file, cleans it, performs NER (Named Entity Recognition),
 * generates embeddings using the OpenAI API, and stores them in Pinecone for efficient retrieval.
 * Additionally, it runs a Python script for topic modeling on the extracted text.
 *
 * @async
 * @function handleUpload
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Next middleware function for error handling.
 * @returns {Promise<void>} - Sends a JSON response indicating successful processing.
 * @throws {Error} - Passes the error to the next middleware if an exception occurs.
 *
 */
export const handleUpload = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
      
        const { buffer, originalname } = req.file;

        // Extract, clean and chunk text
        const text = await extractText(buffer, originalname);
        const cleanedText = cleanText(text);
        const chunks = chunkText(cleanedText);

        // Perform NER on each chunk
        const chunksAfterNER = await Promise.all(chunks.map(async (chunk) => {
            const entities = await getEntitiesFromText(chunk.text);
            // Include recognized entities in the chunk metadata
            return { ...chunk, entities };
        }));

        // Generate embeddings
        const embeddings = await generateChunksEmbeddingsWithGPT(chunksAfterNER);

        //Clear previous vectors
        await clearPineconeIndex();

        // Save embeddings to Pinecone
        await saveEmbeddingsToPinecone(embeddings);

        // Run Python script to model topics for each chunk
        for(let i = 0; i < embeddings.length; i++) {
            const id = embeddings[i].metadata.id;
            const text = [embeddings[i].metadata.text];

            const result = await runTopicModeling(id, text);
            console.log('Extracted Topics:', result);
        }

        res.json({ message: 'Document processed successfully' });
    } catch (error) {
        next(error);
    }
}