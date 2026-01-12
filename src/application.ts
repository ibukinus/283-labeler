import { Jetstream } from '@skyware/jetstream';
import { LabelerServer } from '@skyware/labeler';
import { LikeDatabase } from './db.js';
import { Config } from './config.js';
import { Logger } from './logger.js';
import { generateCacheKey } from './constants.js';
import type { InitializationResult } from './types.js';

/**
 * アプリケーションコンテキスト
 *
 * グローバル変数を排除し、依存性を明示的に管理するクラス。
 * テスタビリティの向上と状態管理の一元化を目的とします。
 */
export class ApplicationContext {
  private likeCache: Set<string>;
  private db: LikeDatabase;
  private labelerServer: LabelerServer | null = null;
  private jetstream: Jetstream | null = null;
  private isShuttingDown = false;
  private logger: Logger;

  constructor(
    private config: Config,
    logger: Logger
  ) {
    this.logger = logger;
    this.db = new LikeDatabase(config.dbFile);
    this.likeCache = new Set();
  }

  /**
   * キャッシュを初期化
   *
   * DBから全Likeをロードしてキャッシュに格納します。
   * Like削除イベント時の高速な存在確認が可能になります。
   */
  initializeCache(): InitializationResult {
    try {
      const allLikes = this.db.getAllLikes();
      allLikes.forEach((like) => {
        this.likeCache.add(generateCacheKey(like.did, like.rkey));
      });
      this.logger.info(`キャッシュ初期化完了: ${this.likeCache.size}件のLikeをロード`);
      return { success: true, count: this.likeCache.size };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('キャッシュ初期化エラー:', { error: err.message });
      return { success: false, count: 0, error: err };
    }
  }

  /**
   * LabelerServerを初期化
   *
   * @returns Promise<LabelerServer> 起動成功したLabelerServerインスタンス
   * @throws Error 起動失敗時
   */
  async initializeLabelerServer(): Promise<LabelerServer> {
    return new Promise((resolve, reject) => {
      try {
        const server = new LabelerServer({
          did: this.config.labelerDid,
          signingKey: this.config.labelerSigningKey,
          dbPath: this.config.labelerDbPath,
        });

        server.start(this.config.labelerPort, (error: Error | null, address?: string) => {
          if (error) {
            this.logger.error('LabelerServer起動失敗:', { error: error.message });
            reject(error);
          } else {
            this.logger.info(`LabelerServer起動成功: ${address || `port ${this.config.labelerPort}`}`);
            this.labelerServer = server;
            resolve(server);
          }
        });
      } catch (error) {
        this.logger.error('LabelerServer初期化エラー:', { error });
        reject(error);
      }
    });
  }

  /**
   * システム全体を初期化
   *
   * LabelerServerの起動とキャッシュの初期化を行います。
   */
  async initialize(): Promise<void> {
    this.logger.info('アプリケーション初期化中...');

    await this.initializeLabelerServer();
    const cacheResult = this.initializeCache();

    if (!cacheResult.success) {
      throw cacheResult.error || new Error('キャッシュ初期化に失敗しました');
    }
  }

  /**
   * グレースフルシャットダウン
   *
   * Jetstream、LabelerServer、データベースを順次クローズします。
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      this.logger.debug('シャットダウン処理は既に実行中です');
      return;
    }
    this.isShuttingDown = true;

    this.logger.info('シャットダウン処理開始...');

    if (this.jetstream) {
      this.jetstream.close();
      this.logger.info('Jetstreamクローズ完了');
    }

    if (this.labelerServer) {
      await new Promise<void>((resolve) => {
        this.labelerServer!.close(() => {
          this.logger.info('LabelerServerクローズ完了');
          resolve();
        });
      });
    }

    this.db.close();
    this.logger.info('データベースクローズ完了');
    this.logger.info('シャットダウン完了');
  }

  // Getter methods
  getDatabase(): LikeDatabase {
    return this.db;
  }

  getCache(): Set<string> {
    return this.likeCache;
  }

  getLabelerServer(): LabelerServer | null {
    return this.labelerServer;
  }

  getLogger(): Logger {
    return this.logger;
  }

  getConfig(): Config {
    return this.config;
  }

  setJetstream(jetstream: Jetstream): void {
    this.jetstream = jetstream;
  }
}
