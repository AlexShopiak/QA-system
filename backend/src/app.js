import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import cors from 'cors';

import { initializePinecone } from './services/pinecone.js';
import { handleUpload } from './handlers/uploadHandler.js';
import { handleQA } from './handlers/qaHandler.js';
import { timestamp } from './utils/timestamp.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

await initializePinecone();
console.log(timestamp(), "Pinecone: initialized.");

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

app.post('/upload', upload.single('file'), handleUpload);
app.post('/qa', handleQA);

app.use((err, req, res) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(timestamp(), `Server is running on http://localhost:${port}`);
});
