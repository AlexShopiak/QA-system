/* eslint-disable react/prop-types */
import { useState } from 'react';
import axios from 'axios';

const QuestionForm = ({ setAnswer, setContext }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!question) {
      alert('Please enter a question.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/qa', { question });
      setAnswer(response.data.answer);
      setContext(response.data.context);
    } catch (error) {
      console.error('Question error:', error);
      alert('Error during question answering. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: '30px' }}>
      <h3>2. Ask a Question</h3>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Enter your question here"
        style={{ width: '300px' }}
      />
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Processing...' : 'Submit'}
      </button>
    </div>
  );
};

export default QuestionForm;
