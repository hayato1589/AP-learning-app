import React from 'react';

interface ExerciseDetailProps {
    question: string;
    options: string[];
    correctAnswer: string;
    userAnswer: string | null;
    onAnswer: (answer: string) => void;
    explanation: string;
}

const ExerciseDetail: React.FC<ExerciseDetailProps> = ({
    question,
    options,
    correctAnswer,
    userAnswer,
    onAnswer,
    explanation,
}) => {
    const isCorrect = userAnswer === correctAnswer;

    return (
        <div className="exercise-detail">
            <h2>問題</h2>
            <p>{question}</p>
            <div className="options">
                {options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => onAnswer(option)}
                        className={userAnswer === option ? (isCorrect ? 'correct' : 'incorrect') : ''}
                    >
                        {option}
                    </button>
                ))}
            </div>
            {userAnswer && (
                <div className="result">
                    <p>{isCorrect ? '正解です！' : '不正解です。'}</p>
                    <p>解説: {explanation}</p>
                </div>
            )}
        </div>
    );
};

export default ExerciseDetail;