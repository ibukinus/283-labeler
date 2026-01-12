import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { LikeDatabase } from '../db.js';
import fs from 'fs';
import path from 'path';

/**
 * LikeDatabaseクラスのユニットテスト
 */
describe('LikeDatabase', () => {
  let db: LikeDatabase;
  const testDbPath = path.join(process.cwd(), 'test-database.db');

  // 各テストの前に新しいデータベースインスタンスを作成
  beforeEach(() => {
    // 既存のテストDBファイルを削除
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    db = new LikeDatabase(testDbPath);
  });

  // 各テストの後にデータベースをクローズしてファイルを削除
  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('constructor', () => {
    it('データベースファイルが作成されること', () => {
      expect(fs.existsSync(testDbPath)).toBe(true);
    });

    it('likesテーブルが作成されること', () => {
      const allLikes = db.getAllLikes();
      expect(Array.isArray(allLikes)).toBe(true);
      expect(allLikes.length).toBe(0);
    });
  });

  describe('addLike', () => {
    it('Likeレコードが正しく追加されること', () => {
      const did = 'did:plc:test123';
      const rkey = 'abc123';
      const triggerUri = 'at://did:plc:example/app.bsky.feed.post/xyz';

      db.addLike(did, rkey, triggerUri);

      const allLikes = db.getAllLikes();
      expect(allLikes.length).toBe(1);
      expect(allLikes[0].did).toBe(did);
      expect(allLikes[0].rkey).toBe(rkey);
      expect(allLikes[0].trigger_uri).toBe(triggerUri);
      expect(typeof allLikes[0].created_at).toBe('number');
    });

    it('同じdidとrkeyのレコードは重複して追加されないこと（冪等性）', () => {
      const did = 'did:plc:test123';
      const rkey = 'abc123';
      const triggerUri = 'at://did:plc:example/app.bsky.feed.post/xyz';

      db.addLike(did, rkey, triggerUri);
      db.addLike(did, rkey, triggerUri); // 2回追加

      const allLikes = db.getAllLikes();
      expect(allLikes.length).toBe(1); // 1つのみ保存される
    });

    it('異なるdidとrkeyの組み合わせは別のレコードとして追加されること', () => {
      db.addLike('did:plc:user1', 'rkey1', 'at://example1');
      db.addLike('did:plc:user1', 'rkey2', 'at://example2');
      db.addLike('did:plc:user2', 'rkey1', 'at://example3');

      const allLikes = db.getAllLikes();
      expect(allLikes.length).toBe(3);
    });
  });

  describe('removeLike', () => {
    it('Likeレコードが正しく削除されること', () => {
      const did = 'did:plc:test123';
      const rkey = 'abc123';
      const triggerUri = 'at://did:plc:example/app.bsky.feed.post/xyz';

      db.addLike(did, rkey, triggerUri);
      expect(db.getAllLikes().length).toBe(1);

      db.removeLike(did, rkey);
      expect(db.getAllLikes().length).toBe(0);
    });

    it('存在しないレコードを削除してもエラーにならないこと', () => {
      expect(() => {
        db.removeLike('did:plc:nonexistent', 'nonexistent');
      }).not.toThrow();

      expect(db.getAllLikes().length).toBe(0);
    });

    it('特定のレコードのみが削除されること', () => {
      db.addLike('did:plc:user1', 'rkey1', 'at://example1');
      db.addLike('did:plc:user2', 'rkey2', 'at://example2');
      db.addLike('did:plc:user3', 'rkey3', 'at://example3');

      db.removeLike('did:plc:user2', 'rkey2');

      const allLikes = db.getAllLikes();
      expect(allLikes.length).toBe(2);
      expect(allLikes.find((like) => like.did === 'did:plc:user1')).toBeDefined();
      expect(allLikes.find((like) => like.did === 'did:plc:user3')).toBeDefined();
      expect(allLikes.find((like) => like.did === 'did:plc:user2')).toBeUndefined();
    });
  });

  describe('getTriggerUri', () => {
    it('存在するレコードのtrigger_uriが取得できること', () => {
      const did = 'did:plc:test123';
      const rkey = 'abc123';
      const triggerUri = 'at://did:plc:example/app.bsky.feed.post/xyz';

      db.addLike(did, rkey, triggerUri);

      const result = db.getTriggerUri(did, rkey);
      expect(result).toBe(triggerUri);
    });

    it('存在しないレコードの場合はundefinedが返されること', () => {
      const result = db.getTriggerUri('did:plc:nonexistent', 'nonexistent');
      expect(result).toBeUndefined();
    });

    it('異なるdidとrkeyで異なるtrigger_uriが取得できること', () => {
      db.addLike('did:plc:user1', 'rkey1', 'at://example1');
      db.addLike('did:plc:user2', 'rkey2', 'at://example2');

      expect(db.getTriggerUri('did:plc:user1', 'rkey1')).toBe('at://example1');
      expect(db.getTriggerUri('did:plc:user2', 'rkey2')).toBe('at://example2');
    });
  });

  describe('getAllLikes', () => {
    it('空のデータベースの場合は空配列が返されること', () => {
      const allLikes = db.getAllLikes();
      expect(Array.isArray(allLikes)).toBe(true);
      expect(allLikes.length).toBe(0);
    });

    it('複数のレコードが正しく取得できること', () => {
      db.addLike('did:plc:user1', 'rkey1', 'at://example1');
      db.addLike('did:plc:user2', 'rkey2', 'at://example2');
      db.addLike('did:plc:user3', 'rkey3', 'at://example3');

      const allLikes = db.getAllLikes();
      expect(allLikes.length).toBe(3);

      // 全てのレコードが正しい構造を持っていることを確認
      allLikes.forEach((like) => {
        expect(like).toHaveProperty('did');
        expect(like).toHaveProperty('rkey');
        expect(like).toHaveProperty('trigger_uri');
        expect(like).toHaveProperty('created_at');
        expect(typeof like.created_at).toBe('number');
      });
    });
  });

  describe('close', () => {
    it('データベース接続が正しくクローズされること', () => {
      expect(() => {
        db.close();
      }).not.toThrow();
    });

    it('クローズ後に操作を実行するとエラーになること', () => {
      db.close();

      expect(() => {
        db.getAllLikes();
      }).toThrow();
    });
  });

  describe('パフォーマンステスト', () => {
    it('大量のレコード挿入と取得が正常に動作すること', () => {
      const count = 1000;

      // 1000件のレコードを挿入
      for (let i = 0; i < count; i++) {
        db.addLike(`did:plc:user${i}`, `rkey${i}`, `at://example${i}`);
      }

      const allLikes = db.getAllLikes();
      expect(allLikes.length).toBe(count);

      // ランダムなレコードを取得してテスト
      const randomIndex = Math.floor(Math.random() * count);
      const triggerUri = db.getTriggerUri(`did:plc:user${randomIndex}`, `rkey${randomIndex}`);
      expect(triggerUri).toBe(`at://example${randomIndex}`);
    });
  });

  describe('エッジケース', () => {
    it('空文字列のdidとrkeyでも動作すること', () => {
      db.addLike('', '', 'at://example');
      const result = db.getTriggerUri('', '');
      expect(result).toBe('at://example');
    });

    it('特殊文字を含むデータが正しく処理されること', () => {
      const did = "did:plc:test'123\"";
      const rkey = 'rkey"with\'quotes';
      const triggerUri = 'at://example/with"quotes';

      db.addLike(did, rkey, triggerUri);
      const result = db.getTriggerUri(did, rkey);
      expect(result).toBe(triggerUri);
    });

    it('非常に長い文字列が正しく処理されること', () => {
      const longString = 'a'.repeat(10000);
      db.addLike(longString, longString, longString);
      const result = db.getTriggerUri(longString, longString);
      expect(result).toBe(longString);
    });
  });
});
