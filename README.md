# Blueskyラベラーシステム

Jetstream経由でBluesky FirehoseからLikeイベントをリアルタイム受信し、特定投稿へのLikeを監視してユーザーにラベルを付与/除去するシステムです。

## 機能

- **リアルタイムLike監視**: Jetstream経由でBluesky FirehoseからLikeイベントを受信
- **条件付きラベル付与**: 特定の投稿にLikeしたユーザーに自動的にラベルを付与
- **自動ラベル除去**: Likeを取り消したユーザーからラベルを自動除去
- **高パフォーマンス**: メモリキャッシュによる高速な存在確認
- **永続化**: SQLiteによるLike履歴の永続的な保存
- **グレースフルシャットダウン**: SIGINT/SIGTERM対応、2重実行防止、リソースの適切なクローズ
- **詳細なログ出力**: 環境変数によるログレベル制御（debug/info/warn/error）

## アーキテクチャ

### データフロー

```
Bluesky Firehose (Jetstream)
  ↓
Like作成 → TRIGGER_MAP確認 → 一致 → DB保存 & キャッシュ追加 & ラベル付与
Like削除 → キャッシュ確認 → 存在 → DB検索 → ラベル除去 & DB削除 & キャッシュ削除
```

### パフォーマンス最適化

- **メモリキャッシュ**: `Set<string>` に `${did}:${rkey}` 形式で保存し、Like削除時のDB検索を回避
- **プリペアドステートメント**: better-sqlite3のプリペアドステートメントで高速化
- **イベントフィルタリング**: JetstreamのwantedCollectionsで不要なイベントを除外

## 技術スタック

- **Runtime**: Node.js v20+
- **Language**: TypeScript
- **Libraries**:
  - `@skyware/jetstream`: Firehose受信
  - `@skyware/labeler`: ラベラーサーバー
  - `better-sqlite3`: Likeデータベース
  - `dotenv`: 環境変数管理

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. ラベラーアカウントのセットアップ

Blueskyでラベラー用のアカウントを作成し、セットアップコマンドを実行します:

```bash
npx @skyware/labeler setup
```

以下の情報を入力します:
- **Blueskyユーザー名**: ラベラーアカウントのハンドル（例: `labeler.bsky.social`）
- **パスワード**: アカウントのパスワード
- **サーバーURL**:
  - ローカル開発: `http://localhost:14831`
  - 本番環境: `https://your-domain.com` (HTTPS必須)
- **メール認証コード**: Blueskyから送信される認証コード
- **署名鍵**: 自動生成されます → **必ず保存してください**

### 3. ラベル定義の追加

TRIGGER_MAPに定義する各ラベル値について、以下のコマンドで設定します:

```bash
npx @skyware/labeler label add
```

各ラベルについて以下を入力:
- **Identifier**: `idol-juri` (TRIGGER_MAPの値と一致させる)
- **Display Name**: `Idol JURI`
- **Description**: `JURI fan badge`
- **Adult content**: `no`
- **Severity**: `none`
- **Blur**: `no-override`
- **Default setting**: `ignore`

TRIGGER_MAPに定義されている全てのラベル（early-supporter, community-member, beta-tester, idol-juri）について実行してください。

### 4. 環境変数の設定

```bash
cp .env.example .env
```

`.env` ファイルを編集して、以下の環境変数を設定してください:

```env
# 必須
LABELER_DID=did:plc:your-labeler-did
LABELER_SIGNING_KEY=セットアップで生成された署名鍵

# LabelerServer設定
LABELER_PORT=14831
LABELER_DB_PATH=labels.db

# Likeデータベース
DB_FILE=database.db

# ログレベル
LOG_LEVEL=info  # 開発時は debug 推奨
```

**重要**:
- `LABELER_DID`はBlueskyアカウント設定画面で確認できます
- `LABELER_SIGNING_KEY`はステップ2で表示された署名鍵です

### 5. トリガー設定のカスタマイズ

`src/config.ts` の `TRIGGER_MAP` を編集して、監視する投稿とラベルを設定します:

```typescript
export const TRIGGER_MAP: Record<string, string> = {
  'at://did:plc:example1/app.bsky.feed.post/abc123': 'early-supporter',
  'at://did:plc:example2/app.bsky.feed.post/def456': 'community-member',
  'at://did:plc:kxtqmb63gqe3kkq7w7uj6ix7/app.bsky.feed.post/3mbjoyxicgk2r': 'idol-juri',
  // 他の投稿とラベルを追加...
};
```

### 6. ビルド

```bash
npm run build
```

## 実行方法

### Dockerを使用する場合（推奨）

本番環境では、Dockerを使用することを強く推奨します。詳細は[Dockerデプロイガイド](doc/DOCKER.md)を参照してください。

```bash
# 環境変数を設定
cp .env.example .env
nano .env

# Dockerイメージをビルド
docker-compose build

# コンテナを起動
docker-compose up -d

# ログを確認
docker-compose logs -f
```

**メリット**:
- 依存関係の分離
- 簡単なデプロイ
- 自動再起動
- データの永続化

### 開発モード

TypeScriptファイルを直接実行します（tsx使用）:

```bash
npm run dev
```

### 本番モード（ネイティブ実行）

ビルド済みJavaScriptファイルを実行します:

```bash
npm start
```

### 停止方法

システムはグレースフルシャットダウンに対応しています。以下のいずれかの方法で安全に停止できます:

#### Ctrl+C（SIGINT）で停止

```bash
# 実行中のターミナルで Ctrl+C を押す
^C[INFO] シャットダウンシグナル受信 (SIGINT)
[INFO] シャットダウン処理開始...
[INFO] LabelerServerクローズ完了
[INFO] データベースクローズ完了
[INFO] シャットダウン完了
```

#### SIGTERMで停止（systemdなど）

```bash
# プロセスIDを確認
ps aux | grep node

# SIGTERMシグナルを送信
kill -TERM <プロセスID>
```

**重要**:
- シャットダウン処理の2重実行は自動的に防止されます
- LabelerServerとデータベース接続が適切にクローズされます
- 強制終了（kill -9）は避けてください（データベースが破損する可能性があります）

## 動作確認

### 1. LabelerServer起動確認

起動時に以下のログが表示されることを確認:

```
[INFO] ラベラーシステム起動中...
[INFO] LabelerServer起動成功: http://0.0.0.0:14831
[INFO] キャッシュ初期化完了: X件のLikeをロード
[INFO] Jetstream接続成功
[INFO] Jetstreamリスニング開始
```

### 2. HTTPエンドポイント確認

別のターミナルで以下のコマンドを実行:

```bash
curl http://localhost:14831/xrpc/com.atproto.label.queryLabels
```

期待される応答:
```json
{
  "cursor": "...",
  "labels": []
}
```

### 3. ラベル発行テスト

1. TRIGGER_MAPに定義された投稿にLike
2. ログで確認:
```
[INFO] Like作成: トリガー一致 { did: '...', label: 'idol-juri' }
[INFO] ラベル付与成功: did=..., label=idol-juri
```

3. DBに保存されたことを確認:
```bash
sqlite3 labels.db "SELECT * FROM labels;"
```

### 4. ラベル除去テスト

1. Likeをキャンセル
2. ログで確認:
```
[INFO] Like削除: キャッシュに存在
[INFO] ラベル除去成功: did=..., label=idol-juri
```

### 5. Blueskyアプリで確認

1. 別アカウントでラベラーをサブスクライブ（Settings → Moderation → Labelers）
2. テスト用投稿にLike
3. プロフィールにラベルバッジが表示されることを確認

## ログレベル

環境変数 `LOG_LEVEL` で出力するログレベルを制御できます:

- `debug`: 全イベント詳細（トリガー対象外も含む）
- `info`: トリガー一致イベント、システム状態変化（デフォルト）
- `warn`: データ不整合、想定外の状態
- `error`: 処理失敗、Jetstreamエラー

## データベース

このシステムは2つのSQLiteデータベースを使用します:

### 1. Likeデータベース (`database.db`)

**likes テーブル**:

| カラム名 | 型 | 説明 |
|---------|------|------|
| did | TEXT | ユーザーのDID（主キー） |
| rkey | TEXT | Likeのrkey（主キー） |
| trigger_uri | TEXT | トリガーとなった投稿のURI |
| created_at | INTEGER | Likeの作成タイムスタンプ |

**用途**: トリガー投稿へのLike履歴を記録し、Like削除時にどのラベルを除去すべきかを特定します。

### 2. ラベルデータベース (`labels.db`)

**labels テーブル** (LabelerServerが自動管理):

LabelerServerが発行したラベルの履歴を保存します。このデータベースは`@skyware/labeler`が自動的に管理するため、手動での操作は不要です。

### バックアップ

両方のSQLiteファイルを定期的にバックアップすることを推奨します:

```bash
cp database.db database.db.backup
cp labels.db labels.db.backup
```

**重要**: 本番環境への移行時は両方のDBファイルを移動してください。

## トラブルシューティング

### LabelerServer起動失敗

ログに `LabelerServer起動失敗` が表示される場合:

**原因と対処**:
1. **LABELER_SIGNING_KEYが間違っている**
   - セットアップ時に表示された署名鍵を再確認
   - スペースや改行が含まれていないか確認

2. **ポート14831が使用中**
   - `lsof -i :14831` で確認
   - `.env` の `LABELER_PORT` を変更

3. **labels.dbファイルの権限エラー**
   - `ls -la labels.db` で確認
   - `chmod 644 labels.db` で修正

### ラベルが発行されない

ログに `ラベル付与失敗` が表示される場合:

**原因と対処**:
1. **ラベルが定義されていない**
   - `npx @skyware/labeler label add` でラベル追加
   - Identifierが `TRIGGER_MAP` の値と完全一致するか確認

2. **DIDフォーマットエラー**
   - LikeしたユーザーのDIDが正しい形式（`did:plc:...`）か確認

### ラベルが表示されない

ラベル発行成功ログは出るが、Blueskyアプリでラベルが見えない場合:

**原因と対処**:
1. **ラベラーをサブスクライブしていない**
   - Settings → Moderation → Labelers でサブスクライブ

2. **ラベル定義で "Show badge" が無効**
   - `npx @skyware/labeler label edit` で設定変更

3. **キャッシュの問題**
   - Blueskyアプリを再起動
   - プロフィールページをリロード

### Jetstream接続エラー

ログに `Jetstreamエラー` が表示される場合:

1. ネットワーク接続を確認
2. Jetstreamサービスの稼働状況を確認
3. ファイアウォール設定を確認

### データ不整合

ログに `DBに存在しない（データ不整合）` が表示される場合:

- キャッシュとDBの同期が取れていない可能性があります
- サービスを再起動してキャッシュを再構築してください

### シャットダウン関連の問題

#### シャットダウン処理が応答しない

シャットダウン中にプロセスがハングする場合:

1. LabelerServerのクローズ処理が完了するまで待つ（最大30秒程度）
2. 30秒以上応答がない場合は別のターミナルで `kill <プロセスID>` を実行
3. それでも停止しない場合のみ `kill -9 <プロセスID>` を使用（最終手段）

#### シャットダウンログが2重に出力される

古いバージョンではシャットダウン処理が2重実行される問題がありました:

- 最新版では `isShuttingDown` フラグにより自動的に防止されます
- もし2重実行が発生する場合は、コードが最新版か確認してください

#### データベースロックエラー

シャットダウン時に "database is locked" エラーが出る場合:

1. 他のプロセスがDBファイルにアクセスしていないか確認
2. `lsof database.db` でファイルを開いているプロセスを確認
3. グレースフルシャットダウン（Ctrl+C）を使用する（強制終了は避ける）

## セキュリティ

### 秘密鍵の管理

- `.env` ファイルは **絶対にgitにコミットしない**でください
- 本番環境では環境変数またはシークレット管理サービスを使用してください
- `.gitignore` に `.env` が含まれていることを確認してください

### SQLインジェクション対策

- プリペアドステートメントを使用しているため、SQLインジェクションのリスクはありません

## ラベラー機能

このシステムは`@skyware/labeler`を使用してBlueskyネットワークに実際のラベルを発行します。

### 機能

- **ラベル発行**: トリガー投稿にLikeしたユーザーに自動的にラベルを付与
- **ラベル除去**: Likeをキャンセルしたユーザーからラベルを自動除去
- **WebSocketエンドポイント**: `com.atproto.label.subscribeLabels` でラベルをリアルタイム配信
- **署名付きラベル**: secp256k1秘密鍵でラベルに署名し、改ざん防止

### ラベルの仕組み

1. ユーザーがトリガー投稿にLike
2. システムが検知してラベルを発行
3. LabelerServerが署名付きラベルをDBに保存
4. ラベラーをサブスクライブしている全ユーザーにWebSocketで配信
5. Blueskyアプリがラベルを受信してプロフィールに表示

## 本番環境への展開

### 必要なもの

1. **ドメイン名**: 例: `labeler.yourdomain.com`
2. **SSL証明書**: HTTPS必須
3. **VPSまたはサーバー**: 常時稼働可能な環境

### Caddyによるリバースプロキシ設定

```bash
# Caddyインストール（Ubuntu/Debian）
sudo apt install caddy

# /etc/caddy/Caddyfile を編集
sudo nano /etc/caddy/Caddyfile
```

設定内容:
```
labeler.yourdomain.com {
    reverse_proxy localhost:14831
}
```

```bash
# Caddy起動
sudo systemctl enable caddy
sudo systemctl start caddy
```

### systemdサービス化

`/etc/systemd/system/labeler.service` を作成:

```ini
[Unit]
Description=Bluesky Labeler Service
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/283-labeler
ExecStart=/usr/bin/node /path/to/283-labeler/dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

サービス起動:
```bash
sudo systemctl enable labeler
sudo systemctl start labeler
sudo systemctl status labeler
```

### 本番環境でのラベラーセットアップ

```bash
npx @skyware/labeler setup
```

- **サーバーURL**: `https://labeler.yourdomain.com` (HTTPSであること)
- その他の手順はローカルと同じ

### DID Documentの確認

セットアップ完了後、以下のURLで確認:
```
https://plc.directory/did:plc:あなたのDID
```

`service`セクションに以下が含まれていることを確認:
```json
{
  "id": "#atproto_labeler",
  "type": "AtprotoLabeler",
  "serviceEndpoint": "https://labeler.yourdomain.com"
}
```

### ログ監視

```bash
# systemdログ
sudo journalctl -u labeler -f

# アプリケーションログ
# LOG_LEVELに応じて出力される
```

## ライセンス

MIT License - 詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 貢献

プルリクエストを歓迎します。大きな変更を行う場合は、まずissueを開いて変更内容を議論してください。
