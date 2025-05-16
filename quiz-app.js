// quiz-app.js
// Quizアプリ本体のクラス化
class QuizApp {
    constructor() {
        // 状態変数の初期化。クイズの進行やユーザーの操作状態を管理するため。
        this.questions = [];
        this.correctAnswers = 0;
        this.userAnswers = [];
        this.favoriteQuestions = [];
        this.bookmarkedQuestions = [];
        this.isReviewBookmarksMode = false;
        this.selectedQuestionCount = 10;
        this.currentQuestionIndex = 0;
        this.timerSeconds = 60;
        this.timerInterval = null;
        this.FAVORITE_LIMIT = 50;
        // 初期化処理の呼び出し。UIイベント登録やデータ復元など副作用を伴う。
        this.init();
    }

    /**
     * クイズアプリの初期化処理を行う。
     * - 各種ボタン・UIイベントの登録、ローカルストレージからのデータ復元、リマインダー表示などを行う。
     * - DOM操作・イベントリスナー登録の副作用あり。
     */
    init() {
        // 出題数指定の取得。ユーザーが出題数を変更した場合に反映する。
        const questionCountInput = document.getElementById('question-count');
        if (questionCountInput) {
            questionCountInput.addEventListener('change', (e) => {
                // 入力値を1〜80の範囲に制限し、selectedQuestionCountに反映
                this.selectedQuestionCount = Math.max(1, Math.min(80, parseInt(e.target.value) || 10));
            });
        }
        // 開始ボタンのイベント登録。クイズ開始時にUIを切り替え、通常モードで出題。
        const startBtn = document.getElementById('start-button');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.isReviewBookmarksMode = false;
                document.getElementById('start-screen').classList.add('hidden');
                document.getElementById('quiz-container').classList.remove('hidden');
                this.startQuiz(false);
            });
        }
        // ブックマーク復習ボタンのイベント登録。ブックマークが空の場合は警告。
        const reviewBookmarksButton = document.getElementById('review-bookmarks-button');
        if (reviewBookmarksButton) {
            reviewBookmarksButton.addEventListener('click', () => {
                if (this.bookmarkedQuestions.length === 0) {
                    alert('ブックマークされた問題がありません。');
                    return;
                }
                document.getElementById('start-screen').classList.add('hidden');
                document.getElementById('quiz-container').classList.remove('hidden');
                this.startQuiz(true);
            });
        }
        // お気に入りリストのローカルストレージからの復元
        this.loadFavorites();
        // お気に入りUIの初期表示
        this.updateFavoriteUI();
        // お気に入り・ブックマークボタンのイベント登録
        this.bindFavoriteAndBookmarkButtons();
        // ナビゲーションボタンのイベント登録
        this.bindNavigationButtons();
        // お気に入り一覧モーダルの表示・操作
        this.bindFavoriteListModal();
        // お気に入りから出題ボタンのイベント登録
        this.bindFavoriteQuizButton();
        // 弱点克服モード開始ボタンのイベント登録
        this.bindMistakeQuizButton();
        // 正答率ワースト10表示ボタンのイベント登録
        this.bindWorstRankingButton();
        // 自動復習リマインダー表示（必要な場合のみ）
        this.showReviewRemindersIfNeeded();
   }

    // お気に入りID生成（問題文+カテゴリで一意化）
    getQuestionId(q) {
        // 問題の一意なIDを生成。お気に入りや履歴管理で重複を避けるため。
        return q && q.question ? `${q.category}__${q.question}` : '';
    }

    /**
     * ローカルストレージからお気に入りリストを復元する。
     * 副作用: this.favoriteQuestionsを更新。
     */
    loadFavorites() {
        // localStorageからお気に入りリストを取得し、配列として復元
        const fav = localStorage.getItem('favoriteQuestions');
        if (fav) {
            try {
                const arr = JSON.parse(fav);
                if (Array.isArray(arr)) this.favoriteQuestions = arr;
            } catch {}
        }
    }
    /**
     * お気に入りリストをローカルストレージに保存する。
     * 副作用: localStorageの書き換え。
     */
    saveFavorites() {
        // お気に入りリストをJSON文字列化してlocalStorageに保存
        localStorage.setItem('favoriteQuestions', JSON.stringify(this.favoriteQuestions));
    }
    /**
     * お気に入り件数のUI表示・ボタンの有効/無効を更新する。
     * 副作用: DOM操作。
     */
    updateFavoriteUI() {
        // お気に入り件数を表示し、ボタンの有効/無効を切り替える
        const count = this.favoriteQuestions.length;
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
    /**
     * 一時的なメッセージを画面に表示する。
     * @param {string} msg - 表示するメッセージ
     * @param {string} [color='#f1c40f'] - 背景色
     * 副作用: DOM操作。
     */
    showTempMessage(msg, color = '#f1c40f') {
        // 一時的な通知メッセージを表示し、1.5秒後に自動で非表示にする
        const el = document.getElementById('temp-message');
        el.textContent = msg;
        el.style.background = color;
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 1500);
   }

    /**
     * クイズを開始し、問題リストをセットして最初の問題を表示する。
     * @param {boolean} [isReviewBookmarks=false] - ブックマーク復習モードかどうか
     * 副作用: this.questions, this.currentQuestionIndex等の状態変更、DOM操作。
     */
    startQuiz(isReviewBookmarks = false) {
        // テスト開始時に「テストを終了する」ボタンを表示
        const endBtn = document.getElementById('end-button');
        if (endBtn) endBtn.classList.remove('hidden');
        // モードを設定。ブックマーク復習か通常か
        this.isReviewBookmarksMode = !!isReviewBookmarks;
        // 復習バッジを必ず非表示にする
        const reviewBadge = document.getElementById('review-mode-badge');
        if (reviewBadge) reviewBadge.classList.add('hidden');
        // 状態リセット
        this.correctAnswers = 0;
        this.userAnswers = [];
        this.currentQuestionIndex = 0;
        if (isReviewBookmarks) {
            // ブックマークから出題
            this.questions = [...this.bookmarkedQuestions];
            document.getElementById('total-questions').textContent = this.questions.length;
            this.showQuestion(this.currentQuestionIndex);
        } else {
            // 通常モードはJSONから問題を取得し、ランダムに出題数分だけ抽出
            fetch('./data/questions.json')
                .then(response => response.json())
                .then(data => {
                    // 問題をシャッフルし、selectedQuestionCount分だけ出題
                    this.questions = data.sort(() => Math.random() - 0.5).slice(0, this.selectedQuestionCount);
                    document.getElementById('total-questions').textContent = this.questions.length;
                    this.showQuestion(this.currentQuestionIndex);
                });
        }
    }

    /**
     * 問題ごとのタイマーを開始する。
     * 1秒ごとにカウントダウンし、0でタイムアウト処理を呼ぶ。
     * 副作用: DOM操作、setInterval。
     */
    startTimer() {
        // 既存のタイマーをクリアしてから新たに開始（多重起動防止）
        this.clearTimer();
        this.timerSeconds = 60;
        // タイマー表示を初期化
        document.getElementById('timer-seconds').textContent = this.timerSeconds;
        document.getElementById('timer').style.color = '';
        // 1秒ごとにカウントダウン
        this.timerInterval = setInterval(() => {
            this.timerSeconds--;
            document.getElementById('timer-seconds').textContent = this.timerSeconds;
            // 残り5秒以下で色を赤に変更（注意喚起）
            if (this.timerSeconds <= 5) {
                document.getElementById('timer').style.color = '#e74c3c';
            }
            // 0秒でタイムアウト処理を呼ぶ
            if (this.timerSeconds <= 0) {
                this.clearTimer();
                this.handleTimeout();
            }
        }, 1000);
    }
    /**
     * タイマーを停止・リセットする。
     * 副作用: clearInterval。
     */
    clearTimer() {
        // setIntervalで動作中のタイマーを停止
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    /**
     * タイムアウト時の処理を行う。
     * 回答を自動で不正解扱いし、次の問題へ進む。
     * 副作用: this.currentQuestionIndex, DOM操作。
     */
    handleTimeout() {
        // タイムアウト時は自動で不正解扱いし、次の問題へ
        this.checkAnswer(null, true);
        // 1.2秒後に次の問題へ進む（ユーザーに結果を見せるための遅延）
        setTimeout(() => {
            this.currentQuestionIndex++;
            if (this.currentQuestionIndex >= Math.min(this.questions.length, 80)) {
                this.showQuizEnd();
            } else {
                this.showQuestion(this.currentQuestionIndex);
            }
        }, 1200);
    }

    /**
     * 指定したインデックスの問題を画面に表示する。
     * @param {number} idx - 表示する問題のインデックス
     * 副作用: DOM操作。
     */
    showQuestion(idx) {
        // 問題切り替え時はタイマーをリセット
        this.clearTimer();
        const question = this.questions[idx];
        // 問題番号・カテゴリ・本文を表示
        document.getElementById('current-number').textContent = idx + 1;
        document.getElementById('category').textContent = question.category;
        document.getElementById('question-text').textContent = question.question;
        // 復習モードバッジの表示切替
        const reviewBadge = document.getElementById('review-mode-badge');
        if (this.isReviewBookmarksMode && reviewBadge) {
            reviewBadge.classList.remove('hidden');
        } else if (reviewBadge) {
            reviewBadge.classList.add('hidden');
        }
        // お気に入り・ブックマークボタンの状態を更新
        const q = this.questions[idx];
        const qid = this.getQuestionId(q);
        const favIdx = this.favoriteQuestions.findIndex(fq => this.getQuestionId(fq) === qid);
        const favoriteButton = document.getElementById('favorite-button');
        favoriteButton.classList.toggle('favorite-active', favIdx !== -1);
        favoriteButton.setAttribute('aria-label', favIdx !== -1 ? 'お気に入りから削除' : 'お気に入りに追加');
        favoriteButton.setAttribute('title', favIdx !== -1 ? 'お気に入りから削除' : 'お気に入りに追加');
        document.getElementById('bookmark-button').classList.toggle('active', this.bookmarkedQuestions.includes(question));

        // 選択肢の描画。前回の内容をクリアしてから新たに生成
        const choicesContainer = document.getElementById('choices-container');
        choicesContainer.innerHTML = '';
        const choicesSection = document.createElement('div');
        choicesSection.className = 'choices-section';
        question.choices.forEach((choice, index) => {
            // 選択肢ごとにcheckboxとlabelを生成
            const choiceContainer = document.createElement('div');
            choiceContainer.className = 'choice-container';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `choice-${index}`;
            checkbox.name = 'quiz-choice';
            checkbox.className = 'choice-checkbox';
            checkbox.value = index;
            // チェック時に他の選択肢を外し、回答判定を呼ぶ
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    document.querySelectorAll('.choice-checkbox').forEach(cb => {
                        if (cb !== checkbox) cb.checked = false;
                    });
                    this.checkAnswer(index);
                    // 正解・不正解の色付け
                    const question = this.questions[this.currentQuestionIndex];
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
            // 選択肢テキストのlabel生成
            const choiceText = document.createElement('label');
            choiceText.htmlFor = `choice-${index}`;
            choiceText.className = 'choice-text';
            choiceText.textContent = choice;
            // labelクリック時にグレーアウト切替（選択肢の一時無効化）
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
        // 結果表示・次へボタンを非表示にリセット
        document.getElementById('result').classList.add('hidden');
        document.getElementById('next-button').classList.add('hidden');
        // 前へボタンの表示切替
        const prevButton = document.getElementById('prev-button');
        if (idx > 0) {
            prevButton.classList.remove('hidden');
        } else {
            prevButton.classList.add('hidden');
        }
        // 問題ごとのタイマー開始
        this.startTimer();
    }

    /**
     * 回答を判定し、結果・解説を表示する。
     * @param {number|null} selectedAnswer - 選択された回答インデックス（タイムアウト時はnull）
     * @param {boolean} [isTimeout=false] - タイムアウトによる自動判定かどうか
     * 副作用: this.userAnswers, this.correctAnswers, DOM操作。
     */
    checkAnswer(selectedAnswer, isTimeout = false) {
        // 回答時はタイマーを停止
        this.clearTimer();
        const question = this.questions[this.currentQuestionIndex];
        // ユーザーの回答を記録
        this.userAnswers[this.currentQuestionIndex] = selectedAnswer;
        const resultDiv = document.getElementById('result');
        const judgmentText = document.getElementById('judgment');
        const explanationText = document.getElementById('explanation');
        // 選択肢をすべて無効化（再選択防止）
        const checkboxes = document.querySelectorAll('.choice-checkbox');
        checkboxes.forEach(checkbox => checkbox.disabled = true);
        let isCorrect = false;
        if (selectedAnswer === question.answer) {
            // 正解時の処理
            isCorrect = true;
            judgmentText.textContent = '正解！';
            judgmentText.className = 'correct';
            this.correctAnswers++;
        } else if (isTimeout) {
            // タイムアウト時の表示
            judgmentText.textContent = '時間切れ...';
            judgmentText.className = 'incorrect';
        } else {
            // 不正解時の処理
            judgmentText.textContent = '不正解...';
            judgmentText.className = 'incorrect';
            // 間違えた問題は自動でブックマーク（復習用）
            if (!this.bookmarkedQuestions.includes(question)) {
                this.bookmarkedQuestions.push(question);
                document.getElementById('bookmark-button').classList.add('active');
                document.getElementById('review-bookmarks-button').classList.remove('hidden');
            }
        }
        // 解説文を表示
        explanationText.textContent = question.explanation;
        resultDiv.classList.remove('hidden');
        document.getElementById('next-button').classList.remove('hidden');
    }

    /**
     * お気に入り・ブックマークボタンのイベントリスナーを登録する。
     * 副作用: DOM操作、イベントリスナー登録。
     */
    bindFavoriteAndBookmarkButtons() {
        const favoriteButton = document.getElementById('favorite-button');
        if (favoriteButton) {
            favoriteButton.addEventListener('click', () => {
                // 現在の問題のお気に入り状態をトグル
                const q = this.questions[this.currentQuestionIndex];
                const qid = this.getQuestionId(q);
                const idx = this.favoriteQuestions.findIndex(fq => this.getQuestionId(fq) === qid);
                if (idx === -1) {
                    // お気に入り上限チェック
                    if (this.favoriteQuestions.length >= this.FAVORITE_LIMIT) {
                        this.showTempMessage('お気に入りは最大50問までです', '#e74c3c');
                        return;
                    }
                    // お気に入り追加
                    this.favoriteQuestions.push(q);
                    favoriteButton.classList.add('favorite-active');
                    favoriteButton.setAttribute('aria-label', 'お気に入りから削除');
                    favoriteButton.setAttribute('title', 'お気に入りから削除');
                    this.showTempMessage('お気に入りに追加しました', '#f1c40f');
                } else {
                    // お気に入りから削除
                    this.favoriteQuestions.splice(idx, 1);
                    favoriteButton.classList.remove('favorite-active');
                    favoriteButton.setAttribute('aria-label', 'お気に入りに追加');
                    favoriteButton.setAttribute('title', 'お気に入りに追加');
                    this.showTempMessage('お気に入りから削除しました', '#95a5a6');
                }
                // 状態保存・UI更新
                this.saveFavorites();
                this.updateFavoriteUI();
            });
        }
        const bookmarkButton = document.getElementById('bookmark-button');
        if (bookmarkButton) {
            bookmarkButton.addEventListener('click', () => {
                // 現在の問題のブックマーク状態をトグル
                const q = this.questions[this.currentQuestionIndex];
                const idx = this.bookmarkedQuestions.indexOf(q);
                if (idx === -1) {
                    // ブックマーク追加
                    this.bookmarkedQuestions.push(q);
                    bookmarkButton.classList.add('active');
                    document.getElementById('review-bookmarks-button').classList.remove('hidden');
                } else {
                    // ブックマークから削除
                    this.bookmarkedQuestions.splice(idx, 1);
                    bookmarkButton.classList.remove('active');
                    if (this.bookmarkedQuestions.length === 0) {
                        document.getElementById('review-bookmarks-button').classList.add('hidden');
                    }
                }
            });
        }
    }

    /**
     * 次の問題・前の問題・終了ボタンのイベントリスナーを登録する。
     * 副作用: DOM操作、イベントリスナー登録。
     */
    bindNavigationButtons() {
        // 次へボタン：次の問題へ進む。最終問題なら終了画面へ。
        const nextBtn = document.getElementById('next-button');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentQuestionIndex++;
                if (this.currentQuestionIndex >= Math.min(this.questions.length, 80)) {
                    this.showQuizEnd();
                } else {
                    this.showQuestion(this.currentQuestionIndex);
                }
            });
        }
        // 前へボタン：前の問題へ戻る。先頭なら非表示。
        const prevButton = document.getElementById('prev-button');
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                if (this.currentQuestionIndex > 0) {
                    this.currentQuestionIndex--;
                    this.showQuestion(this.currentQuestionIndex);
                    const nextBtn = document.getElementById('next-button');
                    if (nextBtn) nextBtn.classList.remove('hidden');
                    if (this.currentQuestionIndex === 0) {
                        prevButton.classList.add('hidden');
                    }
                }
            });
        }
        // 終了ボタン：確認ダイアログ後、強制終了
        const endBtn = document.getElementById('end-button');
        if (endBtn) {
            endBtn.addEventListener('click', () => {
                if (confirm('テストを終了しますか？残りの問題は不正解として扱われます。')) {
                    this.showQuizEnd();
                }
            });
        }
    }

    /**
     * お気に入り一覧モーダルの表示・操作イベントを登録する。
     * 副作用: DOM操作、イベントリスナー登録。
     */
    bindFavoriteListModal() {
        const favoriteListBtn = document.getElementById('favorite-list-button');
        const favoriteListModal = document.getElementById('favorite-list-modal');
        const closeFavoriteList = document.getElementById('close-favorite-list');
        const favoriteListContainer = document.getElementById('favorite-list-container');
        if (favoriteListBtn && favoriteListModal && closeFavoriteList && favoriteListContainer) {
            // お気に入り一覧ボタンでモーダル表示
            favoriteListBtn.addEventListener('click', () => {
                this.renderFavoriteList(favoriteListContainer);
                favoriteListModal.classList.remove('hidden');
            });
            // 閉じるボタンでモーダル非表示
            closeFavoriteList.addEventListener('click', () => {
                favoriteListModal.classList.add('hidden');
            });
        }
    }
    /**
     * お気に入り一覧をモーダル内に描画する。
     * @param {HTMLElement} container - 一覧を描画するDOM要素
     * 副作用: DOM操作。
     */
    renderFavoriteList(container) {
        // 一覧を初期化
        container.innerHTML = '';
        if (this.favoriteQuestions.length === 0) {
            container.innerHTML = '<p>お気に入りはありません。</p>';
            return;
        }
        // お気に入りリストをulで表示
        const ul = document.createElement('ul');
        ul.style.listStyle = 'none';
        ul.style.padding = '0';
        this.favoriteQuestions.forEach((q, i) => {
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
                // お気に入りから削除し、UIを再描画
                this.favoriteQuestions.splice(i, 1);
                this.saveFavorites();
                this.updateFavoriteUI();
                this.renderFavoriteList(container);
            };
            // 並べ替えボタン（上）
            const upBtn = document.createElement('button');
            upBtn.textContent = '↑';
            upBtn.onclick = () => {
                if (i > 0) {
                    // 配列内で前と入れ替え
                    [this.favoriteQuestions[i-1], this.favoriteQuestions[i]] = [this.favoriteQuestions[i], this.favoriteQuestions[i-1]];
                    this.saveFavorites();
                    this.renderFavoriteList(container);
                }
            };
            // 並べ替えボタン（下）
            const downBtn = document.createElement('button');
            downBtn.textContent = '↓';
            downBtn.onclick = () => {
                if (i < this.favoriteQuestions.length-1) {
                    // 配列内で次と入れ替え
                    [this.favoriteQuestions[i+1], this.favoriteQuestions[i]] = [this.favoriteQuestions[i], this.favoriteQuestions[i+1]];
                    this.saveFavorites();
                    this.renderFavoriteList(container);
                }
            };
            li.appendChild(upBtn);
            li.appendChild(downBtn);
            li.appendChild(delBtn);
            ul.appendChild(li);
        });
        container.appendChild(ul);
    }

    /**
     * お気に入りから出題ボタンのイベントリスナーを登録する。
     * 副作用: DOM操作、イベントリスナー登録。
     */
    bindFavoriteQuizButton() {
        const favoriteQuizBtn = document.getElementById('favorite-quiz-button');
        if (favoriteQuizBtn) {
            favoriteQuizBtn.addEventListener('click', () => {
                // お気に入りが空なら何もしない
                if (this.favoriteQuestions.length === 0) return;
                // お気に入りリストから出題
                this.questions = [...this.favoriteQuestions];
                this.isReviewBookmarksMode = false;
                document.getElementById('start-screen').classList.add('hidden');
                document.getElementById('quiz-container').classList.remove('hidden');
                document.getElementById('total-questions').textContent = this.questions.length;
                this.currentQuestionIndex = 0;
                this.showQuestion(this.currentQuestionIndex);
            });
        }
   }

    /**
     * 弱点克服モードボタンのイベントリスナーを登録する。
     * 副作用: DOM操作、イベントリスナー登録。
     */
    bindMistakeQuizButton() {
        const mistakeQuizBtn = document.getElementById('mistake-quiz-button');
        if (mistakeQuizBtn) {
            mistakeQuizBtn.addEventListener('click', () => {
                // 間違えた問題IDリストを取得
                const mistakeIds = this.loadMistakeHistory();
                if (!mistakeIds.length) {
                    this.showTempMessage('間違えた問題の履歴がありません', '#e74c3c');
                    return;
                }
                // 全問題データから該当IDの問題だけ抽出
                fetch('./data/questions.json')
                    .then(res => res.json())
                    .then(data => {
                        const filtered = data.filter(q => mistakeIds.includes(this.getQuestionId(q)));
                        if (!filtered.length) {
                            this.showTempMessage('該当する問題がありません', '#e74c3c');
                            return;
                        }
                        this.questions = filtered;
                        this.userAnswers = [];
                        this.currentQuestionIndex = 0;
                        document.getElementById('start-screen').classList.add('hidden');
                        document.getElementById('quiz-container').classList.remove('hidden');
                        document.getElementById('total-questions').textContent = this.questions.length;
                        this.showQuestion(this.currentQuestionIndex);
                    });
            });
        }
    }

    /**
     * 正答率ワースト10表示ボタンのイベントリスナーを登録する。
     * 副作用: DOM操作、イベントリスナー登録。
     */
    bindWorstRankingButton() {
        const worstRankingBtn = document.getElementById('worst-ranking-button');
        const worstRankingArea = document.getElementById('worst-ranking-area');
        if (worstRankingBtn && worstRankingArea) {
            worstRankingBtn.addEventListener('click', () => {
                // 問題ごとの正答統計を取得
                const stats = this.loadQuestionStats();
                fetch('./data/questions.json')
                    .then(res => res.json())
                    .then(data => {
                        // 各問題の正答率を計算
                        const arr = data.map(q => {
                            const qid = this.getQuestionId(q);
                            const s = stats[qid] || { correct: 0, wrong: 0 };
                            const total = s.correct + s.wrong;
                            const rate = total ? (s.correct / total) : 1;
                            return { q, rate, total };
                        });
                        // 正答率昇順・解答数降順でソート
                        arr.sort((a, b) => a.rate - b.rate || b.total - a.total);
                        const top10 = arr.slice(0, 10);
                        // 上位10件をリスト表示
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
    }

    /**
     * 自動復習リマインダーを必要に応じて表示する。
     * 副作用: DOM操作、fetch。
     */
    showReviewRemindersIfNeeded() {
        // リマインダー情報を取得し、1日以上経過したものだけ表示
        const reminders = this.loadReviewReminders();
        if (!reminders.length) return;
        fetch('./data/questions.json')
            .then(res => res.json())
            .then(data => {
                const now = Date.now();
                const oneDay = 24 * 60 * 60 * 1000;
                // 1日以上経過したリマインダーのみ抽出
                const due = reminders.filter(r => {
                    const elapsed = now - r.date;
                    return elapsed > oneDay;
                });
                if (!due.length) return;
                // 対象問題を抽出
                const dueQuestions = data.filter(q => due.some(r => this.getQuestionId(q) === r.qid));
                if (!dueQuestions.length) return;
                // UIにリスト表示
                const area = document.getElementById('reminder-area');
                area.innerHTML = `復習推奨：<ul>${dueQuestions.map(q => `<li>${q.category}：${q.question}</li>`).join('')}</ul>`;
                area.classList.remove('hidden');
            });
    }

    /**
     * 履歴（間違えた問題ID）をローカルストレージに保存する。
     * @param {string[]} ids - 間違えた問題IDリスト
     * 副作用: localStorageの書き換え。
     */
    saveMistakeHistory(ids) {
        // 配列をJSON文字列化して保存
        localStorage.setItem(QuizApp.MISTAKE_HISTORY_KEY, JSON.stringify(ids));
    }
    /**
     * 履歴（間違えた問題ID）をローカルストレージから取得する。
     * @returns {string[]} 間違えた問題IDリスト
     */
    loadMistakeHistory() {
        // JSON文字列を配列に復元
        return JSON.parse(localStorage.getItem(QuizApp.MISTAKE_HISTORY_KEY) || '[]');
    }
    /**
     * 問題ごとの正答統計をローカルストレージに保存する。
     * @param {Object} stats - 問題ごとの正答統計
     * 副作用: localStorageの書き換え。
     */
    saveQuestionStats(stats) {
        // オブジェクトをJSON文字列化して保存
        localStorage.setItem(QuizApp.QUESTION_STATS_KEY, JSON.stringify(stats));
    }
    /**
     * 問題ごとの正答統計をローカルストレージから取得する。
     * @returns {Object} 問題ごとの正答統計
     */
    loadQuestionStats() {
        // JSON文字列をオブジェクトに復元
        return JSON.parse(localStorage.getItem(QuizApp.QUESTION_STATS_KEY) || '{}');
    }
    /**
     * リマインダーをローカルストレージに保存する。
     * @param {Object[]} reminders - リマインダー情報
     * 副作用: localStorageの書き換え。
     */
    saveReviewReminders(reminders) {
        // 配列をJSON文字列化して保存
        localStorage.setItem(QuizApp.REVIEW_REMINDER_KEY, JSON.stringify(reminders));
    }
    /**
     * リマインダーをローカルストレージから取得する。
     * @returns {Object[]} リマインダー情報
     */
    loadReviewReminders() {
        // JSON文字列を配列に復元
        return JSON.parse(localStorage.getItem(QuizApp.REVIEW_REMINDER_KEY) || '[]');
    }

    /**
     * クイズ終了時に間違えた問題IDを保存し、統計・リマインダーも更新する。
     * 副作用: localStorageの書き換え。
     */
    saveQuizResults() {
        // 間違えた問題IDリスト、統計、リマインダーをまとめて更新
        const mistakeIds = [];
        const stats = this.loadQuestionStats();
        const reminders = this.loadReviewReminders();
        this.questions.forEach((q, i) => {
            const qid = this.getQuestionId(q);
            const isCorrect = this.userAnswers[i] === q.answer;
            if (!isCorrect) mistakeIds.push(qid);
            if (!stats[qid]) stats[qid] = { correct: 0, wrong: 0 };
            if (isCorrect) stats[qid].correct++;
            else stats[qid].wrong++;
            if (!isCorrect) {
                // 間違えた問題はリマインダーにも追加
                reminders.push({ qid, date: Date.now() });
            }
        });
        this.saveMistakeHistory(mistakeIds);
        this.saveQuestionStats(stats);
        this.saveReviewReminders(reminders);
    }

    /**
     * クイズ終了画面を表示し、成績や復習グリッドを描画する。
     * 副作用: DOM操作。
     */
    showQuizEnd() {
        // 結果保存・タイマー停止
        this.saveQuizResults();
        this.clearTimer();
        // UI切り替え
        document.getElementById('quiz-container').classList.add('hidden');
        document.getElementById('quiz-end').classList.remove('hidden');
        const reviewBadge = document.getElementById('review-mode-badge');
        if (reviewBadge) reviewBadge.classList.add('hidden');
        const endTitle = document.getElementById('quiz-end-title');
        const endMsg = document.getElementById('quiz-end-message');
        if (this.isReviewBookmarksMode) {
            // 復習モード終了時の表示
            if (endTitle) endTitle.textContent = '復習モードで終了';
            if (endMsg) endMsg.textContent = 'ブックマーク復習モードの全問題が終了しました。';
        } else {
            // 通常モード終了時の表示
            if (endTitle) endTitle.textContent = 'お疲れ様でした！';
            if (endMsg) endMsg.textContent = '全ての問題が終了しました。';
        }
        // 成績表示
        const totalQuestions = Math.min(this.questions.length, 80);
        const percentage = (this.correctAnswers / totalQuestions * 100).toFixed(1);
        const isPassed = percentage >= 60;
        document.getElementById('quiz-result').textContent = `${this.correctAnswers}問中${totalQuestions}問正解（正答率: ${percentage}%）`;
        document.getElementById('pass-fail').textContent = isPassed ? '合格です！' : '不合格です。';
        document.getElementById('pass-fail').className = isPassed ? 'pass' : 'fail';
        document.getElementById('prev-button').classList.add('hidden');
        document.getElementById('end-button').classList.add('hidden');
        // グリッド形式で各問題の正誤を表示
        const resultsGrid = document.createElement('div');
        resultsGrid.id = 'results-grid';
        this.questions.slice(0, Math.min(this.questions.length, 80)).forEach((question, index) => {
            const item = document.createElement('div');
            const isCorrect = question.answer === this.userAnswers[index];
            item.textContent = `${index + 1}:${isCorrect ? '〇' : '×'}`;
            item.className = isCorrect ? 'correct-answer' : 'incorrect-answer';
            item.style.cursor = 'pointer';
            item.title = 'この問題を下に表示します';
            // クリックで下部に詳細表示
            item.addEventListener('click', () => {
                this.showReviewQuestion(index);
            });
            resultsGrid.appendChild(item);
        });
        const quizEndContainer = document.getElementById('quiz-end');
        const oldList = document.getElementById('results-list');
        if (oldList) oldList.remove();
        const oldGrid = document.getElementById('results-grid');
        if (oldGrid) oldGrid.remove();
        quizEndContainer.appendChild(resultsGrid);
        // ガイド表示（初回のみ生成）
        let guide = document.getElementById('review-guide');
        if (!guide) {
            guide = document.createElement('div');
            guide.id = 'review-guide';
            guide.style.margin = '12px 0';
            guide.textContent = '番号をクリックするとその問題を下に表示します。';
            quizEndContainer.insertBefore(guide, resultsGrid);
        }
        // 詳細表示エリア（初回のみ生成）
        let reviewArea = document.getElementById('review-question');
        if (!reviewArea) {
            reviewArea = document.createElement('div');
            reviewArea.id = 'review-question';
            quizEndContainer.appendChild(reviewArea);
        }
        reviewArea.innerHTML = '';
    }

    /**
     * クイズ終了時に、指定した問題の内容・解説を下部に表示する。
     * @param {number} index - 表示する問題のインデックス
     * 副作用: DOM操作。
     */
    showReviewQuestion(index) {
        // 指定インデックスの問題・ユーザー回答を取得
        const question = this.questions[index];
        const userAnswer = this.userAnswers[index];
        const reviewArea = document.getElementById('review-question');
        if (!reviewArea) return;
        // 選択肢リストをHTMLで生成。正解・誤答に色付け
        let choicesHtml = '<ul>';
        question.choices.forEach((choice, i) => {
            let style = '';
            if (i === question.answer) {
                style = 'style="color: #155724; font-weight: bold;"';
            } else if (i === userAnswer) {
                style = 'style="color: #721c24;"';
            }
            choicesHtml += `<li ${style}>${choice}${i === question.answer ? '（正解）' : ''}${i === userAnswer && i !== question.answer ? '（あなたの回答）' : ''}</li>`;
        });
        choicesHtml += '</ul>';
        // 問題内容・選択肢・解説を下部に表示
        reviewArea.innerHTML = `
            <div class="review-question-box" style="margin-top:24px;padding:16px;border:1px solid #ccc;border-radius:8px;">
                <div><strong>カテゴリ:</strong> ${question.category}</div>
                <div><strong>問題:</strong> ${question.question}</div>
                <div><strong>選択肢:</strong>${choicesHtml}</div>
                <div><strong>解説:</strong> ${question.explanation ? question.explanation : '（解説なし）'}</div>
            </div>
        `;
    }
}

// グローバルでインスタンス化
window.quizApp = new QuizApp();

window.resetQuiz = function() {
    // 終了画面を非表示、スタート画面を表示
    document.getElementById('quiz-end').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
    // クイズ画面も非表示にしておく
    document.getElementById('quiz-container').classList.add('hidden');
    // 必要なら状態リセットやUI初期化もここで呼ぶ
    // location.reload(); // 状態を完全リセットしたい場合はコメントアウト解除
};
