import React from 'react';

const AnswerOptions = ({ options, onSelect }) => {
    return (
        <div className="answer-options">
            {options.map((option, index) => (
                <button key={index} onClick={() => onSelect(option)}>
                    {option}
                </button>
            ))}
        </div>
    );
};

export default AnswerOptions;