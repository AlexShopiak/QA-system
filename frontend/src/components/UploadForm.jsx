/* eslint-disable react/prop-types */
import { useState } from 'react';
import axios from 'axios';

const UploadForm = ({ setAnswer, setContext}) => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first.');
      return;
    }
    
    //clear the form after uploading a new file
    setAnswer(null);
    setContext([]);

    const formData = new FormData();
    formData.append('file', file);

    setStatus('Uploading and processing...');

    try {
      await axios.post('http://localhost:3000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setStatus('File processed successfully.');
    } catch (error) {
      console.error('Upload error:', error);
      setStatus('Error during upload. Please try again.');
    }
  };

  return (
    <div style={{ marginBottom: '30px', marginTop: '30px' }}>
      <h3>1. Upload pdf/txt Document</h3>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      <p>{status}</p>
    </div>
  );
};

export default UploadForm;
