// src/types/index.ts

export interface Exercise {
    id: number;
    title: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
}

export interface UserProgress {
    exerciseId: number;
    selectedOption: string;
    isCorrect: boolean;
}

export interface NavigationItem {
    name: string;
    path: string;
}