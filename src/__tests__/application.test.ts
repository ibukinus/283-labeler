import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ApplicationContext } from '../application.js';
import { createLogger } from '../logger.js';
import { Config } from '../config.js';
import fs from 'fs';
import path from 'path';

/**
 * ApplicationContextクラスのユニットテスト
 */
describe('ApplicationContext', () => {
  let testConfig: Config;
  let appContext: ApplicationContext;
  const testDbPath = path.join(process.cwd(), 'test-app-context.db');
  const testLabelerDbPath = path.join(process.cwd(), 'test-labeler.db');

  beforeEach(() => {
    // テスト用データベースファイルを削除
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    if (fs.existsSync(testLabelerDbPath)) {
      fs.unlinkSync(testLabelerDbPath);
    }

    // テスト用の設定
    testConfig = {
      labelerDid: 'did:plc:test123',
      labelerSigningKey: 'test-signing-key',
      labelerIdentifier: 'test.bsky.social',
      labelerPassword: 'test-password',
      labelerPort: 14832, // テスト用に別ポートを使用
      labelerDbPath: testLabelerDbPath,
      dbFile: testDbPath,
      logLevel: 'error', // テスト時はエラーのみ
    };

    const logger = createLogger('error');
    appContext = new ApplicationContext(testConfig, logger);
  });

  afterEach(async () => {
    // クリーンアップ
    if (appContext) {
      await appContext.shutdown();
    }

    // テスト用データベースファイルを削除
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    if (fs.existsSync(testLabelerDbPath)) {
      fs.unlinkSync(testLabelerDbPath);
    }
  });

  describe('initializeCache', () => {
    it('空のデータベースでキャッシュ初期化が成功すること', () => {
      const result = appContext.initializeCache();

      expect(result.success).toBe(true);
      expect(result.count).toBe(0);
      expect(result.error).toBeUndefined();
    });

    it('データがある場合、正しい件数がロードされること', () => {
      const db = appContext.getDatabase();

      // テストデータを追加
      db.addLike('did:plc:user1', 'rkey1', 'at://test/post/1');
      db.addLike('did:plc:user2', 'rkey2', 'at://test/post/2');
      db.addLike('did:plc:user3', 'rkey3', 'at://test/post/3');

      const result = appContext.initializeCache();

      expect(result.success).toBe(true);
      expect(result.count).toBe(3);
    });

    it('キャッシュにデータが正しく格納されること', () => {
      const db = appContext.getDatabase();
      db.addLike('did:plc:user1', 'rkey1', 'at://test/post/1');

      appContext.initializeCache();
      const cache = appContext.getCache();

      expect(cache.has('did:plc:user1:rkey1')).toBe(true);
    });
  });

  describe('Getterメソッド', () => {
    it('getDatabaseでデータベースインスタンスを取得できること', () => {
      const db = appContext.getDatabase();
      expect(db).toBeDefined();
      expect(typeof db.addLike).toBe('function');
    });

    it('getCacheでキャッシュを取得できること', () => {
      const cache = appContext.getCache();
      expect(cache).toBeInstanceOf(Set);
    });

    it('getLoggerでロガーを取得できること', () => {
      const logger = appContext.getLogger();
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
    });

    it('getConfigで設定を取得できること', () => {
      const config = appContext.getConfig();
      expect(config).toEqual(testConfig);
    });

    it('getLabelerServerは初期化前はnullを返すこと', () => {
      const server = appContext.getLabelerServer();
      expect(server).toBeNull();
    });
  });

  describe('shutdown', () => {
    it('シャットダウンが正常に完了すること', async () => {
      await expect(appContext.shutdown()).resolves.toBeUndefined();
    });

    it('シャットダウン後、データベースがクローズされること', async () => {
      const db = appContext.getDatabase();
      await appContext.shutdown();

      // クローズ後は操作できないことを確認
      expect(() => db.addLike('did:plc:test', 'rkey', 'uri')).toThrow();
    });

    it('2重シャットダウンは安全に処理されること', async () => {
      await appContext.shutdown();
      await expect(appContext.shutdown()).resolves.toBeUndefined();
    });
  });

  describe('setJetstream', () => {
    it('Jetstreamインスタンスを設定できること', () => {
      const mockJetstream = {
        close: () => {},
      } as any;
      expect(() => appContext.setJetstream(mockJetstream)).not.toThrow();
    });
  });

  describe('統合シナリオ', () => {
    it('データ追加→キャッシュ初期化→データ取得の流れが正しく動作すること', () => {
      const db = appContext.getDatabase();

      // データ追加
      db.addLike('did:plc:alice', 'like123', 'at://test/post/abc');
      db.addLike('did:plc:bob', 'like456', 'at://test/post/def');

      // キャッシュ初期化
      const result = appContext.initializeCache();
      expect(result.success).toBe(true);
      expect(result.count).toBe(2);

      // キャッシュから確認
      const cache = appContext.getCache();
      expect(cache.has('did:plc:alice:like123')).toBe(true);
      expect(cache.has('did:plc:bob:like456')).toBe(true);
    });
  });
});
