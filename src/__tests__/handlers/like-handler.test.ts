import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { LikeHandler } from '../../handlers/like-handler.js';
import { LikeDatabase } from '../../db.js';
import { createLogger } from '../../logger.js';
import type { JetstreamLikeRecord } from '../../types.js';
import fs from 'fs';
import path from 'path';

/**
 * LikeHandlerクラスのユニットテスト
 */
describe('LikeHandler', () => {
  let db: LikeDatabase;
  let cache: Set<string>;
  let mockLabelerServer: any;
  let likeHandler: LikeHandler;
  let createLabelSpy: jest.Mock;
  const logger = createLogger('error'); // テスト時はエラーのみ
  const testDbPath = path.join(process.cwd(), 'test-like-handler.db');

  const triggerMap: Record<string, string> = {
    'at://did:plc:example1/app.bsky.feed.post/abc123': 'early-supporter',
    'at://did:plc:example2/app.bsky.feed.post/def456': 'community-member',
  };

  beforeEach(() => {
    // テスト用データベースファイルを削除
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    db = new LikeDatabase(testDbPath);
    cache = new Set<string>();

    // モックLabelerServerを作成
    createLabelSpy = jest.fn(() => Promise.resolve());
    mockLabelerServer = {
      createLabel: createLabelSpy,
    };

    likeHandler = new LikeHandler(db, cache, mockLabelerServer, logger, triggerMap);
  });

  afterEach(() => {
    db.close();

    // テスト用データベースファイルを削除
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('handleCreate', () => {
    it('トリガーに一致するLikeが正しく処理されること', async () => {
      const record: JetstreamLikeRecord = {
        subject: {
          uri: 'at://did:plc:example1/app.bsky.feed.post/abc123',
        },
        createdAt: new Date().toISOString(),
      };

      await likeHandler.handleCreate('did:plc:user1', 'rkey1', record);

      // DB保存を確認
      const triggerUri = db.getTriggerUri('did:plc:user1', 'rkey1');
      expect(triggerUri).toBe('at://did:plc:example1/app.bsky.feed.post/abc123');

      // キャッシュ追加を確認
      expect(cache.has('did:plc:user1:rkey1')).toBe(true);

      // ラベル付与を確認
      expect(createLabelSpy).toHaveBeenCalledWith({
        uri: 'did:plc:user1',
        val: 'early-supporter',
        neg: false,
      });
    });

    it('subjectがない場合は処理をスキップすること', async () => {
      const record: JetstreamLikeRecord = {
        createdAt: new Date().toISOString(),
      };

      await likeHandler.handleCreate('did:plc:user1', 'rkey1', record);

      // DB保存されていないことを確認
      const triggerUri = db.getTriggerUri('did:plc:user1', 'rkey1');
      expect(triggerUri).toBeUndefined();

      // キャッシュに追加されていないことを確認
      expect(cache.has('did:plc:user1:rkey1')).toBe(false);

      // ラベル付与されていないことを確認
      expect(createLabelSpy).not.toHaveBeenCalled();
    });

    it('トリガーマップにないURIの場合は処理をスキップすること', async () => {
      const record: JetstreamLikeRecord = {
        subject: {
          uri: 'at://did:plc:unknown/app.bsky.feed.post/xyz999',
        },
        createdAt: new Date().toISOString(),
      };

      await likeHandler.handleCreate('did:plc:user1', 'rkey1', record);

      // DB保存されていないことを確認
      const triggerUri = db.getTriggerUri('did:plc:user1', 'rkey1');
      expect(triggerUri).toBeUndefined();

      // ラベル付与されていないことを確認
      expect(createLabelSpy).not.toHaveBeenCalled();
    });

    it('ラベル付与が失敗しても処理が継続されること', async () => {
      // createLabelを失敗させる
      createLabelSpy.mockImplementationOnce(() => Promise.reject(new Error('Label creation failed')));

      const record: JetstreamLikeRecord = {
        subject: {
          uri: 'at://did:plc:example1/app.bsky.feed.post/abc123',
        },
        createdAt: new Date().toISOString(),
      };

      // エラーが投げられないことを確認
      await expect(
        likeHandler.handleCreate('did:plc:user1', 'rkey1', record)
      ).resolves.toBeUndefined();

      // DB保存とキャッシュは正常に処理されていることを確認
      expect(db.getTriggerUri('did:plc:user1', 'rkey1')).toBe(
        'at://did:plc:example1/app.bsky.feed.post/abc123'
      );
      expect(cache.has('did:plc:user1:rkey1')).toBe(true);
    });
  });

  describe('handleDelete', () => {
    beforeEach(() => {
      // テストデータを準備
      db.addLike('did:plc:user1', 'rkey1', 'at://did:plc:example1/app.bsky.feed.post/abc123');
      cache.add('did:plc:user1:rkey1');
    });

    it('キャッシュに存在するLike削除が正しく処理されること', async () => {
      await likeHandler.handleDelete('did:plc:user1', 'rkey1');

      // ラベル除去を確認
      expect(createLabelSpy).toHaveBeenCalledWith({
        uri: 'did:plc:user1',
        val: 'early-supporter',
        neg: true,
      });

      // DB削除を確認
      expect(db.getTriggerUri('did:plc:user1', 'rkey1')).toBeUndefined();

      // キャッシュ削除を確認
      expect(cache.has('did:plc:user1:rkey1')).toBe(false);
    });

    it('キャッシュに存在しない場合は処理をスキップすること', async () => {
      await likeHandler.handleDelete('did:plc:user999', 'rkey999');

      // ラベル除去されていないことを確認
      expect(createLabelSpy).not.toHaveBeenCalled();
    });

    it('DBに存在しない場合はキャッシュのみクリーンアップすること', async () => {
      // DBからデータを削除してデータ不整合を作る
      db.removeLike('did:plc:user1', 'rkey1');
      // キャッシュには残っている状態

      await likeHandler.handleDelete('did:plc:user1', 'rkey1');

      // キャッシュが削除されていることを確認
      expect(cache.has('did:plc:user1:rkey1')).toBe(false);

      // ラベル除去は呼ばれていないことを確認
      expect(createLabelSpy).not.toHaveBeenCalled();
    });

    it('トリガーマップにない場合はDBとキャッシュをクリーンアップすること', async () => {
      // トリガーマップにないURIをDBに追加
      db.addLike('did:plc:user2', 'rkey2', 'at://unknown/post/xyz');
      cache.add('did:plc:user2:rkey2');

      await likeHandler.handleDelete('did:plc:user2', 'rkey2');

      // DB削除を確認
      expect(db.getTriggerUri('did:plc:user2', 'rkey2')).toBeUndefined();

      // キャッシュ削除を確認
      expect(cache.has('did:plc:user2:rkey2')).toBe(false);

      // ラベル除去は呼ばれていないことを確認
      expect(createLabelSpy).not.toHaveBeenCalled();
    });

    it('ラベル除去が失敗しても処理が継続されること', async () => {
      // createLabelを失敗させる
      createLabelSpy.mockImplementationOnce(() => Promise.reject(new Error('Label removal failed')));

      await expect(
        likeHandler.handleDelete('did:plc:user1', 'rkey1')
      ).resolves.toBeUndefined();

      // DBとキャッシュのクリーンアップは正常に処理されていることを確認
      expect(db.getTriggerUri('did:plc:user1', 'rkey1')).toBeUndefined();
      expect(cache.has('did:plc:user1:rkey1')).toBe(false);
    });
  });

  describe('LabelerServerがnullの場合', () => {
    beforeEach(() => {
      // LabelerServerなしでハンドラを作成
      likeHandler = new LikeHandler(db, cache, null, logger, triggerMap);
    });

    it('Like作成時、ラベル付与がスキップされること', async () => {
      const record: JetstreamLikeRecord = {
        subject: {
          uri: 'at://did:plc:example1/app.bsky.feed.post/abc123',
        },
        createdAt: new Date().toISOString(),
      };

      await expect(
        likeHandler.handleCreate('did:plc:user1', 'rkey1', record)
      ).resolves.toBeUndefined();

      // DB保存とキャッシュは処理されている
      expect(db.getTriggerUri('did:plc:user1', 'rkey1')).toBe(
        'at://did:plc:example1/app.bsky.feed.post/abc123'
      );
      expect(cache.has('did:plc:user1:rkey1')).toBe(true);
    });

    it('Like削除時、ラベル除去がスキップされること', async () => {
      // テストデータを準備
      db.addLike('did:plc:user1', 'rkey1', 'at://did:plc:example1/app.bsky.feed.post/abc123');
      cache.add('did:plc:user1:rkey1');

      await expect(
        likeHandler.handleDelete('did:plc:user1', 'rkey1')
      ).resolves.toBeUndefined();

      // DBとキャッシュのクリーンアップは処理されている
      expect(db.getTriggerUri('did:plc:user1', 'rkey1')).toBeUndefined();
      expect(cache.has('did:plc:user1:rkey1')).toBe(false);
    });
  });

  describe('統合シナリオ', () => {
    it('作成→削除の一連の流れが正しく動作すること', async () => {
      // Like作成
      const createRecord: JetstreamLikeRecord = {
        subject: {
          uri: 'at://did:plc:example2/app.bsky.feed.post/def456',
        },
        createdAt: new Date().toISOString(),
      };

      await likeHandler.handleCreate('did:plc:alice', 'like789', createRecord);

      // 作成後の状態確認
      expect(db.getTriggerUri('did:plc:alice', 'like789')).toBe(
        'at://did:plc:example2/app.bsky.feed.post/def456'
      );
      expect(cache.has('did:plc:alice:like789')).toBe(true);
      expect(createLabelSpy).toHaveBeenCalledWith({
        uri: 'did:plc:alice',
        val: 'community-member',
        neg: false,
      });

      // Like削除
      createLabelSpy.mockClear();
      await likeHandler.handleDelete('did:plc:alice', 'like789');

      // 削除後の状態確認
      expect(db.getTriggerUri('did:plc:alice', 'like789')).toBeUndefined();
      expect(cache.has('did:plc:alice:like789')).toBe(false);
      expect(createLabelSpy).toHaveBeenCalledWith({
        uri: 'did:plc:alice',
        val: 'community-member',
        neg: true,
      });
    });
  });
});
