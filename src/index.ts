import { Jetstream } from '@skyware/jetstream';
import WebSocket from 'ws';
import { ApplicationContext } from './application.js';
import { createLogger } from './logger.js';
import { LikeHandler } from './handlers/like-handler.js';
import { config, TRIGGER_MAP } from './config.js';

/**
 * アプリケーションコンテキスト（グローバル変数の代替）
 */
let appContext: ApplicationContext;

/**
 * メイン処理
 *
 * Jetstreamに接続し、Likeイベントをリスニングします。
 */
async function main(): Promise<void> {
  // ApplicationContextの初期化
  const logger = createLogger(config.logLevel, '283-labeler');
  appContext = new ApplicationContext(config, logger);

  logger.info('ラベラーシステム起動中...');
  logger.info(`設定: LABELER_DID=${config.labelerDid}, DB=${config.dbFile}`);

  // ApplicationContextの初期化（LabelerServer起動とキャッシュロード）
  try {
    await appContext.initialize();
  } catch (error) {
    logger.error('アプリケーション初期化に失敗しました。環境変数を確認してください。');
    throw error;
  }

  // LikeHandlerの初期化
  const likeHandler = new LikeHandler(
    appContext.getDatabase(),
    appContext.getCache(),
    appContext.getLabelerServer(),
    appContext.getLogger(),
    TRIGGER_MAP
  );

  // Jetstream接続
  const jetstream = new Jetstream({
    wantedCollections: ['app.bsky.feed.like'], // Likeイベントのみ
    ws: WebSocket,
  });

  // ApplicationContextにJetstreamを設定
  appContext.setJetstream(jetstream);

  // イベントリスナー: 接続成功
  jetstream.on('open', () => {
    logger.info('Jetstream接続成功');
  });

  // イベントリスナー: 接続クローズ
  jetstream.on('close', () => {
    logger.warn('Jetstream接続クローズ');
  });

  // イベントリスナー: エラー
  jetstream.on('error', (error) => {
    logger.error('Jetstreamエラー:', { error });
  });

  // Likeイベント処理: 作成
  jetstream.onCreate('app.bsky.feed.like', (event) => {
    const { did } = event;
    const { rkey, record } = event.commit;
    likeHandler.handleCreate(did, rkey, record).catch((error) => {
      logger.error('Like作成ハンドラーでキャッチされなかったエラー:', { error });
    });
  });

  // Likeイベント処理: 削除
  jetstream.onDelete('app.bsky.feed.like', (event) => {
    const { did } = event;
    const { rkey } = event.commit;
    likeHandler.handleDelete(did, rkey).catch((error) => {
      logger.error('Like削除ハンドラーでキャッチされなかったエラー:', { error });
    });
  });

  // 起動
  jetstream.start();
  logger.info('Jetstreamリスニング開始');
}

/**
 * グレースフルシャットダウン: SIGINT (Ctrl+C)
 */
process.on('SIGINT', async () => {
  if (appContext) {
    appContext.getLogger().info('シャットダウンシグナル受信 (SIGINT)');
    await appContext.shutdown();
  }
  process.exit(0);
});

/**
 * グレースフルシャットダウン: SIGTERM
 */
process.on('SIGTERM', async () => {
  if (appContext) {
    appContext.getLogger().info('シャットダウンシグナル受信 (SIGTERM)');
    await appContext.shutdown();
  }
  process.exit(0);
});

/**
 * エントリーポイント
 */
main().catch(async (error) => {
  if (appContext) {
    appContext.getLogger().error('致命的エラー:', { error });
    await appContext.shutdown();
  } else {
    console.error('致命的エラー:', error);
  }
  process.exit(1);
});
