import React from 'react';

const ProgressBar = ({ progress }) => {
    const progressPercentage = `${progress}%`;

    return (
        <div className="progress-bar">
            <div className="progress" style={{ width: progressPercentage }}>
                {progressPercentage}
            </div>
        </div>
    );
};

export default ProgressBar;