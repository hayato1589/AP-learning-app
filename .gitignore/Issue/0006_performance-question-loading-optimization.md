
<!-- filepath: c:\tool\exercise-website\AP-learning-app\.gitignore\Issue\performance-question-loading-optimization.md -->
# 問題データ読み込みのパフォーマンス最適化

## 概要
`questions.json`のデータ量が増加しており、初回ロード時や出題時のパフォーマンス低下が懸念される。

## 詳細
- 全問題を一度に読み込むため、今後データが増えると初期表示が遅くなる可能性。
- ページネーションや遅延読み込みの導入で改善できる余地がある。

## 該当箇所
- `quiz-app.js`（データ読み込み・出題ロジック）
- `data/questions.json`

## 改善案
- 問題データの分割ロードや、必要な分だけの遅延読み込みを検討。
- ページネーションや無限スクロールの導入も選択肢。
