import React from 'react';

const QuestionDisplay = ({ question, questionNumber, totalQuestions }) => {
    return (
        <div className="question-display">
            <h2>Q{questionNumber} / {totalQuestions}</h2>
            <p>{question.text}</p>
        </div>
    );
};

export default QuestionDisplay;