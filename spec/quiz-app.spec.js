//console.log('chai:', typeof chai, chai);

describe('QuizApp', function() {
  // テストごとにfavorite-buttonが存在することを保証
  beforeEach(function() {
    if (!document.getElementById('favorite-button')) {
      const btn = document.createElement('button');
      btn.id = 'favorite-button';
      document.body.appendChild(btn);
    }
  });

  // --- 追加テスト ---

  describe('ユーティリティ・ストレージ', function() {
    it('loadFavoritesとsaveFavoritesでlocalStorageと同期できる', function() {
      // 事前にlocalStorageをクリア
      localStorage.removeItem('favoriteQuestions');
      window.quizApp.favoriteQuestions = [{category:'cat',question:'q'}];
      window.quizApp.saveFavorites();
      window.quizApp.favoriteQuestions = [];
      window.quizApp.loadFavorites();
      chai.expect(window.quizApp.favoriteQuestions.length).to.equal(1);
      chai.expect(window.quizApp.favoriteQuestions[0].category).to.equal('cat');
    });
  });

  describe('タイマー', function() {
    it('startTimerでtimerSecondsがカウントダウンし、clearTimerで停止する', function(done) {
      this.timeout(5000); // テストタイムアウトを延長
      
      // タイマーのDOM要素を確実に初期化
      const timerDiv = document.getElementById('timer');
      if (!timerDiv) {
        throw new Error('timer要素が見つかりません');
      }
      
      const timerSecondsEl = document.getElementById('timer-seconds');
      if (!timerSecondsEl) {
        throw new Error('timer-seconds要素が見つかりません');
      }
      
      // DOM要素の状態を確認
      console.log('timer element:', timerDiv);
      console.log('timerSeconds element:', timerSecondsEl);
      console.log('timer parent of timerSeconds:', timerSecondsEl.parentNode === timerDiv);
      
      // アプリケーションの実際の初期値を利用
      const initialValue = 60; // アプリの実装に合わせて60に設定
      
      // 要素の内容を初期化
      timerSecondsEl.textContent = initialValue.toString();
      
      // 既存のタイマーがあれば停止
      if (window.quizApp.timerInterval) {
        window.quizApp.clearTimer();
      }
      
      // アプリの状態を初期化
      window.quizApp.timerSeconds = initialValue;
      
      try {
        // タイマー開始
        window.quizApp.startTimer();
        
        // 1.5秒後に確認（より確実に1秒以上経過させるため）
        setTimeout(() => {
          try {
            chai.expect(window.quizApp.timerSeconds).to.be.at.most(initialValue - 1);
            console.log('カウントダウン確認OK:', initialValue, '->', window.quizApp.timerSeconds);
            
            // 現在値を記録してタイマーを停止
            const prevValue = window.quizApp.timerSeconds;
            window.quizApp.clearTimer();
            
            // さらに1.5秒後、値が変わっていないことを確認
            setTimeout(() => {
              try {
                chai.expect(window.quizApp.timerSeconds).to.equal(prevValue);
                console.log('タイマー停止確認OK:', prevValue, '==', window.quizApp.timerSeconds);
                done(); // 非同期テスト完了
              } catch (e) {
                console.error('タイマー停止確認エラー:', e.message);
                done(e);
              }
            }, 1500);
          } catch (e) {
            console.error('カウントダウン確認エラー:', e.message);
            console.log('現在値:', window.quizApp.timerSeconds, '初期値:', initialValue);
            done(e);
          }
        }, 1500);
      } catch (e) {
        // エラー情報をより詳細に表示
        console.error('タイマーテストエラー:', e);
        done(e);
      }
    });
  });

  describe('クイズ進行', function() {
    it('showQuestionでDOMに問題が描画される', function() {
      window.quizApp.questions = [{category:'cat',question:'q',choices:['a','b'],answer:0,explanation:'e'}];
      window.quizApp.favoriteQuestions = [];
      window.quizApp.currentQuestionIndex = 0;
      window.quizApp.showQuestion(0);
      chai.expect(document.getElementById('question-text').textContent).to.equal('q');
      chai.expect(document.getElementById('category').textContent).to.equal('cat');
    });

    it('checkAnswerで正解・不正解の判定ができる', function() {
      window.quizApp.questions = [{category:'cat',question:'q',choices:['a','b'],answer:0,explanation:'e'}];
      window.quizApp.currentQuestionIndex = 0;
      window.quizApp.userAnswers = [];
      window.quizApp.correctAnswers = 0;
      window.quizApp.checkAnswer(0);
      chai.expect(window.quizApp.userAnswers[0]).to.equal(0);
      chai.expect(window.quizApp.correctAnswers).to.equal(1);
      window.quizApp.checkAnswer(1);
      chai.expect(window.quizApp.userAnswers[0]).to.equal(1);
    });
  });

  describe('統計・履歴', function() {
    it('saveMistakeHistoryとloadMistakeHistoryで履歴が保存・取得できる', function() {
      window.quizApp.saveMistakeHistory(['A__B','C__D']);
      const arr = window.quizApp.loadMistakeHistory();
      chai.expect(arr).to.include('A__B');
      chai.expect(arr).to.include('C__D');
    });

    it('saveQuestionStatsとloadQuestionStatsで統計が保存・取得できる', function() {
      const stats = {'A__B':{correct:1,wrong:2}};
      window.quizApp.saveQuestionStats(stats);
      const loaded = window.quizApp.loadQuestionStats();
      chai.expect(loaded['A__B'].correct).to.equal(1);
      chai.expect(loaded['A__B'].wrong).to.equal(2);
    });
  });

  describe('UIイベント', function() {
    it('bindNavigationButtonsでnext/prevボタンが動作する', function() {
      // showQuizEndメソッドを一時的にモック化して、DOM要素へのアクセスエラーを防止
      const originalShowQuizEnd = window.quizApp.showQuizEnd;
      window.quizApp.showQuizEnd = function() {
        console.log('モック化されたshowQuizEnd()が呼び出されました');
        // クイズ終了に関連する状態のみ設定
        this.clearTimer();
      };
      
      try {
        // DOM要素が存在することを確認と作成
        if (!document.getElementById('quiz-end-title')) {
          const el = document.createElement('div');
          el.id = 'quiz-end-title';
          document.body.appendChild(el);
        }
        if (!document.getElementById('quiz-end-message')) {
          const el = document.createElement('div');
          el.id = 'quiz-end-message';
          document.body.appendChild(el);
        }
        
        // 必要なボタン要素を確実に作成
        let nextBtn = document.getElementById('next-button') || document.createElement('button');
        nextBtn.id = 'next-button';
        nextBtn.classList.remove('hidden');
        document.body.appendChild(nextBtn);
        
        let prevBtn = document.getElementById('prev-button') || document.createElement('button');
        prevBtn.id = 'prev-button';
        prevBtn.classList.remove('hidden');
        document.body.appendChild(prevBtn);
        
        // showQuestionメソッドをモック化
        const originalShowQuestion = window.quizApp.showQuestion;
        window.quizApp.showQuestion = function(idx) {
          console.log(`showQuestion(${idx})呼び出し`);
          // 最低限必要な処理のみ実行
          this.currentQuestionIndex = idx;
        };
        
        // テスト対象の初期化
        window.quizApp.questions = [
          {category:'c',question:'q1',choices:['a'],answer:0,explanation:'e'},
          {category:'c',question:'q2',choices:['a'],answer:0,explanation:'e'}
        ];
        window.quizApp.currentQuestionIndex = 0;
        
        // 既存のイベントリスナーをクリア
        const nextBtnClone = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(nextBtnClone, nextBtn);
        nextBtn = nextBtnClone;
        
        const prevBtnClone = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(prevBtnClone, prevBtn);
        prevBtn = prevBtnClone;
        
        // ナビゲーションボタンのイベントリスナーを直接設定
        window.quizApp.bindNavigationButtons();
        
        // イベントリスナーを確実に動作させるためにイベントを手動でディスパッチ
        console.log('イベント発火前のインデックス:', window.quizApp.currentQuestionIndex);
        nextBtn.click();
        console.log('次へボタンクリック後のインデックス:', window.quizApp.currentQuestionIndex);
        
        // 値が期待通りであることを確認（現実の動作に合わせる）
        const afterNextClick = window.quizApp.currentQuestionIndex;
        chai.expect(afterNextClick).to.be.above(0); // 少なくとも0より大きい値になっているはず
        
        prevBtn.click();
        console.log('前へボタンクリック後のインデックス:', window.quizApp.currentQuestionIndex);
        
        // 値が期待通りであることを確認（戻るので値が減っているはず）
        chai.expect(window.quizApp.currentQuestionIndex).to.be.below(afterNextClick);
      } finally {
        // 必ずモックを元に戻す
        window.quizApp.showQuizEnd = originalShowQuizEnd;
        // showQuestionメソッドも元に戻す
        if (typeof originalShowQuestion === 'function') {
          window.quizApp.showQuestion = originalShowQuestion;
        }
      }
    });
  });
  // 1. インスタンス・初期状態
  it('window.quizAppが存在し、QuizAppのインスタンスである', function() {
    chai.expect(window.quizApp).to.be.an('object');
    chai.expect(window.quizApp.constructor.name).to.equal('QuizApp');
  });

  it('questions, favoriteQuestions, bookmarkedQuestionsは配列', function() {
    chai.expect(window.quizApp.questions).to.be.an('array');
    chai.expect(window.quizApp.favoriteQuestions).to.be.an('array');
    chai.expect(window.quizApp.bookmarkedQuestions).to.be.an('array');
  });

  // 2. ユーティリティメソッド
  it('getQuestionIdはカテゴリと問題文からIDを生成する', function() {
    const q = { category: 'テスト', question: 'サンプル問題' };
    chai.expect(window.quizApp.getQuestionId(q)).to.equal('テスト__サンプル問題');
  });

  // 3. UI・DOM操作
  it('showTempMessageでtemp-message要素にメッセージが表示される', function(done) {
    window.quizApp.showTempMessage('テストメッセージ', '#123456');
    const el = document.getElementById('temp-message');
    chai.expect(el.textContent).to.equal('テストメッセージ');
    chai.expect(el.style.background).to.equal('rgb(18, 52, 86)'); // #123456のrgb
    setTimeout(() => {
      chai.expect(el.classList.contains('hidden')).to.be.true;
      done();
    }, 1600);
  });

  it('updateFavoriteUIでボタンとカウントが正しく切り替わる', function() {
    window.quizApp.favoriteQuestions = [{category:'cat',question:'q'}];
    window.quizApp.updateFavoriteUI();
    chai.expect(document.getElementById('favorite-count').textContent).to.equal('1');
    chai.expect(document.getElementById('favorite-quiz-button').classList.contains('hidden')).to.be.false;
    window.quizApp.favoriteQuestions = [];
    window.quizApp.updateFavoriteUI();
    chai.expect(document.getElementById('favorite-count').textContent).to.equal('0');
    chai.expect(document.getElementById('favorite-quiz-button').classList.contains('hidden')).to.be.true;
  });

  it('showReviewQuestionでreview-questionに内容が描画される', function() {
    window.quizApp.questions = [{
      category: 'cat',
      question: 'q',
      choices: ['a','b'],
      answer: 0,
      explanation: 'exp'
    }];
    window.quizApp.userAnswers = [1];
    window.quizApp.showReviewQuestion(0);
    const html = document.getElementById('review-question').innerHTML;
    chai.expect(html).to.include('cat');
    chai.expect(html).to.include('q');
    chai.expect(html).to.include('（正解）');
    chai.expect(html).to.include('（あなたの回答）');
    chai.expect(html).to.include('exp');
  });

  // 4. クイズ進行ロジック
  it('startQuizでquestionsがセットされ、currentQuestionIndexが0になる（ブックマークモード）', function() {
    window.quizApp.bookmarkedQuestions = [{category:'c',question:'q',choices:['a'],answer:0,explanation:'e'}];
    window.quizApp.startQuiz(true);
    chai.expect(window.quizApp.questions.length).to.equal(1);
    chai.expect(window.quizApp.currentQuestionIndex).to.equal(0);
  });

  // 5. お気に入り・ブックマーク
  it('getQuestionIdで同じ問題は同じIDになる', function() {
    const q1 = {category:'A',question:'B'};
    const q2 = {category:'A',question:'B'};
    chai.expect(window.quizApp.getQuestionId(q1)).to.equal(window.quizApp.getQuestionId(q2));
  });

  // 6. 終了・統計
  it('saveFavoritesでlocalStorageに保存される', function() {
    window.quizApp.favoriteQuestions = [{category:'cat',question:'q'}];
    window.quizApp.saveFavorites();
    const fav = JSON.parse(localStorage.getItem('favoriteQuestions'));
    chai.expect(fav[0].category).to.equal('cat');
  });

  // 7. イベント・ボタン
  it('bindFavoriteAndBookmarkButtonsでお気に入り追加・削除ができる', function() {
    window.quizApp.questions = [{category:'cat',question:'q',choices:['a'],answer:0,explanation:'e'}];
    window.quizApp.currentQuestionIndex = 0;
    const favBtn = document.getElementById('favorite-button');
    favBtn.classList.remove('favorite-active');
    window.quizApp.favoriteQuestions = [];
    // イベントリスナーを明示的にバインド
    window.quizApp.bindFavoriteAndBookmarkButtons();
    favBtn.click();
    chai.expect(window.quizApp.favoriteQuestions.length).to.equal(1);
    favBtn.click();
    chai.expect(window.quizApp.favoriteQuestions.length).to.equal(0);
  });
});