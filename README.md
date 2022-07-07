# ウェブアクセシビリティ検証ツール「axe-test」
[![CodeQL](https://github.com/ttsukagoshi/axe-test/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/ttsukagoshi/axe-test/actions/workflows/codeql-analysis.yml) [![Lint Code Base](https://github.com/ttsukagoshi/axe-test/actions/workflows/linter.yml/badge.svg)](https://github.com/ttsukagoshi/axe-test/actions/workflows/linter.yml)

Deque Systems, Inc. が開発、公開しているウェブアクセシビリティ検証ツール「[axe](https://www.deque.com/axe/)」のコアエンジン「axe-core」を利用して、ウェブサイトのアクセシビリティ自動テストを実行するためのスクリプトです。Node.js ライブラリ「[Puppeteer](https://pptr.dev/)」と併せて使います。

ウェブサイト全体 (数百ページ規模) を対象に、一括処理でアクセシビリティを検証し、その結果を、日本語でスプレッドシート (.csv ファイル) に出力することができます。

## 事前準備

### Node.js のインストール

[Node.js のサイト](https://nodejs.org/ja/)から、Node.js のインストーラー（最新 LTS 版）をお使いのパソコンにダウンロードし、実行します。Node.js と npm (Node Package Manager) がインストールされます。

### 本レポジトリ内のフォルダ一式をローカル環境にコピー

[ttsukagoshi/axe-test](https://github.com/ttsukagoshi/axe-test)の右上にある「Code」で「Download ZIP」を選択し、お好みの場所で解凍してください。以下、ここで解凍したフォルダを「作業フォルダ」と呼びます。

レポジトリを fork, `git clone` などをご存知の方は、お好きな方法でどうぞ。

### Dependencies のインストール

作業フォルダでターミナル（コマンドプロンプト）を開き、次のコマンドを実行します。

```
npm ci
```

## アクセシビリティ自動テストを実行する

### 対象 URL リストを作業フォルダ内で作成

テスト対象となる URL 一覧を記載したテキストファイルを作成し、「**urls.txt**」というファイル名で保存します。テキストファイルの中身は、1 行ごとに 1 つの URL を記述しただけのものにしてください。
(なお、Basic 認証が適用されているページに対してテストを実行する場合は、各行の URL 記述を https://userid:password@example.com/ という具合にします。)

### テストの実行

ターミナル (コマンドプロンプト) が作業フォルダにあることを確認して、以下のように入力します。

```
node .
```

テストの実行には少し時間がかかると思います（数百ページ規模だと、数十分かかるかもしれません）。`アクセシビリティ検査が完了しました。` と表示されれば検査完了です。作業フォルダ直下に `axe-results.csv` という.csv ファイルが生成されます。あとはこれを Excel や Google スプレッドシートで開いて、適宜ご活用ください。

<img width="1294" alt="「axe-test.js」によって出力されたテスト結果 (.csv) のイメージ" src="https://user-images.githubusercontent.com/55706659/151901139-a87e171b-c37d-4938-867d-14183982eb1d.png">

### オプション設定

作業フォルダ直下にある `user-settings.json` を編集することで、初期設定を変更できます。

#### 設定できる値

<!-- prettier-ignore -->
| 変数名 | データ型 | 意味 | 初期値 |
| --- | --- | --- | --- |
| `axeCoreTags` | *Array* | テストの基準となるアクセシビリティ水準を指定します。初期値は、WCAG 2.1 (および 2.0) の、達成基準レベル A と AA に相当するテストルールを適用して、テストを実行する設定となっています。ここに記述可能な水準については、[axe API Documentation の 「Axe-core Tags」のセクション](https://www.deque.com/axe/core-documentation/api-documentation/#user-content-axe-core-tags) をご参照ください。 | `["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]` |
| `resultTypes` | *Array*  | 出力する結果の種類を指定します。 `inapplicable`: 判定対象外の基準/`incomplete`: 適合しているか判断できなかった基準/ `passes`: 適合している判断とされた基準/ `violations`: 適合していないと判断された基準。詳細は公式ドキュメントをご参照ください: https://www.deque.com/axe/core-documentation/api-documentation/#options-parameter | `["incomplete", "violations"]` |
| `inputPath` | *String*  | URL一覧のテキストファイルのファイルパス | `./urls.txt` |
| `inputEncode` | *String*  | URL一覧のテキストファイルの文字エンコード。サポートされている形式については公式ドキュメントを参照: https://nodejs.org/api/buffer.html#buffers-and-character-encodings | `utf8` |
| `outputPath` | *String*  | 出力するCSVのファイルパス | `./axe-results.csv` |
| `outputEncode` | *String*  | 出力するCSVファイルの文字エンコード。サポートされている形式については公式ドキュメントを参照: https://nodejs.org/api/buffer.html#buffers-and-character-encodings | `utf8` |

#### `user-settings.json` の例

変更した項目だけ残して、残りは削除しても問題ありません。削除した項目では自動的に初期値が適用されます。

```json
{
  "axeCoreTags": ["wcag2a", "wcag2aa"],
  "resultTypes": ["violations"],
  "inputPath": "./private/urls.txt",
  "inputEncode": "utf16le"
}
```

### コマンドラインへの出力

実行コマンドに `--cli` とつけることで、ファイル出力の代わりにコマンドライン出力できます。

```
node . --cli
```
