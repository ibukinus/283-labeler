export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogMeta = Record<string, unknown>;

interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * ロガークラス
 *
 * ログレベルに応じた出力制御を行います。
 * プレフィックス付きでログを整形し、構造化されたメタデータをサポートします。
 */
export class Logger {
  private level: LogLevel;
  private prefix: string;

  constructor(config: LoggerConfig) {
    this.level = config.level;
    this.prefix = config.prefix || '';
  }

  /**
   * 指定されたログレベルが現在の設定で出力可能かチェック
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.level];
  }

  /**
   * ログメッセージをフォーマット
   */
  private formatMessage(level: string, msg: string): string {
    const prefix = this.prefix ? `[${this.prefix}] ` : '';
    return `${prefix}[${level.toUpperCase()}] ${msg}`;
  }

  /**
   * デバッグレベルのログを出力
   */
  debug(msg: string, meta?: LogMeta): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', msg), meta || '');
    }
  }

  /**
   * 情報レベルのログを出力
   */
  info(msg: string, meta?: LogMeta): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', msg), meta || '');
    }
  }

  /**
   * 警告レベルのログを出力
   */
  warn(msg: string, meta?: LogMeta): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', msg), meta || '');
    }
  }

  /**
   * エラーレベルのログを出力
   */
  error(msg: string, meta?: LogMeta): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', msg), meta || '');
    }
  }
}

/**
 * ロガーインスタンスを作成するファクトリ関数
 *
 * @param level - ログレベル
 * @param prefix - ログメッセージのプレフィックス（省略可）
 * @returns Loggerインスタンス
 */
export function createLogger(level: LogLevel, prefix?: string): Logger {
  return new Logger({ level, prefix });
}
