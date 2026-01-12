import { describe, it, expect, beforeEach } from '@jest/globals';

/**
 * configモジュールのユニットテスト
 *
 * 注意: configモジュールは起動時に環境変数を読み込むため、
 * 動的なテストが困難です。ここでは主にTRIGGER_MAPの構造をテストします。
 */
describe('config module', () => {
  describe('TRIGGER_MAP', () => {
    it('TRIGGER_MAPが正しくエクスポートされていること', async () => {
      // テスト用の環境変数を設定
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        LABELER_DID: 'did:plc:test',
        LABELER_SIGNING_KEY: 'test-key',
      };

      // configモジュールを動的にインポート
      const { TRIGGER_MAP } = await import('../config.js');

      expect(TRIGGER_MAP).toBeDefined();
      expect(typeof TRIGGER_MAP).toBe('object');

      // 環境変数を元に戻す
      process.env = originalEnv;
    });

    it('TRIGGER_MAPが正しい構造を持っていること', async () => {
      // テスト用の環境変数を設定
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        LABELER_DID: 'did:plc:test',
        LABELER_SIGNING_KEY: 'test-key',
      };

      const { TRIGGER_MAP } = await import('../config.js');

      // キーがAT URI形式であることを確認
      Object.keys(TRIGGER_MAP).forEach((key) => {
        expect(key).toMatch(/^at:\/\//);
      });

      // 値が文字列であることを確認
      Object.values(TRIGGER_MAP).forEach((value) => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });

      // 環境変数を元に戻す
      process.env = originalEnv;
    });

    it('サンプルのトリガーマッピングが含まれていること', async () => {
      // テスト用の環境変数を設定
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        LABELER_DID: 'did:plc:test',
        LABELER_SIGNING_KEY: 'test-key',
      };

      const { TRIGGER_MAP } = await import('../config.js');

      // 少なくとも1つのマッピングが存在することを確認
      expect(Object.keys(TRIGGER_MAP).length).toBeGreaterThan(0);

      // 特定のサンプルマッピングが存在することを確認
      expect(TRIGGER_MAP['at://did:plc:example1/app.bsky.feed.post/abc123']).toBe(
        'early-supporter'
      );
      expect(TRIGGER_MAP['at://did:plc:example2/app.bsky.feed.post/def456']).toBe(
        'community-member'
      );
      expect(TRIGGER_MAP['at://did:plc:example3/app.bsky.feed.post/ghi789']).toBe('beta-tester');

      // 環境変数を元に戻す
      process.env = originalEnv;
    });
  });

  describe('config object', () => {
    it('config構造が正しいこと', async () => {
      // テスト用の環境変数を設定
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        LABELER_DID: 'did:plc:test',
        LABELER_SIGNING_KEY: 'test-key',
      };

      const { config } = await import('../config.js');

      // configオブジェクトが必要なプロパティを持っていることを確認
      expect(config).toHaveProperty('labelerDid');
      expect(config).toHaveProperty('labelerSigningKey');
      expect(config).toHaveProperty('labelerPort');
      expect(config).toHaveProperty('labelerDbPath');
      expect(config).toHaveProperty('dbFile');
      expect(config).toHaveProperty('logLevel');

      // 環境変数を元に戻す
      process.env = originalEnv;
    });

    it('labelerPortが数値型であること', async () => {
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        LABELER_DID: 'did:plc:test',
        LABELER_SIGNING_KEY: 'test-key',
      };

      const { config } = await import('../config.js');

      expect(typeof config.labelerPort).toBe('number');
      expect(config.labelerPort).toBeGreaterThan(0);
      expect(config.labelerPort).toBeLessThan(65536);

      process.env = originalEnv;
    });

    it('logLevelが有効な値であること', async () => {
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        LABELER_DID: 'did:plc:test',
        LABELER_SIGNING_KEY: 'test-key',
      };

      const { config } = await import('../config.js');

      expect(['debug', 'info', 'warn', 'error']).toContain(config.logLevel);

      process.env = originalEnv;
    });
  });

  describe('logLevel validation', () => {
    it('有効なlogLevel値が受け入れられること', async () => {
      const validLogLevels = ['debug', 'info', 'warn', 'error'];

      for (const level of validLogLevels) {
        const originalEnv = process.env;
        process.env = {
          ...originalEnv,
          LABELER_DID: 'did:plc:test',
          LABELER_SIGNING_KEY: 'test-key',
          LOG_LEVEL: level,
        };

        const { config } = await import('../config.js');
        expect(['debug', 'info', 'warn', 'error']).toContain(config.logLevel);

        process.env = originalEnv;
      }
    });
  });
});
