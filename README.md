# AI-Enhanced Document QA System

## 🚀 Intro
This project is an AI-powered document QA system prototype. It uses AI models and a vector database for efficient information retrieval and QA. The system includes a backend (Node.js), a frontend (React), and a Python script for topic modeling.

## 🛠️ Setup Instructions

### Prerequisites
- **Node.js** v16+ and **npm**
- **Python** 3.8+ and **pip**

### 1. Clone the Repository
```bash
git clone https://github.com/AlexShopiak/QA-system.git
cd QA-system
```

### 2. Backend Setup
- Install dependencies:
```bash
cd backend
npm install
```

- Setup environment variables:
<pre style="user-select: none;">
- Find the backend.env file provided to you privately. This file contains sensitive environment variables.
- Copy the backend.env file into the 'backend' directory.
- Rename the file from backend.env to .env
</pre>

- Start the backend server:
```bash
npm start
```

### 3. Python Script Setup
- Install dependencies:
```bash
cd scripts
pip install -r requirements.txt
```
- Setup environment variables:
<pre style="user-select: none;">
- Find the scripts.env file provided to you privately. This file contains sensitive environment variables.
- Copy the scripts.env file into the 'scripts' directory.
- Rename the file from scripts.env to .env
</pre>

### 4. Frontend Setup
- Install dependencies:
```bash
cd frontend
npm install
```

- Start the React app in the developer mode:
```bash
npm run dev
```

- Open the application in your browser at this address:
```bash
http://localhost:5173
```


## 📚 Assumptions made
- **Inprove chunking**: Consider using chunking libraries available in the NPM or improve current algorithm so that it is based not only on text size but on the text context as well.

- **Embedding Generation Libraries in NPM**: Explore and integrate efficient embedding generation libraries available in the NPM. Performance and efficiency comparison should be conducted between these libraries and the GPT-4 embedding generation process to identify the most cost-effective solution.

- **Efficient GPT usage**: Consider using GPT-3.5 instead of GPT-4 since it generates less number of tokens. Create a smart prompt template to ensure that GPT gives short answers where it is possible to reduce the number of tokens used.

- **File Type Support Expansion**: Extend the system’s capabilities to support additional file formats beyond PDF and plain text to ensure broader compatibility with various document types used in different industries.

- **Image Processing Integration**: Implement image processing functionality to enable the extraction of text from the documents’ images in order to expand the system’s ability to process visual data and integrate it into the document QA pipeline.

## 🔍 Approach Explanation
- **Document Ingestion**: Backend extracts text from the uploaded files. The extracted text is cleaned and chunked to optimize context for embedding generation and reduce number of tokens used. NER is performed on each chunk to extract key entities, which are appended to the text for better embedding context.

- **Embedding Generation**: Chunks are processed using the text-embedding-ada-002 model to generate vector embeddings. The generated embeddings are stored in Pinecone, along with metadata for efficient retrieval.

- **Topic Modeling**: Python script performs basic topic modeling on the ingested documents to extract key topics. The extracted topics are added to the metadata in Pinecone to enhance search relevance.

- **Retrieval Augmented Generation**: When a user asks a question, the system retrieves the most relevant document chunks based on vector similarity from Pinecone and filters them according to the minimal confidence score. The retrieved context is combined with the user's query and sent to GPT-4 for generating a comprehensive answer.

## 🚧 Challenges Faced
- **Rate Limits**: Handling rate limits for the OpenAI API required implementing an efficient GPT-4 promting pipeline and text processing uncluding document cleaning and chunking, relevant chunks retrieval and filtering.

- **Chunking Strategy**: Finding the optimal chunk size was challenging; it needed to balance context preservation with manageable input lengths for embedding.

- **Retrieval Strategy**: Finding the optimal relevant chunk number and minimal confidense score was challenging; it needed to balance context preservation with manageable context lengths for GPT quering.

- **Pinecone Integration**: Ensuring seamless integration between the Python script and Pinecone vector database required implementing a re-fetch mechanism to ensure successful document retrival before topic modeling.


