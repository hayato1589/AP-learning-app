# ドキュメント: READMEのセットアップ手順と実態の乖離

## 概要
`README.md`のセットアップ手順に`npm install`や`npm start`の記載があるが、実際にはバニラJSのみでnpmスクリプトが存在しない。

## 詳細
- `README.md`の「セットアップ手順」セクションにnpmコマンドの記載。
- `package.json`が存在しないため、npm installやstartは実行できない。

## 該当箇所
- `README.md`（セットアップ手順）

## 改善案
- 実際のセットアップ手順（ファイル配置・ブラウザで開くだけ等）に修正。
- npmスクリプトを導入する場合は`package.json`を追加。
