
<!-- filepath: c:\tool\exercise-website\AP-learning-app\.gitignore\Issue\bug-timer-not-stopping-on-clearTimer.md -->
# タイマーがclearTimerで正しく停止しない場合がある

## 概要
`quiz-app.js`の`clearTimer`メソッドでタイマーを停止しても、まれに`timerSeconds`が減り続けることがある。

## 詳細
- テストコード（`spec/quiz-app.spec.js`）のタイマー関連テストで、`clearTimer`実行後も値が変化するケースが報告されている。
- setIntervalの多重起動や、timerIntervalの管理不備が原因の可能性がある。

## 該当箇所
- `quiz-app.js`（`startTimer`, `clearTimer`）
- `spec/quiz-app.spec.js`（タイマーのテスト）

## 改善案
- `clearTimer`で必ず`timerInterval`をnullにし、setIntervalの多重起動を防ぐ。
- テストケースでのタイマー初期化処理の見直し。
