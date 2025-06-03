
<!-- filepath: c:\tool\exercise-website\AP-learning-app\.gitignore\Issue\code-naming-inconsistency.md -->
# コード品質: 変数・関数の命名規則の不統一

## 概要
一部の変数・関数名がキャメルケースとスネークケースで混在しており、可読性・保守性の低下につながる。

## 詳細
- `quiz-app.js`内で命名規則が統一されていない箇所がある。
- 例: `favoriteQuestions`と`MISTAKE_HISTORY_KEY`など。

## 該当箇所
- `quiz-app.js`（全体）

## 改善案
- 命名規則（キャメルケース/スネークケース/定数は大文字など）をプロジェクトで統一。
- コード全体でリファクタリングを実施。
