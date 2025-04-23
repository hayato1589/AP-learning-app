// 問題データの取得
let questions = [];
fetch('./data/questions.json')
    .then(response => response.json())
    .then(data => {
        questions = data;
        // 合計問題数を表示（最大80問まで）
        const totalQuestions = Math.min(data.length, 80);
        document.getElementById('total-questions').textContent = totalQuestions;
        showQuestion(currentQuestionIndex);
    });

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
        // 全問終了時の処理
        document.getElementById('question-container').classList.add('hidden');
        document.getElementById('quiz-end').classList.remove('hidden');
    } else {
        showQuestion(currentQuestionIndex);
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