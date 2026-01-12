import { declareLabeler } from '@skyware/labeler/scripts';
import { LABELS, LABEL_DEFINITION_DEFAULTS } from '../src/constants.js';
import { config } from '../src/config.js';
import type { ComAtprotoLabelDefs } from '@atcute/client/lexicons';

/**
 * ラベル定義をBlueskyに登録するスクリプト
 *
 * src/constants.tsのLABELS配列を読み込み、
 * @skyware/labelerのdeclareLabeler関数を使用して
 * Blueskyのラベラーサービスに登録します。
 */
async function main() {
  console.log('='.repeat(60));
  console.log('ラベル定義登録スクリプト');
  console.log('='.repeat(60));

  // 1. 環境変数の確認
  console.log('\n[1/3] 環境変数を確認しています...');
  console.log(`  LABELER_DID: ${config.labelerDid}`);
  console.log(`  LABELER_IDENTIFIER: ${config.labelerIdentifier}`);

  // 2. ラベル定義の変換
  console.log('\n[2/3] ラベル定義を準備しています...');
  const labelDefinitions: ComAtprotoLabelDefs.LabelValueDefinition[] = LABELS.map((label) => ({
    identifier: label.identifier,
    ...LABEL_DEFINITION_DEFAULTS,
    locales: label.locales,
  }));

  console.log(`  登録するラベル数: ${labelDefinitions.length}件`);

  // ラベル一覧を表示
  labelDefinitions.forEach((def, index) => {
    const displayName = def.locales[0]?.name || def.identifier;
    console.log(`    [${(index + 1).toString().padStart(2, '0')}] ${def.identifier.padEnd(25)} - ${displayName}`);
  });

  // 3. Blueskyへの登録
  console.log('\n[3/3] Blueskyに登録しています...');
  console.log('  認証中...');

  try {
    await declareLabeler(
      {
        identifier: config.labelerIdentifier,
        password: config.labelerPassword,
      },
      labelDefinitions,
      true // overwriteExisting: 既存のラベル定義を上書き
    );

    console.log('  ✓ 登録成功！');
  } catch (error) {
    console.error('  ✗ 登録失敗');
    if (error instanceof Error) {
      console.error(`  エラー: ${error.message}`);
    }
    throw error;
  }

  // 完了メッセージ
  console.log('\n' + '='.repeat(60));
  console.log('完了しました！');
  console.log(`登録されたラベル: ${labelDefinitions.length}件`);
  console.log('='.repeat(60));
}

// スクリプト実行
main().catch((error) => {
  console.error('\n致命的エラーが発生しました:', error);
  process.exit(1);
});
