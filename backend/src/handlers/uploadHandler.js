import { extractText, chunkText, cleanText, getEntitiesFromText, getTopicsFromText} from '../utils/textProcessing.js';
import { saveEmbeddingsToPinecone, clearPineconeIndex } from '../services/pinecone.js';
import { generateChunksEmbeddingsWithGPT } from '../services/openai.js';
import { timestamp } from '../utils/timestamp.js'

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
        console.log(timestamp(), "App: text chunked");

        // Perform NER and TopicModeling on each chunk
        const chunksWithMeta = chunks.map((chunk) => {
            const entities = getEntitiesFromText(chunk.text);
            const topics = getTopicsFromText(chunk.text);
            return { ...chunk, entities, topics };
        });
        console.log(timestamp(), "App: meta added");
        
        // Generate embeddings
        const embeddings = await generateChunksEmbeddingsWithGPT(chunksWithMeta);
        console.log(timestamp(), "OpenAI: embeddings generated");

        //Clear previous vectors
        await clearPineconeIndex();
        console.log(timestamp(), "Pinecone: index cleared");

        // Save embeddings to Pinecone
        await saveEmbeddingsToPinecone(embeddings);
        console.log(timestamp(), "Pinecone: embeddings saved");
        console.log("======================================");

        res.json({ message: 'Document processed successfully' });
    } catch (error) {
        next(error);
    }
}