
<!-- filepath: c:\tool\exercise-website\AP-learning-app\.gitignore\Issue\accessibility-label-missing.md -->
# アクセシビリティ: フォームラベルやaria属性の不足

## 概要
一部のフォーム要素やボタンにラベルやaria属性が不足しており、スクリーンリーダー利用者への配慮が不十分。

## 詳細
- `index.html`のボタンやモーダルに明示的なラベルやaria属性がない箇所がある。
- 入力欄やダイアログのアクセシビリティ向上が必要。

## 該当箇所
- `index.html`（ボタン、モーダル、入力欄）

## 改善案
- すべてのボタン・入力欄に`aria-label`や`aria-labelledby`を付与。
- モーダルには`role="dialog"`や`aria-modal="true"`を明示。
- ラベル要素の追加や、スクリーンリーダー向けテキストの挿入。
