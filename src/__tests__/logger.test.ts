import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Logger, createLogger } from '../logger.js';

/**
 * Loggerクラスのユニットテスト
 */
describe('Logger', () => {
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    // コンソール出力をモック
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // モックをリストア
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('createLogger', () => {
    it('ファクトリ関数でLoggerインスタンスを作成できること', () => {
      const logger = createLogger('info');
      expect(logger).toBeInstanceOf(Logger);
    });

    it('プレフィックス付きでLoggerインスタンスを作成できること', () => {
      const logger = createLogger('info', 'test-app');
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('ログレベルフィルタリング', () => {
    it('debugレベル: すべてのログが出力されること', () => {
      const logger = createLogger('debug');

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // debug, info
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1); // warn
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1); // error
    });

    it('infoレベル: info以上のログが出力されること', () => {
      const logger = createLogger('info');

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1); // info only
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1); // warn
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1); // error
    });

    it('warnレベル: warn以上のログが出力されること', () => {
      const logger = createLogger('warn');

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(0); // none
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1); // warn
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1); // error
    });

    it('errorレベル: errorのみ出力されること', () => {
      const logger = createLogger('error');

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(0); // none
      expect(consoleWarnSpy).toHaveBeenCalledTimes(0); // none
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1); // error only
    });
  });

  describe('メッセージフォーマット', () => {
    it('プレフィックスなしの場合、レベルのみ付与されること', () => {
      const logger = createLogger('info');

      logger.info('test message');

      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] test message', '');
    });

    it('プレフィックスありの場合、プレフィックスとレベルが付与されること', () => {
      const logger = createLogger('info', 'my-app');

      logger.info('test message');

      expect(consoleLogSpy).toHaveBeenCalledWith('[my-app] [INFO] test message', '');
    });

    it('メタデータを渡すと第2引数として出力されること', () => {
      const logger = createLogger('info');
      const meta = { key: 'value', count: 123 };

      logger.info('test message', meta);

      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] test message', meta);
    });

    it('メタデータがない場合は空文字列が渡されること', () => {
      const logger = createLogger('info');

      logger.info('test message');

      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] test message', '');
    });
  });

  describe('各ログレベルの動作', () => {
    it('debugメソッドが正しく動作すること', () => {
      const logger = createLogger('debug');

      logger.debug('debug test');

      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] debug test', '');
    });

    it('infoメソッドが正しく動作すること', () => {
      const logger = createLogger('info');

      logger.info('info test');

      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] info test', '');
    });

    it('warnメソッドが正しく動作すること', () => {
      const logger = createLogger('warn');

      logger.warn('warn test');

      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] warn test', '');
    });

    it('errorメソッドが正しく動作すること', () => {
      const logger = createLogger('error');

      logger.error('error test');

      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] error test', '');
    });
  });

  describe('複雑なユースケース', () => {
    it('複数のメタデータフィールドを持つログが正しく出力されること', () => {
      const logger = createLogger('info', 'test-service');
      const meta = {
        userId: 'user123',
        action: 'login',
        timestamp: Date.now(),
        nested: { key: 'value' },
      };

      logger.info('User action', meta);

      expect(consoleLogSpy).toHaveBeenCalledWith('[test-service] [INFO] User action', meta);
    });

    it('連続したログ呼び出しがすべて正しく処理されること', () => {
      const logger = createLogger('debug', 'multi-log');

      logger.debug('First log');
      logger.info('Second log');
      logger.warn('Third log');
      logger.error('Fourth log');

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });
});
