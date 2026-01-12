import { LabelValueDefinitionStrings } from '@atproto/api/dist/client/types/com/atproto/label/defs.js';

/**
 * ラベル定義
 */
export interface Label {
  identifier: string;
  locales: LabelValueDefinitionStrings[];
}

/**
 * データベース内のLikeレコード
 */
export interface LikeRecord {
  did: string;
  rkey: string;
  trigger_uri: string;
  created_at: number;
}

/**
 * Jetstream Likeレコード（作成時）
 */
export interface JetstreamLikeRecord {
  subject?: {
    uri: string;
  };
  createdAt: string;
}

/**
 * Jetstream Likeイベント（作成時）
 */
export interface LikeCreateEvent {
  did: string;
  commit: {
    rkey: string;
    record: JetstreamLikeRecord;
  };
}

/**
 * Jetstream Likeイベント（削除時）
 */
export interface LikeDeleteEvent {
  did: string;
  commit: {
    rkey: string;
  };
}

/**
 * 初期化結果
 */
export interface InitializationResult {
  success: boolean;
  count: number;
  error?: Error;
}
