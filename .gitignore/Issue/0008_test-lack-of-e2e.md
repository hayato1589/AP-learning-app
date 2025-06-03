
<!-- filepath: c:\tool\exercise-website\AP-learning-app\.gitignore\Issue\test-lack-of-e2e.md -->
# テスト: E2E（エンドツーエンド）テストの不足

## 概要
現状はユニットテスト（`spec/quiz-app.spec.js`）のみで、実際のユーザー操作を通したE2Eテストが未実装。

## 詳細
- UI全体の流れや、複数機能の連携動作を自動検証するテストがない。
- 主要なユーザーフロー（出題→解答→成績表示→復習など）の自動化が望ましい。

## 該当箇所
- `spec/quiz-app.spec.js`（ユニットテストのみ）

## 改善案
- CypressやPlaywrightなどE2Eテストフレームワークの導入。
- 主要なユーザーフローの自動テストケース追加。
