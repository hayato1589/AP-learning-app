import React from 'react';

interface Exercise {
    id: number;
    title: string;
    options: string[];
}

interface ExerciseListProps {
    exercises: Exercise[];
    onSelect: (id: number) => void;
}

const ExerciseList: React.FC<ExerciseListProps> = ({ exercises, onSelect }) => {
    return (
        <div>
            <h2>問題リスト</h2>
            <ul>
                {exercises.map(exercise => (
                    <li key={exercise.id}>
                        <h3>{exercise.title}</h3>
                        <ul>
                            {exercise.options.map((option, index) => (
                                <li key={index}>{option}</li>
                            ))}
                        </ul>
                        <button onClick={() => onSelect(exercise.id)}>選択</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ExerciseList;