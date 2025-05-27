import { queryGPT } from '../services/openai.js';
import pdfParse from 'pdf-parse';
import nlp from "compromise";
import lda from 'lda';


/**
 * Extracts text from a buffer based on the file type (PDF or plain text).
 * 
 * @async
 * @function extractText
 * @param {Buffer} buffer - The file buffer containing the document data.
 * @param {string} filename - The name of the file to determine its type.
 * @returns {Promise<string|Error>} - The extracted text if successful, or an error if the file type is unsupported.
 * @throws {Error} - Throws an error if the file type is unsupported.
 */
export const extractText = async (buffer, filename) => {
    if (filename.endsWith('.pdf')) {
      const data = await pdfParse(buffer); // FIXME: Gives Warning. Creator reported bugs in the library
      return data.text;
    } else if (filename.endsWith('.txt')){
      return buffer.toString('utf-8');
    } else {
      return new Error('Unsupported file type')
    }
};


/**
 * Cleans the input text by removing excessive whitespace and non-informative characters.
 * 
 * @function cleanText
 * @param {string} text - The input text to be cleaned.
 * @returns {string} - The cleaned text.
 */
export const cleanText = (text) => {
    // Remove whitespaces
    let cleanedText = text.replace(/\s+/g, ' ').trim(); 
    //Remove non-informative characters like emoji or excessive punctuation
    //cleanedText = cleanedText.replace(/[^\w\s,.?!]/g, '');

    // Keep letters (Unicode), digits, spaces, punctuation
    cleanedText = cleanedText.replace(/[^\p{L}\p{N}\s,.?!]/gu, '');
    
    return cleanedText;
}


/**
 * Splits text into chunks of sentences with a total length of up to 1000 characters.
 * 
 * @function chunkText
 * @param {string} text - The input text to be chunked.
 * @returns {Array<Object>} - An array of chunked objects, each containing an `id` and `text`.
 */
export const chunkText = (text) => {
  const maxTokens = 1000;
  const sentences = text.split('. ');
  const chunks = [];
  
  let counter = 0;
  let currentChunk = '';

  for (let sentence of sentences) {
      if ((currentChunk + sentence).length > maxTokens) {
          chunks.push({ id: `chunk_${counter}`, text: currentChunk })
          counter++;

          //Start new chunk
          currentChunk = sentence;
      } else {
          //add nothing if the chunk empty or add dot as a divider
          currentChunk += (currentChunk ? '. ' : '') + sentence;
      }
  }

  //Add last chunk if it didnt reach 1000 symbols
  if (currentChunk) {
    chunks.push({ id: `chunk_${counter}`, text: currentChunk }); 
  }

  return chunks;
};


/**
 * Extracts named entities (people, places, organizations) from the input text.
 * 
 * @function getEntitiesFromText
 * @param {string} text - The input text from which entities are to be extracted.
 * @returns {Array<string>} - An array of named entities.
 */
export const getEntitiesFromText = (text) => {
  const doc = nlp(text);
  const people = doc.people().out('array');
  const places = doc.places().out('array');
  const organizations = doc.organizations().out('array');

  // Combine extracted entities
  const entities = [...people, ...places, ...organizations];
  return entities;
};


/**
 * Extracts topics from the input text.
 * 
 * @function getEntitiesFromText
 * @param {string} text - The input text from which topics are to be extracted.
 * @returns {Array<string>} - An array of topics.
 */
export const getTopicsFromText = (text) => {
    const sentences = text.match( /[^\.!\?]+[\.!\?]+/g );
    if (!sentences || sentences.length === 0) return [];

    const ldaResult = lda(sentences, 1, 5); 
    if (!Array.isArray(ldaResult) || !Array.isArray(ldaResult[0])) return [];

    const topicsArr = ldaResult[0];
    const topics = [];
    
    for (const el of topicsArr) {
      topics.push(el.term);
    }
    return topics;
}


/**
 * Splits text into chunks of 3 sentences each. Not in use now
 * 
 * @function chunkTextSimple
 * @param {string} text - The input text to be chunked.
 * @returns {Array<Object>} - An array of chunked objects, each containing an `id` and `text`.
 */
/*
export const chunkTextSimple = (text) => {
    const sentences = text.split('. ');
    const chunks = [];
    for (let i = 0; i < sentences.length; i += 3) {
      chunks.push({ id: `chunk_${i}`, text: sentences.slice(i, i + 3).join('. ') });
    }
    return chunks;
};*/

/**
 * Extracts named entities (people, places, organizations) from the input text using GPT-4. Not in use now
 * @async
 * @function getEntitiesFromTextWithGPT
 * @param {string} text - The input text from which entities are to be extracted.
 * @returns {Promise<Array<string>>} - A Promise that resolves with an array of named entities.
 * @throws {Error} - Throws an error if the GPT API call or entity parsing fails.
 * 
 */
/*
export const getEntitiesFromTextWithGPT = async (text) => {
  const prompt = `
    Analyze the following text and extract named entities. Provide the results in JSON format with the following keys:
    - "people": list of names of people
    - "places": list of names of places
    - "organizations": list of names of organizations

    Text: "${text}"
    
    Response format:
    {
      "people": [],
      "places": [],
      "organizations": []
    }
  `;

  try {
    const response = await queryGPT(prompt);
    const entities = JSON.parse(response);

    const allEntities = [
      ...entities.people,
      ...entities.places,
      ...entities.organizations
    ];

    return allEntities;
  } catch (error) {
    console.error('Error performing NER with GPT:', error);
    return {
      people: [],
      places: [],
      organizations: []
    };
  }
};*/
