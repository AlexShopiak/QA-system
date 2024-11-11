/* eslint-disable react/prop-types */
const ResultsPanel = ({ answer, context }) => {
    return (
        <div>
            <h3>Answer</h3>
            {answer ? (
                <p>{answer}</p>
            ) : (
                <p>No answer available. Please ask a question.</p>
            )}

            <br />
            
            <h3>Relevant Context</h3>
            {context.length > 0 ? (
                <ul>
                {context.map((chunk, index) => (<li key={index}>
                    <div>{chunk.text}</div>
                    <div><strong>Confidence Score:</strong> {chunk.score.toFixed(2)}</div>
                </li>))}
                </ul>
            ) : (
                <p>No relevant context found.</p>
            )}
        </div>
    );
};

export default ResultsPanel;
