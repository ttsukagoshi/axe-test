const fs = require('fs');
const { AxePuppeteer } = require('@axe-core/puppeteer');
const puppeteer = require('puppeteer');
const AXE_LOCALE_JA = require('axe-core/locales/ja.json');
const config = {
  locale: AXE_LOCALE_JA, // テスト結果を日本語で出力するように設定する。
};

// 初期設定。詳細はREADMEを参照:
// https://github.com/ttsukagoshi/axe-test/blob/main-ops/README.md
const DEFAULT_SETTINGS = {
  axeCoreTags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
  resultTypes: ['incomplete', 'violations'],
  inputPath: './urls.txt',
  inputEncode: 'utf8',
  outputPath: './axe-results.csv',
  outputEncode: 'utf8',
};
// ユーザ設定ファイルのファイルパス
const USER_SETTINGS_FILE_PATH = './user-settings.json';
// 出力されるテスト結果のフィールド名（ヘッダ行）
const REPORT_HEADER = [
  'URL',
  'Rule Type', // rule ID
  'Result Type', // inapplicable, incomplete, passes, or violations
  'Rule Set', // wcag2aa etc.
  'Impact', // "minor", "moderate", "serious", or "critical"
  'Message',
  'HTML Element',
  'DOM Element',
  'Help',
  'Help URL',
  'WCAG index', // 1.4.3, 2.3.1, etc.
];

(async () => {
  try {
    let cliMode = false; // デフォルトではファイル出力する
    let outputText = ''; // ファイル出力用のテキスト
    if (process.argv[2]) {
      // 引数を受け取った場合の処理
      if (process.argv[2] === '--cli') {
        cliMode = true; // CLI出力
      } else {
        throw new Error(
          `${process.argv[2]} は無効な引数です。「--cli」とすることで、結果をファイル出力する代わりにコマンドラインで返します。`
        );
      }
    }

    // ユーザ設定を取得
    let userSettings = JSON.parse(
      await fs.promises.readFile(USER_SETTINGS_FILE_PATH)
    );
    // ユーザ設定で指定されていない項目には初期値を適用
    Object.keys(DEFAULT_SETTINGS).forEach((key) => {
      if (!userSettings[key]) {
        userSettings[key] = DEFAULT_SETTINGS[key];
      }
    });

    // テスト対象の URL を、外部テキストファイルから読み込んで、配列に整形する。
    const urls = fs
      .readFileSync(userSettings.inputPath, {
        encoding: userSettings.inputEncode,
      })
      .replace(/\r?\n/g, ',')
      .split(',');

    const browser = await puppeteer.launch();

    for (let i = 0; i < urls.length; i++) {
      if (i === 0) {
        const outputHeader = REPORT_HEADER.join(); // 出力1行目としてヘッダ行を追加
        if (cliMode) {
          console.log(outputHeader);
        } else {
          outputText += outputHeader;
        }
      }
      const url = urls[i];
      const page = await browser.newPage();
      await page.setBypassCSP(true);

      // デバイスのエミュレートをする場合は、下記を適用する。
      // await page.emulate(puppeteer.devices['iPhone 8']);

      // ページを読み込む。
      await Promise.all([
        page.setDefaultNavigationTimeout(0),
        page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
        page.goto(`${url}`),
      ]);

      // テストを実行
      const results = await new AxePuppeteer(page)
        .configure(config)
        .withTags(userSettings.axeCoreTags)
        .analyze();
      // テスト結果をCSVとして出力できるように整形
      userSettings.resultTypes.forEach((resultType) => {
        results[resultType].forEach((resultItem) => {
          resultItem.nodes.forEach((node) => {
            node.any.forEach((a) => {
              let outputRow = [
                results.url,
                resultItem.id,
                resultType,
                resultItem.tags
                  .filter((tag) => userSettings.axeCoreTags.includes(tag))
                  .join(),
                resultItem.impact,
                a.message,
                node.html,
                node.target.join(),
                resultItem.help,
                resultItem.helpUrl,
                resultItem.tags
                  .reduce((arr, tag) => {
                    if (tag.match(/^wcag\d{3}$/)) {
                      arr.push(
                        [
                          tag.slice(-3, -2),
                          tag.slice(-2, -1),
                          tag.slice(-1),
                        ].join('.')
                      );
                    }
                    return arr;
                  }, [])
                  .join(' '),
              ]
                .map((value) =>
                  String(value)
                    .replace(/,/g, '-')
                    .replace(/(\n|\r|\r\n)/gm, ' ')
                )
                .join();
              if (cliMode) {
                console.log(outputRow);
              } else {
                outputText += `\n${outputRow}`;
              }
            });
          });
        });
      });
      await page.close();
    }
    await browser.close();
    if (!cliMode) {
      fs.writeFileSync(userSettings.outputPath, outputText, {
        encoding: userSettings.outputEncode,
      });
    }
    console.info(
      `アクセシビリティ検査が完了しました。${
        cliMode ? '' : userSettings.outputPath + ' に結果が出力されています。'
      }`
    );
  } catch (error) {
    console.error(error);
  }
})();
