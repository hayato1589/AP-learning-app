import React from 'react';
import ExerciseList from '../components/ExerciseList';
import ExerciseDetail from '../components/ExerciseDetail';

const Exercise: React.FC = () => {
    return (
        <div>
            <h1>問題演習</h1>
            <ExerciseList />
            <ExerciseDetail />
        </div>
    );
};

export default Exercise;