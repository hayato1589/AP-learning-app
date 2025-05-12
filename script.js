// 問題データの取得
let questions = [];
let correctAnswers = 0;
let userAnswers = [];
let favoriteQuestions = [];
let bookmarkedQuestions = [];
let isReviewBookmarksMode = false;
let reviewQuestions = [];
let reviewAnswers = [];
let timer = null;
let timerSeconds = 60; // 1問あたりの制限秒数
let timerInterval = null;
let selectedQuestionCount = 10;

const FAVORITE_LIMIT = 50;

// 出題数指定の取得
const questionCountInput = document.getElementById('question-count');
if (questionCountInput) {
    questionCountInput.addEventListener('change', (e) => {
        selectedQuestionCount = Math.max(1, Math.min(80, parseInt(e.target.value) || 10));
    });
}

// 開始ボタンのイベントリスナー
document.getElementById('start-button').addEventListener('click', () => {
    isReviewBookmarksMode = false; // ← ここを追加
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('quiz-container').classList.remove('hidden');
    startQuiz(false); // ← これだけでOK
});

// ブックマーク復習ボタン
const reviewBookmarksButton = document.getElementById('review-bookmarks-button');
if (reviewBookmarksButton) {
    reviewBookmarksButton.addEventListener('click', () => {
        if (bookmarkedQuestions.length === 0) {
            alert('ブックマークされた問題がありません。');
            return;
        }
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('quiz-container').classList.remove('hidden');
        startQuiz(true); // これだけでOK
    });
}

// ローカルストレージからお気に入りを復元
function loadFavorites() {
    const fav = localStorage.getItem('favoriteQuestions');
    if (fav) {
        try {
            const arr = JSON.parse(fav);
            if (Array.isArray(arr)) favoriteQuestions = arr;
        } catch {}
    }
}
// ローカルストレージにお気に入りを保存
function saveFavorites() {
    localStorage.setItem('favoriteQuestions', JSON.stringify(favoriteQuestions));
}
// お気に入り件数表示・ボタン制御
function updateFavoriteUI() {
    const count = favoriteQuestions.length;
    document.getElementById('favorite-count').textContent = count;
    const favQuizBtn = document.getElementById('favorite-quiz-button');
    const favListBtn = document.getElementById('favorite-list-button');
    if (count > 0) {
        favQuizBtn.classList.remove('hidden');
        favQuizBtn.disabled = false;
        favListBtn.classList.remove('hidden');
        favListBtn.disabled = false;
    } else {
        favQuizBtn.classList.add('hidden');
        favQuizBtn.disabled = true;
        favListBtn.classList.add('hidden');
        favListBtn.disabled = true;
    }
}
// 一時メッセージ表示
function showTempMessage(msg, color = '#f1c40f') {
    const el = document.getElementById('temp-message');
    el.textContent = msg;
    el.style.background = color;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 1500);
}

// お気に入りID生成（問題文+カテゴリで一意化）
function getQuestionId(q) {
    return q && q.question ? `${q.category}__${q.question}` : '';
}

function startQuiz(isReviewBookmarks = false) {
    isReviewBookmarksMode = !!isReviewBookmarks; // ← ここで必ずboolean化
    // バッジを必ず非表示にする
    const reviewBadge = document.getElementById('review-mode-badge');
    if (reviewBadge) reviewBadge.classList.add('hidden');
    correctAnswers = 0;
    userAnswers = [];
    currentQuestionIndex = 0;
    if (isReviewBookmarks) {
        questions = [...bookmarkedQuestions];
        document.getElementById('total-questions').textContent = questions.length;
        showQuestion(currentQuestionIndex);
    } else {
        fetch('./data/questions.json')
            .then(response => response.json())
            .then(data => {
                // 問題をシャッフル
                questions = data.sort(() => Math.random() - 0.5).slice(0, selectedQuestionCount);
                document.getElementById('total-questions').textContent = questions.length;
                showQuestion(currentQuestionIndex);
            });
    }
}

let currentQuestionIndex = 0;

function startTimer() {
    clearTimer();
    timerSeconds = 60;
    document.getElementById('timer-seconds').textContent = timerSeconds;
    document.getElementById('timer').style.color = '';
    timerInterval = setInterval(() => {
        timerSeconds--;
        document.getElementById('timer-seconds').textContent = timerSeconds;
        if (timerSeconds <= 5) {
            document.getElementById('timer').style.color = '#e74c3c';
        }
        if (timerSeconds <= 0) {
            clearTimer();
            handleTimeout();
        }
    }, 1000);
}
function clearTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}
function handleTimeout() {
    // タイムアウト時は自動で不正解扱いし、次の問題へ
    checkAnswer(null, true);
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex >= Math.min(questions.length, 80)) {
            showQuizEnd();
        } else {
            showQuestion(currentQuestionIndex);
        }
    }, 1200);
}

function showQuestion(idx) {
    clearTimer();
    const question = questions[idx];
    document.getElementById('current-number').textContent = idx + 1;
    document.getElementById('category').textContent = question.category;
    document.getElementById('question-text').textContent = question.question;
    // 復習モードバッジ表示切替
    const reviewBadge = document.getElementById('review-mode-badge');
    if (isReviewBookmarksMode && reviewBadge) {
        reviewBadge.classList.remove('hidden');
    } else if (reviewBadge) {
        reviewBadge.classList.add('hidden');
    }
    // お気に入り・ブックマークボタン状態
    const q = questions[idx];
    const qid = getQuestionId(q);
    const favIdx = favoriteQuestions.findIndex(fq => getQuestionId(fq) === qid);
    favoriteButton.classList.toggle('favorite-active', favIdx !== -1);
    favoriteButton.setAttribute('aria-label', favIdx !== -1 ? 'お気に入りから削除' : 'お気に入りに追加');
    favoriteButton.setAttribute('title', favIdx !== -1 ? 'お気に入りから削除' : 'お気に入りに追加');
    document.getElementById('bookmark-button').classList.toggle('active', bookmarkedQuestions.includes(question));
    
    const choicesContainer = document.getElementById('choices-container');
    choicesContainer.innerHTML = '';
    const choicesSection = document.createElement('div');
    choicesSection.className = 'choices-section';
    question.choices.forEach((choice, index) => {
        const choiceContainer = document.createElement('div');
        choiceContainer.className = 'choice-container';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `choice-${index}`;
        checkbox.name = 'quiz-choice';
        checkbox.className = 'choice-checkbox';
        checkbox.value = index;
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                document.querySelectorAll('.choice-checkbox').forEach(cb => {
                    if (cb !== checkbox) cb.checked = false;
                });
                checkAnswer(index);
                // 正解・不正解の色付け
                const question = questions[currentQuestionIndex];
                document.querySelectorAll('.choice-checkbox').forEach((cb, idx) => {
                    const label = document.querySelector(`label[for="choice-${idx}"]`);
                    if (label) {
                        if (idx === question.answer) {
                            label.classList.add('correct-answer');
                            label.style.backgroundColor = '#d4edda';
                        } else if (cb.checked) {
                            label.classList.add('incorrect-answer');
                            label.style.backgroundColor = '#f8d7da';
                        }
                    }
                });
            }
        });
        const choiceText = document.createElement('label');
        choiceText.htmlFor = `choice-${index}`;
        choiceText.className = 'choice-text';
        choiceText.textContent = choice;
        choiceText.addEventListener('click', (event) => {
            if (!document.getElementById('result').classList.contains('hidden')) {
                return;
            }
            event.preventDefault();
            if (choiceText.classList.contains('grayed-out')) {
                choiceText.classList.remove('grayed-out');
                checkbox.disabled = false;
            } else {
                choiceText.classList.add('grayed-out');
                checkbox.disabled = true;
            }
        });
        choiceContainer.appendChild(checkbox);
        choiceContainer.appendChild(choiceText);
        choicesSection.appendChild(choiceContainer);
    });
    choicesContainer.appendChild(choicesSection);
    document.getElementById('result').classList.add('hidden');
    document.getElementById('next-button').classList.add('hidden');
    if (idx > 0) {
        prevButton.classList.remove('hidden');
    } else {
        prevButton.classList.add('hidden');
    }
    startTimer();
}

// お気に入りボタン
const favoriteButton = document.getElementById('favorite-button');
if (favoriteButton) {
    favoriteButton.addEventListener('click', () => {
        const q = questions[currentQuestionIndex];
        const qid = getQuestionId(q);
        const idx = favoriteQuestions.findIndex(fq => getQuestionId(fq) === qid);
        if (idx === -1) {
            if (favoriteQuestions.length >= FAVORITE_LIMIT) {
                showTempMessage('お気に入りは最大50問までです', '#e74c3c');
                return;
            }
            favoriteQuestions.push(q);
            favoriteButton.classList.add('favorite-active');
            favoriteButton.setAttribute('aria-label', 'お気に入りから削除');
            favoriteButton.setAttribute('title', 'お気に入りから削除');
            showTempMessage('お気に入りに追加しました', '#f1c40f');
        } else {
            favoriteQuestions.splice(idx, 1);
            favoriteButton.classList.remove('favorite-active');
            favoriteButton.setAttribute('aria-label', 'お気に入りに追加');
            favoriteButton.setAttribute('title', 'お気に入りに追加');
            showTempMessage('お気に入りから削除しました', '#95a5a6');
        }
        saveFavorites();
        updateFavoriteUI();
    });
}

// ブックマークボタン
const bookmarkButton = document.getElementById('bookmark-button');
if (bookmarkButton) {
    bookmarkButton.addEventListener('click', () => {
        const q = questions[currentQuestionIndex];
        const idx = bookmarkedQuestions.indexOf(q);
        if (idx === -1) {
            bookmarkedQuestions.push(q);
            bookmarkButton.classList.add('active');
            // スタート画面の復習ボタン表示
            document.getElementById('review-bookmarks-button').classList.remove('hidden');
        } else {
            bookmarkedQuestions.splice(idx, 1);
            bookmarkButton.classList.remove('active');
            if (bookmarkedQuestions.length === 0) {
                document.getElementById('review-bookmarks-button').classList.add('hidden');
            }
        }
    });
}

function checkAnswer(selectedAnswer, isTimeout = false) {
    clearTimer();
    const question = questions[currentQuestionIndex];
    userAnswers[currentQuestionIndex] = selectedAnswer;
    const resultDiv = document.getElementById('result');
    const judgmentText = document.getElementById('judgment');
    const explanationText = document.getElementById('explanation');
    const checkboxes = document.querySelectorAll('.choice-checkbox');
    checkboxes.forEach(checkbox => checkbox.disabled = true);
    let isCorrect = false;
    if (selectedAnswer === question.answer) {
        isCorrect = true;
        judgmentText.textContent = '正解！';
        judgmentText.className = 'correct';
        correctAnswers++;
    } else if (isTimeout) {
        judgmentText.textContent = '時間切れ...';
        judgmentText.className = 'incorrect';
    } else {
        judgmentText.textContent = '不正解...';
        judgmentText.className = 'incorrect';
        // 間違えた問題は自動でブックマーク
        if (!bookmarkedQuestions.includes(question)) {
            bookmarkedQuestions.push(question);
            document.getElementById('bookmark-button').classList.add('active');
            document.getElementById('review-bookmarks-button').classList.remove('hidden');
        }
    }
    explanationText.textContent = question.explanation;
    resultDiv.classList.remove('hidden');
    document.getElementById('next-button').classList.remove('hidden');
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

// 戻るボタンのイベントリスナー
const prevButton = document.getElementById('prev-button');
prevButton.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion(currentQuestionIndex);

        // 次の問題ボタンを表示するかどうかを更新
        document.getElementById('next-button').classList.remove('hidden');

        // 最初の問題に戻った場合、戻るボタンを非表示
        if (currentQuestionIndex === 0) {
            prevButton.classList.add('hidden');
        }
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
    correctAnswers = 0;
    userAnswers = [];
    isReviewBookmarksMode = false; // ← 追加: 復習モード状態をリセット
    // 最初の画面を表示し、他を非表示に
    document.getElementById('start-screen').classList.remove('hidden');
    document.getElementById('quiz-container').classList.add('hidden');
    document.getElementById('quiz-end').classList.add('hidden');
    document.getElementById('end-button').classList.remove('hidden');
    // ★ バッジを必ず非表示にする
    const reviewBadge = document.getElementById('review-mode-badge');
    if (reviewBadge) reviewBadge.classList.add('hidden');
    // 必要なら他の状態もリセット
    updateFavoriteUI();
}

function showQuizEnd() {
    clearTimer();
    document.getElementById('quiz-container').classList.add('hidden');
    document.getElementById('quiz-end').classList.remove('hidden');
    // ★ バッジを必ず非表示にする
    const reviewBadge = document.getElementById('review-mode-badge');
    if (reviewBadge) reviewBadge.classList.add('hidden');
    // 復習モード時はタイトル・メッセージを変更
    const endTitle = document.getElementById('quiz-end-title');
    const endMsg = document.getElementById('quiz-end-message');
    if (isReviewBookmarksMode) {
        if (endTitle) endTitle.textContent = '復習モードで終了';
        if (endMsg) endMsg.textContent = 'ブックマーク復習モードの全問題が終了しました。';
    } else {
        if (endTitle) endTitle.textContent = 'お疲れ様でした！';
        if (endMsg) endMsg.textContent = '全ての問題が終了しました。';
    }
    const totalQuestions = Math.min(questions.length, 80);
    const percentage = (correctAnswers / totalQuestions * 100).toFixed(1);
    const isPassed = percentage >= 60;

    document.getElementById('quiz-result').textContent = `${correctAnswers}問中${totalQuestions}問正解（正答率: ${percentage}%）`;
    document.getElementById('pass-fail').textContent = isPassed ? '合格です！' : '不合格です。';
    document.getElementById('pass-fail').className = isPassed ? 'pass' : 'fail';

    document.getElementById('prev-button').classList.add('hidden');
    document.getElementById('end-button').classList.add('hidden');

    // グリッド形式で表示
    const resultsGrid = document.createElement('div');
    resultsGrid.id = 'results-grid';

    questions.slice(0, totalQuestions).forEach((question, index) => {
        const item = document.createElement('div');
        const isCorrect = question.answer === userAnswers[index];
        item.textContent = `${index + 1}:${isCorrect ? '〇' : '×'}`;
        item.className = isCorrect ? 'correct-answer' : 'incorrect-answer';
        item.style.cursor = 'pointer';
        item.title = 'この問題を下に表示します';
        item.addEventListener('click', () => {
            showReviewQuestion(index);
        });
        resultsGrid.appendChild(item);
    });

    // 既存のリストやグリッドがあれば削除
    const quizEndContainer = document.getElementById('quiz-end');
    const oldList = document.getElementById('results-list');
    if (oldList) oldList.remove();
    const oldGrid = document.getElementById('results-grid');
    if (oldGrid) oldGrid.remove();
    quizEndContainer.appendChild(resultsGrid);

    // 案内文を追加（任意）
    let guide = document.getElementById('review-guide');
    if (!guide) {
        guide = document.createElement('div');
        guide.id = 'review-guide';
        guide.style.margin = '12px 0';
        guide.textContent = '番号をクリックするとその問題を下に表示します。';
        quizEndContainer.insertBefore(guide, resultsGrid);
    }

    // レビューエリアを初期化
    let reviewArea = document.getElementById('review-question');
    if (!reviewArea) {
        reviewArea = document.createElement('div');
        reviewArea.id = 'review-question';
        quizEndContainer.appendChild(reviewArea);
    }
    reviewArea.innerHTML = '';
}

// 問題内容を下部に表示する関数
function showReviewQuestion(index) {
    const question = questions[index];
    const userAnswer = userAnswers[index];
    const reviewArea = document.getElementById('review-question');
    if (!reviewArea) return;

    // 選択肢リストを作成
    let choicesHtml = '<ul>';
    question.choices.forEach((choice, i) => {
        let style = '';
        if (i === question.answer) {
            style = 'style="color: #155724; font-weight: bold;"'; // 正解は緑
        } else if (i === userAnswer) {
            style = 'style="color: #721c24;"'; // ユーザー誤答は赤
        }
        choicesHtml += `<li ${style}>${choice}${i === question.answer ? '（正解）' : ''}${i === userAnswer && i !== question.answer ? '（あなたの回答）' : ''}</li>`;
    });
    choicesHtml += '</ul>';

    reviewArea.innerHTML = `
        <div class="review-question-box" style="margin-top:24px;padding:16px;border:1px solid #ccc;border-radius:8px;">
            <div><strong>カテゴリ:</strong> ${question.category}</div>
            <div><strong>問題:</strong> ${question.question}</div>
            <div><strong>選択肢:</strong>${choicesHtml}</div>
            <div><strong>解説:</strong> ${question.explanation ? question.explanation : '（解説なし）'}</div>
        </div>
    `;
}

// お気に入りから出題
const favoriteQuizBtn = document.getElementById('favorite-quiz-button');
if (favoriteQuizBtn) {
    favoriteQuizBtn.addEventListener('click', () => {
        if (favoriteQuestions.length === 0) return;
        questions = [...favoriteQuestions];
        isReviewBookmarksMode = false;
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('quiz-container').classList.remove('hidden');
        document.getElementById('total-questions').textContent = questions.length;
        currentQuestionIndex = 0;
        showQuestion(currentQuestionIndex);
    });
}

// お気に入り一覧モーダル
const favoriteListBtn = document.getElementById('favorite-list-button');
const favoriteListModal = document.getElementById('favorite-list-modal');
const closeFavoriteList = document.getElementById('close-favorite-list');
const favoriteListContainer = document.getElementById('favorite-list-container');
if (favoriteListBtn && favoriteListModal && closeFavoriteList && favoriteListContainer) {
    favoriteListBtn.addEventListener('click', () => {
        renderFavoriteList();
        favoriteListModal.classList.remove('hidden');
    });
    closeFavoriteList.addEventListener('click', () => {
        favoriteListModal.classList.add('hidden');
    });
}
function renderFavoriteList() {
    favoriteListContainer.innerHTML = '';
    if (favoriteQuestions.length === 0) {
        favoriteListContainer.innerHTML = '<p>お気に入りはありません。</p>';
        return;
    }
    const ul = document.createElement('ul');
    ul.style.listStyle = 'none';
    ul.style.padding = '0';
    favoriteQuestions.forEach((q, i) => {
        const li = document.createElement('li');
        li.style.margin = '10px 0';
        li.style.padding = '10px';
        li.style.border = '1px solid #ddd';
        li.style.borderRadius = '6px';
        li.style.background = '#fafafa';
        li.innerHTML = `<b>${q.category}</b>：${q.question}`;
        // 削除ボタン
        const delBtn = document.createElement('button');
        delBtn.textContent = '削除';
        delBtn.style.marginLeft = '10px';
        delBtn.onclick = () => {
            favoriteQuestions.splice(i, 1);
            saveFavorites();
            updateFavoriteUI();
            renderFavoriteList();
        };
        // 並べ替えボタン
        const upBtn = document.createElement('button');
        upBtn.textContent = '↑';
        upBtn.onclick = () => {
            if (i > 0) {
                [favoriteQuestions[i-1], favoriteQuestions[i]] = [favoriteQuestions[i], favoriteQuestions[i-1]];
                saveFavorites();
                renderFavoriteList();
            }
        };
        const downBtn = document.createElement('button');
        downBtn.textContent = '↓';
        downBtn.onclick = () => {
            if (i < favoriteQuestions.length-1) {
                [favoriteQuestions[i+1], favoriteQuestions[i]] = [favoriteQuestions[i], favoriteQuestions[i+1]];
                saveFavorites();
                renderFavoriteList();
            }
        };
        li.appendChild(upBtn);
        li.appendChild(downBtn);
        li.appendChild(delBtn);
        ul.appendChild(li);
    });
    favoriteListContainer.appendChild(ul);
}

// 履歴保存用キー
const MISTAKE_HISTORY_KEY = 'mistakeHistory';
const QUESTION_STATS_KEY = 'questionStats';
const REVIEW_REMINDER_KEY = 'reviewReminders';

// 履歴保存・取得
function saveMistakeHistory(ids) {
    localStorage.setItem(MISTAKE_HISTORY_KEY, JSON.stringify(ids));
}
function loadMistakeHistory() {
    return JSON.parse(localStorage.getItem(MISTAKE_HISTORY_KEY) || '[]');
}
// 問題ごとの正答統計保存
function saveQuestionStats(stats) {
    localStorage.setItem(QUESTION_STATS_KEY, JSON.stringify(stats));
}
function loadQuestionStats() {
    return JSON.parse(localStorage.getItem(QUESTION_STATS_KEY) || '{}');
}
// リマインダー保存
function saveReviewReminders(reminders) {
    localStorage.setItem(REVIEW_REMINDER_KEY, JSON.stringify(reminders));
}
function loadReviewReminders() {
    return JSON.parse(localStorage.getItem(REVIEW_REMINDER_KEY) || '[]');
}

// クイズ終了時に間違えた問題IDを保存・統計更新・リマインダー登録
function saveQuizResults() {
    const mistakeIds = [];
    const stats = loadQuestionStats();
    const reminders = loadReviewReminders();
    questions.forEach((q, i) => {
        const qid = getQuestionId(q);
        const isCorrect = userAnswers[i] === q.answer;
        // 間違えた問題ID
        if (!isCorrect) mistakeIds.push(qid);
        // 統計
        if (!stats[qid]) stats[qid] = { correct: 0, wrong: 0 };
        if (isCorrect) stats[qid].correct++;
        else stats[qid].wrong++;
        // リマインダー（間違えた問題 or 解答から1日/7日経過）
        if (!isCorrect) {
            reminders.push({ qid, date: Date.now() });
        }
    });
    saveMistakeHistory(mistakeIds);
    saveQuestionStats(stats);
    saveReviewReminders(reminders);
}

// 弱点克服モード開始
const mistakeQuizBtn = document.getElementById('mistake-quiz-button');
if (mistakeQuizBtn) {
    mistakeQuizBtn.addEventListener('click', () => {
        const mistakeIds = loadMistakeHistory();
        if (!mistakeIds.length) {
            showTempMessage('間違えた問題の履歴がありません', '#e74c3c');
            return;
        }
        fetch('./data/questions.json')
            .then(res => res.json())
            .then(data => {
                const filtered = data.filter(q => mistakeIds.includes(getQuestionId(q)));
                if (!filtered.length) {
                    showTempMessage('該当する問題がありません', '#e74c3c');
                    return;
                }
                questions = filtered;
                userAnswers = [];
                currentQuestionIndex = 0;
                document.getElementById('start-screen').classList.add('hidden');
                document.getElementById('quiz-container').classList.remove('hidden');
                document.getElementById('total-questions').textContent = questions.length;
                showQuestion(currentQuestionIndex);
            });
    });
}

// クイズ終了時に履歴保存を呼び出す
const origShowQuizEnd = showQuizEnd;
showQuizEnd = function() {
    saveQuizResults();
    origShowQuizEnd();
}

// 正答率ワースト10表示
const worstRankingBtn = document.getElementById('worst-ranking-button');
const worstRankingArea = document.getElementById('worst-ranking-area');
if (worstRankingBtn && worstRankingArea) {
    worstRankingBtn.addEventListener('click', () => {
        const stats = loadQuestionStats();
        fetch('./data/questions.json')
            .then(res => res.json())
            .then(data => {
                // 正答率計算
                const arr = data.map(q => {
                    const qid = getQuestionId(q);
                    const s = stats[qid] || { correct: 0, wrong: 0 };
                    const total = s.correct + s.wrong;
                    const rate = total ? (s.correct / total) : 1;
                    return { q, rate, total };
                });
                arr.sort((a, b) => a.rate - b.rate || b.total - a.total);
                const top10 = arr.slice(0, 10);
                let html = '<h3>正答率ワースト10</h3><ol>';
                top10.forEach(({ q, rate, total }, i) => {
                    html += `<li><b>${q.category}</b>：${q.question}<br>正答率 ${(rate * 100).toFixed(1)}%（${total}回解答）</li>`;
                });
                html += '</ol>';
                worstRankingArea.innerHTML = html;
                worstRankingArea.classList.remove('hidden');
            });
    });
}

// 自動復習リマインダー表示
function showReviewRemindersIfNeeded() {
    const reminders = loadReviewReminders();
    if (!reminders.length) return;
    fetch('./data/questions.json')
        .then(res => res.json())
        .then(data => {
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;
            const oneWeek = 7 * oneDay;
            const due = reminders.filter(r => {
                const elapsed = now - r.date;
                return elapsed > oneDay; // 1日以上経過
            });
            if (!due.length) return;
            // 問題文を取得
            const dueQuestions = data.filter(q => due.some(r => getQuestionId(q) === r.qid));
            if (!dueQuestions.length) return;
            const area = document.getElementById('reminder-area');
            area.innerHTML = `復習推奨：<ul>${dueQuestions.map(q => `<li>${q.category}：${q.question}</li>`).join('')}</ul>`;
            area.classList.remove('hidden');
        });
}
// ページロード時にリマインダー表示
showReviewRemindersIfNeeded();

// ページロード時にお気に入り復元
loadFavorites();
updateFavoriteUI();

// クイズ開始時にお気に入りUI更新
document.getElementById('start-button').addEventListener('click', updateFavoriteUI);
document.getElementById('review-bookmarks-button').addEventListener('click', updateFavoriteUI);

// クイズリセット時もUI更新
function resetQuiz() {
    currentQuestionIndex = 0;
    correctAnswers = 0;
    userAnswers = [];
    isReviewBookmarksMode = false; // ← 追加: 復習モード状態をリセット
    // 最初の画面を表示し、他を非表示に
    document.getElementById('start-screen').classList.remove('hidden');
    document.getElementById('quiz-container').classList.add('hidden');
    document.getElementById('quiz-end').classList.add('hidden');
    document.getElementById('end-button').classList.remove('hidden');
    // ★ バッジを必ず非表示にする
    const reviewBadge = document.getElementById('review-mode-badge');
    if (reviewBadge) reviewBadge.classList.add('hidden');
    // 必要なら他の状態もリセット
    updateFavoriteUI();
}

// ページ初期化時にUI更新
updateFavoriteUI();