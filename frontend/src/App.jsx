import './App.css';
import { useState } from 'react';
import UploadForm from './components/UploadForm';
import QuestionForm from './components/QuestionForm';
import ResultsPanel from './components/ResultsPanel';

const App = () => {
  const [answer, setAnswer] = useState(null);
  const [context, setContext] = useState([]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>AI-Enhanced Document QA System</h1><hr/>
      <UploadForm setAnswer={setAnswer} setContext={setContext} />
      <QuestionForm setAnswer={setAnswer} setContext={setContext} />
      <ResultsPanel answer={answer} context={context} />
    </div>
  );
};

export default App;
