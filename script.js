// 問題データの取得
let questions = [];
let correctAnswers = 0;

// 開始ボタンのイベントリスナー
document.getElementById('start-button').addEventListener('click', () => {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('quiz-container').classList.remove('hidden');
    startQuiz();
});

function startQuiz() {
    fetch('./data/questions.json')
        .then(response => response.json())
        .then(data => {
            // 問題をシャッフル
            questions = data.sort(() => Math.random() - 0.5);
            // 合計問題数を表示（最大80問まで）
            const totalQuestions = Math.min(questions.length, 80);
            document.getElementById('total-questions').textContent = totalQuestions;
            showQuestion(currentQuestionIndex);
        });
}

// 現在の問題インデックスを管理
let currentQuestionIndex = 0;

// 問題を表示する関数
function showQuestion(idx) {
    const question = questions[idx];
    // 現在の問題番号を更新（1から始まるように+1する）
    document.getElementById('current-number').textContent = idx + 1;
    
    document.getElementById('category').textContent = question.category;
    document.getElementById('question-text').textContent = question.question;
    
    const choicesContainer = document.getElementById('choices-container');
    choicesContainer.innerHTML = '';
    
    question.choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.className = 'choice-button';
        button.textContent = choice;
        button.addEventListener('click', () => checkAnswer(index));
        choicesContainer.appendChild(button);
    });

    // 結果表示をリセット
    document.getElementById('result').classList.add('hidden');
    document.getElementById('next-button').classList.add('hidden');
}

// 答え合わせの関数
function checkAnswer(selectedIndex) {
    const question = questions[currentQuestionIndex];
    const resultDiv = document.getElementById('result');
    const judgmentText = document.getElementById('judgment');
    const explanationText = document.getElementById('explanation');
    
    if (selectedIndex === question.answer) {
        judgmentText.textContent = '正解！';
        judgmentText.className = 'correct';
        correctAnswers++;
    } else {
        judgmentText.textContent = '不正解...';
        judgmentText.className = 'incorrect';
    }
    
    explanationText.textContent = question.explanation;
    resultDiv.classList.remove('hidden');
    
    // 選択肢を無効化
    const choices = document.querySelectorAll('.choice-button');
    choices.forEach(button => button.disabled = true);
    
    // 次の問題ボタンを表示
    const nextButton = document.getElementById('next-button');
    nextButton.classList.remove('hidden');
}

// 次の問題へ進む処理
document.getElementById('next-button').addEventListener('click', () => {
    currentQuestionIndex++;
    
    if (currentQuestionIndex >= Math.min(questions.length, 80)) {
        showQuizEnd();
    } else {
        showQuestion(currentQuestionIndex);
    }
});

// 終了ボタンのイベントリスナー
document.getElementById('end-button').addEventListener('click', () => {
    if (confirm('テストを終了しますか？残りの問題は不正解として扱われます。')) {
        const totalQuestions = Math.min(questions.length, 80);
        // 残りの問題を不正解として扱う（現在の正解数はそのまま）
        showQuizEnd();
    }
});

// クイズをリセットする関数
function resetQuiz() {
    currentQuestionIndex = 0;
    document.getElementById('current-number').textContent = 1;
    
    // 質問コンテナを表示、終了画面を非表示に
    document.getElementById('question-container').classList.remove('hidden');
    document.getElementById('quiz-end').classList.add('hidden');
    
    showQuestion(currentQuestionIndex);
}

function showQuizEnd() {
    const totalQuestions = Math.min(questions.length, 80);
    const percentage = (correctAnswers / totalQuestions * 100).toFixed(1);
    const isPassed = percentage >= 60;
    
    document.getElementById('question-container').classList.add('hidden');
    document.getElementById('quiz-end').classList.remove('hidden');
    document.getElementById('quiz-result').textContent = `${correctAnswers}問中${totalQuestions}問正解（正答率: ${percentage}%）`;
    document.getElementById('pass-fail').textContent = isPassed ? '合格です！' : '不合格です。';
    document.getElementById('pass-fail').className = isPassed ? 'pass' : 'fail';
}