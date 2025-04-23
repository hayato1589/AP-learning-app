import React from 'react';

const ResultDisplay = ({ isCorrect, correctAnswer }) => {
    return (
        <div className="result-display">
            {isCorrect ? (
                <h2>○ 正解！</h2>
            ) : (
                <h2>✕ 不正解。正解は: {correctAnswer}</h2>
            )}
        </div>
    );
};

export default ResultDisplay;