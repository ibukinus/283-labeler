import 'dotenv/config';
import { DATABASE_CONFIG } from './constants.js';

/**
 * 環境変数の型定義
 */
export interface Config {
  labelerDid: string;
  labelerSigningKey: string;
  labelerIdentifier: string;
  labelerPassword: string;
  labelerPort: number;
  labelerDbPath: string;
  dbFile: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * 必須環境変数が設定されていない場合にエラーをスローする
 */
function throwMissingEnv(name: string): never {
  throw new Error(`環境変数 ${name} が設定されていません`);
}

/**
 * 環境変数の読み込みと検証
 */
export const config: Config = {
  labelerDid: process.env.LABELER_DID || throwMissingEnv('LABELER_DID'),
  labelerSigningKey: process.env.LABELER_SIGNING_KEY || throwMissingEnv('LABELER_SIGNING_KEY'),
  labelerIdentifier: process.env.LABELER_IDENTIFIER || throwMissingEnv('LABELER_IDENTIFIER'),
  labelerPassword: process.env.LABELER_PASSWORD || throwMissingEnv('LABELER_PASSWORD'),
  labelerPort: parseInt(process.env.LABELER_PORT || String(DATABASE_CONFIG.LABELER_PORT_DEFAULT), 10),
  labelerDbPath: process.env.LABELER_DB_PATH || DATABASE_CONFIG.LABELER_DB_PATH_DEFAULT,
  dbFile: process.env.DB_FILE || DATABASE_CONFIG.LIKE_DB_PATH_DEFAULT,
  logLevel: (process.env.LOG_LEVEL as Config['logLevel']) || 'info',
};

/**
 * TRIGGER_MAP: 投稿URI → ラベル値のマッピング
 *
 * 特定の投稿にLikeした場合に付与されるラベルを定義します。
 * 将来的には外部設定ファイルやデータベースから読み込む想定です。
 *
 * キー: 投稿のAT URI (at://did/collection/rkey 形式)
 * 値: ラベル値 (英数字とハイフン)
 */
export const TRIGGER_MAP: Record<string, string> = {
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jjyshje27': 'idol-mano',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jkqj2vu27': 'idol-hiori',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jky53iu27': 'idol-meguru',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jlcic5427': 'idol-kogane',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jloptgm27': 'idol-mamimi',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jlv65xu27': 'idol-sakuya',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jm3pi7m27': 'idol-yuika',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jmf2vbe27': 'idol-kiriko',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jmkkeiu27': 'idol-kaho',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jms3p5u27': 'idol-chiyoko',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jmzoqiu27': 'idol-juri',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jn6wcsm27': 'idol-rinze',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jnfbgsm27': 'idol-natsuha',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jnwszj427': 'idol-amana',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jo3wjwm27': 'idol-tenka',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jobpulu27': 'idol-chiyuki',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jogvzy427': 'idol-asahi',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jolwtie27': 'idol-fuyuko',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7joqnvhu27': 'idol-mei',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jovk3je27': 'idol-toru',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jp2tpau27': 'idol-madoka',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jpa536e27': 'idol-koito',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jpg357e27': 'idol-hinana',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jplpnl427': 'idol-nichika',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jpsaaeu27': 'idol-mikoto',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jq4mbeu27': 'idol-luca',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jqbkcym27': 'idol-hana',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jqgzkg427': 'idol-haruki',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jqmr4gu27': 'staff-tsutomu',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jqsktse27': 'staff-hazuki',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jqzvhme27': 'unit-illuminationstars',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jr7prjm27': 'unit-lantica',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jrfs4bm27': 'unit-hokagoclimaxgirls',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jrlcism27': 'unit-alstroemeria',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jrqoipm27': 'unit-straylight',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jrvtpt427': 'unit-noctchill',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7js4jnjm27': 'unit-shhis',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jscw5hu27': 'unit-cometik',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jspwwf427': 'unit-imacutiefinder',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jszahum27': 'unit-fumage',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mc7jtg54x427': 'unit-sonicheart',
  'at://did:plc:ck57xb7qty7kolim6avksmpr/app.bsky.feed.post/3mdkuqv5ams2n': 'unit-sigmadesire',
};
