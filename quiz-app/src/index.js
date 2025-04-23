import React from 'react';
import ReactDOM from 'react-dom';
import Header from './components/Header';
import QuestionDisplay from './components/QuestionDisplay';
import AnswerOptions from './components/AnswerOptions';
import ResultDisplay from './components/ResultDisplay';
import ProgressBar from './components/ProgressBar';
import questions from './data/questions';

class QuizApp extends React.Component {
    state = {
        currentQuestionIndex: 0,
        selectedAnswer: null,
        correctAnswersCount: 0,
        showResult: false,
    };

    handleAnswerSelection = (answer) => {
        this.setState({ selectedAnswer: answer });
    };

    handleSubmitAnswer = () => {
        const { selectedAnswer, currentQuestionIndex } = this.state;
        const correctAnswer = questions[currentQuestionIndex].correctAnswer;

        if (selectedAnswer === correctAnswer) {
            this.setState((prevState) => ({
                correctAnswersCount: prevState.correctAnswersCount + 1,
            }));
        }

        this.setState({ showResult: true });
    };

    handleNextQuestion = () => {
        this.setState((prevState) => ({
            currentQuestionIndex: prevState.currentQuestionIndex + 1,
            selectedAnswer: null,
            showResult: false,
        }));
    };

    render() {
        const { currentQuestionIndex, showResult, selectedAnswer, correctAnswersCount } = this.state;
        const currentQuestion = questions[currentQuestionIndex];

        return (
            <div>
                <Header />
                <ProgressBar currentQuestionIndex={currentQuestionIndex} totalQuestions={questions.length} />
                {currentQuestion && !showResult && (
                    <QuestionDisplay question={currentQuestion.question} />
                )}
                {currentQuestion && !showResult && (
                    <AnswerOptions
                        options={currentQuestion.answerOptions}
                        onSelect={this.handleAnswerSelection}
                        selectedAnswer={selectedAnswer}
                    />
                )}
                {!showResult && (
                    <button onClick={this.handleSubmitAnswer}>解答</button>
                )}
                {showResult && (
                    <ResultDisplay
                        isCorrect={selectedAnswer === currentQuestion.correctAnswer}
                        correctAnswer={currentQuestion.correctAnswer}
                    />
                )}
                {showResult && currentQuestionIndex < questions.length - 1 && (
                    <button onClick={this.handleNextQuestion}>次の問題へ</button>
                )}
            </div>
        );
    }
}

ReactDOM.render(<QuizApp />, document.getElementById('root'));