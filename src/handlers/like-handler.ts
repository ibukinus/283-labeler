import { LabelerServer } from '@skyware/labeler';
import { LikeDatabase } from '../db.js';
import { Logger } from '../logger.js';
import { generateCacheKey } from '../constants.js';
import type { JetstreamLikeRecord } from '../types.js';

/**
 * LikeHandlerクラス
 *
 * Like作成・削除イベントを処理するハンドラクラス。
 * ビジネスロジックをindex.tsから分離し、テスタビリティを向上させます。
 */
export class LikeHandler {
  constructor(
    private db: LikeDatabase,
    private cache: Set<string>,
    private labelerServer: LabelerServer | null,
    private logger: Logger,
    private triggerMap: Record<string, string>
  ) {}

  /**
   * Like作成イベントを処理
   *
   * @param did ユーザーのDID
   * @param rkey Likeのrkey
   * @param record Likeレコード
   */
  async handleCreate(did: string, rkey: string, record: JetstreamLikeRecord): Promise<void> {
    try {
      const subjectUri = record.subject?.uri;
      if (!subjectUri) {
        this.logger.debug('Like作成: subjectなし', { did, rkey });
        return;
      }

      const label = this.triggerMap[subjectUri];
      if (!label) {
        this.logger.debug('Like作成: トリガー対象外', { did, rkey, subjectUri });
        return;
      }

      this.logger.info('Like作成: トリガー一致', { did, rkey, subjectUri, label });

      // DB保存
      this.db.addLike(did, rkey, subjectUri);

      // キャッシュ追加
      const cacheKey = generateCacheKey(did, rkey);
      this.cache.add(cacheKey);

      // ラベル付与
      await this.emitLabel(did, label, false);

      this.logger.info('Like処理完了', { did, label });
    } catch (error) {
      this.logger.error('Like作成処理エラー:', { did, rkey, error });
      // エラーが起きても処理継続（個別イベントの失敗で全体を止めない）
    }
  }

  /**
   * Like削除イベントを処理
   *
   * @param did ユーザーのDID
   * @param rkey Likeのrkey
   */
  async handleDelete(did: string, rkey: string): Promise<void> {
    try {
      const cacheKey = generateCacheKey(did, rkey);

      if (!this.cache.has(cacheKey)) {
        this.logger.debug('Like削除: キャッシュに存在しない', { did, rkey });
        return;
      }

      this.logger.info('Like削除: キャッシュに存在', { did, rkey });

      const triggerUri = await this.resolveTriggerUri(did, rkey, cacheKey);
      if (!triggerUri) return;

      const label = this.triggerMap[triggerUri];
      if (!label) {
        this.logger.warn('Like削除: ラベル未定義', { did, rkey, triggerUri });
        await this.cleanupLikeData(did, rkey, cacheKey);
        return;
      }

      await this.emitLabel(did, label, true);
      await this.cleanupLikeData(did, rkey, cacheKey);

      this.logger.info('Like削除処理完了', { did, label });
    } catch (error) {
      this.logger.error('Like削除処理エラー:', { did, rkey, error });
    }
  }

  /**
   * トリガーURIを解決
   *
   * @param did ユーザーのDID
   * @param rkey Likeのrkey
   * @param cacheKey キャッシュキー
   * @returns トリガーURI、存在しない場合はundefined
   */
  private async resolveTriggerUri(
    did: string,
    rkey: string,
    cacheKey: string
  ): Promise<string | undefined> {
    const triggerUri = this.db.getTriggerUri(did, rkey);
    if (!triggerUri) {
      this.logger.warn('Like削除: DBに存在しない（データ不整合）', { did, rkey });
      this.cache.delete(cacheKey);
    }
    return triggerUri;
  }

  /**
   * Likeデータをクリーンアップ
   *
   * @param did ユーザーのDID
   * @param rkey Likeのrkey
   * @param cacheKey キャッシュキー
   */
  private async cleanupLikeData(
    did: string,
    rkey: string,
    cacheKey: string
  ): Promise<void> {
    this.db.removeLike(did, rkey);
    this.cache.delete(cacheKey);
  }

  /**
   * ラベルを発行
   *
   * @param did ラベル対象のユーザーDID
   * @param label ラベル値
   * @param neg false=付与, true=除去
   */
  private async emitLabel(did: string, label: string, neg: boolean): Promise<void> {
    const action = neg ? 'ラベル除去' : 'ラベル付与';

    if (!this.labelerServer) {
      this.logger.error(`${action}失敗: LabelerServerが初期化されていません`, { did, label });
      return;
    }

    try {
      await this.labelerServer.createLabel({
        uri: did,
        val: label,
        neg: neg,
      });

      this.logger.info(`${action}成功: did=${did}, label=${label}`);
    } catch (error) {
      this.logger.error(`${action}失敗:`, {
        did,
        label,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
