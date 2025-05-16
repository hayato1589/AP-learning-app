console.log('chai:', typeof chai, chai);

describe('QuizApp', function() {
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
    favBtn.click();
    chai.expect(window.quizApp.favoriteQuestions.length).to.equal(1);
    favBtn.click();
    chai.expect(window.quizApp.favoriteQuestions.length).to.equal(0);
  });
});