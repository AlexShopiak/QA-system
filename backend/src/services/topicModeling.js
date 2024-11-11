import { spawn } from 'child_process';


/**
 * Runs topic modeling analysis using a Python script.
 * 
 * @async
 * @function runTopicModeling
 * @param {string} docId - The unique identifier for the document to be processed.
 * @param {Array<string>} text - An array of text chunks to be analyzed for topic modeling.
 * @returns {Promise<string>} - A Promise that resolves with the result from the Python script, or rejects if there is an error.
 * @throws {Error} - Throws an error if the Python script fails to execute or if the output cannot be parsed.
 */
export const runTopicModeling = (docId, text) => {
    return new Promise((resolve, reject) => {
        const inputData = JSON.stringify({ doc_id: docId, text });

        const pythonProcess = spawn('python', ['./../scripts/topic_modeling.py', inputData]);

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(`Python script error: ${errorOutput}`);
            } else {
                try {
                    // FIXME: Fails to parse. Output datatype should be checked when returning from the Py script.
                    const result = output;//JSON.parse(output);
                    resolve(result);
                } catch (error) {
                    reject(`JSON parse error: ${error.message}`);
                }
            }
        });
    });
};
