import Database from 'better-sqlite3';
import type { LikeRecord } from './types.js';

/**
 * 型ガード: LikeRecordかどうかをチェック
 *
 * @param obj チェック対象のオブジェクト
 * @returns LikeRecord型であればtrue
 */
function isLikeRecord(obj: unknown): obj is LikeRecord {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'did' in obj &&
    'rkey' in obj &&
    'trigger_uri' in obj &&
    'created_at' in obj &&
    typeof (obj as Record<string, unknown>).did === 'string' &&
    typeof (obj as Record<string, unknown>).rkey === 'string' &&
    typeof (obj as Record<string, unknown>).trigger_uri === 'string' &&
    typeof (obj as Record<string, unknown>).created_at === 'number'
  );
}

/**
 * 型ガード: trigger_uriを持つオブジェクトかどうかをチェック
 *
 * @param obj チェック対象のオブジェクト
 * @returns trigger_uriプロパティを持つオブジェクトであればtrue
 */
function hasTriggerUri(obj: unknown): obj is { trigger_uri: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'trigger_uri' in obj &&
    typeof (obj as Record<string, unknown>).trigger_uri === 'string'
  );
}

/**
 * SQLiteデータベースラッパークラス
 *
 * better-sqlite3を使用してLikeデータを管理します。
 * プリペアドステートメントを事前に準備することでパフォーマンスを最適化しています。
 */
export class LikeDatabase {
  private db: Database.Database;

  // プリペアドステートメント（パフォーマンス最適化）
  private stmtGetAll!: Database.Statement;
  private stmtInsert!: Database.Statement;
  private stmtDelete!: Database.Statement;
  private stmtGetTriggerUri!: Database.Statement;

  /**
   * データベースを初期化します
   * @param dbPath SQLiteデータベースファイルのパス
   */
  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.initializeTable();
    this.prepareStatements();
  }

  /**
   * テーブルとインデックスを初期化します
   */
  private initializeTable(): void {
    // likesテーブルの作成
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS likes (
        did TEXT NOT NULL,
        rkey TEXT NOT NULL,
        trigger_uri TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (did, rkey)
      )
    `);

    // インデックスの作成（trigger_uriでの検索パフォーマンス向上）
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_trigger_uri ON likes(trigger_uri)
    `);
  }

  /**
   * プリペアドステートメントを準備します
   */
  private prepareStatements(): void {
    this.stmtGetAll = this.db.prepare('SELECT * FROM likes');
    this.stmtInsert = this.db.prepare(
      'INSERT OR IGNORE INTO likes (did, rkey, trigger_uri, created_at) VALUES (?, ?, ?, ?)'
    );
    this.stmtDelete = this.db.prepare('DELETE FROM likes WHERE did = ? AND rkey = ?');
    this.stmtGetTriggerUri = this.db.prepare(
      'SELECT trigger_uri FROM likes WHERE did = ? AND rkey = ?'
    );
  }

  /**
   * 全てのLikeレコードを取得します
   * @returns 全Likeレコードの配列
   */
  getAllLikes(): LikeRecord[] {
    const results = this.stmtGetAll.all();

    // 型ガードを使用して安全に型変換
    if (!Array.isArray(results)) {
      return [];
    }

    return results.filter(isLikeRecord);
  }

  /**
   * Likeレコードを追加します
   *
   * INSERT OR IGNOREを使用しているため、既に存在するレコードは無視されます（冪等性）。
   *
   * @param did ユーザーのDID
   * @param rkey Likeのrkey
   * @param triggerUri トリガーとなった投稿のURI
   */
  addLike(did: string, rkey: string, triggerUri: string): void {
    const createdAt = Date.now();
    this.stmtInsert.run(did, rkey, triggerUri, createdAt);
  }

  /**
   * Likeレコードを削除します
   *
   * @param did ユーザーのDID
   * @param rkey Likeのrkey
   */
  removeLike(did: string, rkey: string): void {
    this.stmtDelete.run(did, rkey);
  }

  /**
   * 指定されたLikeのトリガーURIを取得します
   *
   * @param did ユーザーのDID
   * @param rkey Likeのrkey
   * @returns トリガーURI、存在しない場合はundefined
   */
  getTriggerUri(did: string, rkey: string): string | undefined {
    const result = this.stmtGetTriggerUri.get(did, rkey);

    // 型ガードを使用して安全に型変換
    if (hasTriggerUri(result)) {
      return result.trigger_uri;
    }

    return undefined;
  }

  /**
   * データベース接続を閉じます
   *
   * Note: better-sqlite3ではdb.close()を呼ぶと自動的にすべてのプリペアドステートメントが
   * クリーンアップされるため、明示的なfinalizeは不要です。
   */
  close(): void {
    this.db.close();
  }
}
