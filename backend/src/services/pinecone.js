import { Pinecone } from '@pinecone-database/pinecone';
import { generateOneEmbeddingWithGPT } from '../services/openai.js';
import { timestamp } from '../utils/timestamp.js';
import dotenv from 'dotenv';

dotenv.config();

const pc = new Pinecone({ apiKey: process.env.PINCONE_API_KEY });
const index = pc.Index(process.env.PINECONE_INDEX_NAME);


/**
 * Initializes the Pinecone index.
 * 
 * @async
 * @function initializePinecone
 * @throws {Error} - Throws an error if Pinecone cannot be initialized.
 */
export const initializePinecone = async () => {
    const indexList = await pc.listIndexes();

    let indexExists = false;
    for (const index of indexList.indexes) {
        if(index.name === process.env.PINECONE_INDEX_NAME) indexExists = true;
    }
    console.log(timestamp(), "Pinecone: index exist -", indexExists);

    if (!indexExists) {
        await pc.createIndex({
            name: process.env.PINECONE_INDEX_NAME,
            dimension: 1536,
            metric: 'cosine',
            spec: {
                serverless: { cloud: 'aws', region: 'us-east-1' }
            }
        });
        console.log(timestamp(), "Pinecone: index created");
    }
};


/**
 * Saves embeddings to the Pinecone index.
 * 
 * @async
 * @function saveEmbeddingsToPinecone
 * @param {Array} embeddings - The list of embeddings to be saved to Pinecone.
 * @throws {Error} - Throws an error if the embedding upsert operation fails.
 */
export const saveEmbeddingsToPinecone = async (embeddings) => {
    //await index.upsert(embeddings);

    const upsertResponse = await fetch(`https://${process.env.PINCONE_HOST_NAME}/vectors/upsert`, {
        method: "POST",
        headers: {
            "Api-Key": process.env.PINCONE_API_KEY,
            "Content-Type": "application/json",
            "X-Pinecone-API-Version": "2025-04"
        },
        body: JSON.stringify({
            vectors: embeddings,
        })
    })

    const upsertLSN = parseInt(upsertResponse.headers.get('x-pinecone-request-lsn'));
    return upsertLSN;
};


/**
 * Retrieves relevant chunks from Pinecone based on the user's question.
 * 
 * @async
 * @function retrieveRelevantChunksFromPinecone
 * @param {string} question - The user's question to find relevant chunks for.
 * @returns {Promise<Array>} - A list of relevant chunks with text and confidence scores.
 * @throws {Error} - Throws an error if the query to Pinecone fails.
 * 
 */
export const retrieveRelevantChunksFromPinecone = async (question) => {
    const queryEmbedding = await generateOneEmbeddingWithGPT(question);

    const result = await index.query({
        vector: queryEmbedding,
        topK: 3, //up to 3 similar chunks
        includeMetadata: true,
    });

    //Filter chunks accorfing to min. confidence score value
    const minScoreThreshold = 0.7; //NO less then 0.7 score 
    const relevantChunks = result.matches.filter((match) => match.score >= minScoreThreshold)

    if (relevantChunks.length === 0) {
        console.log(timestamp(), "Pinecone: no relevant chunks found.");
        return [];
    }

    return relevantChunks.map((match) => ({
        text: match.metadata.text,
        score: match.score
    }));
};

/**
 * Clears all data from the Pinecone index.
 *  
 * @async
 * @function clearPineconeIndex
 * @throws {Error} - Throws an error if there is an issue clearing the Pinecone index.
 */
export const clearPineconeIndex = async () => {
    try {   
        //await index.deleteAll();  //resets SLN to zero
        //await waitUntilRecordsEqual(0);
        
        const ids = await index.listPaginated();
        for (const vec of ids.vectors) {
            await index.deleteOne(vec.id)
        }
    } catch (error) {
        console.error("Error clearing Pinecone index:", error);
    }
}

export const LSNQueryToPinecone = async () => {
    const testVector = new Array(1536).fill(0);
    testVector[0]=1;

    const queryResponse =  await fetch(`https://${process.env.PINCONE_HOST_NAME}/query`, {
        method: "POST",
        headers: {
            "Api-Key": process.env.PINCONE_API_KEY,
            "Content-Type": "application/json",
            "X-Pinecone-API-Version": "2025-04"
        },
        body: JSON.stringify({
            vector: testVector,
            namespace:"__default__",
            topK: 3,
            includeValues: true,
        })
    })
    
    const queryLSN = parseInt(queryResponse.headers.get('x-pinecone-max-indexed-lsn'));
    return queryLSN;
};

