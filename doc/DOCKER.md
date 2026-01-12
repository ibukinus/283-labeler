# Docker デプロイガイド

本番環境でBluesky Labelerシステムをデプロイするための手順です。

## 前提条件

- Docker 20.10以降
- Docker Compose V2以降
- Blueskyアカウント
- Labeler DIDと署名キー

## クイックスタート

### 1. 環境変数の設定

```bash
# .env.exampleをコピー
cp .env.example .env

# エディタで編集
nano .env
```

必須項目を設定：
```env
LABELER_DID=did:plc:xxxxxxxxxxxxxxxxxxxxx
LABELER_SIGNING_KEY=your-signing-key-here
LABELER_IDENTIFIER=labeler.bsky.social
LABELER_PASSWORD=your-password-here
```

### 2. Dockerイメージのビルド

```bash
docker-compose build
```

### 3. コンテナの起動

```bash
docker-compose up -d
```

### 4. ログの確認

```bash
docker-compose logs -f
```

### 5. 動作確認

```bash
# ヘルスチェック
curl http://localhost:14831/.well-known/did.json

# ステータス確認
docker-compose ps
```

## コマンドリファレンス

### コンテナ管理

```bash
# 起動
docker-compose up -d

# 停止
docker-compose down

# 再起動
docker-compose restart

# ログ表示
docker-compose logs -f labeler

# コンテナに入る
docker-compose exec labeler sh
```

### イメージ管理

```bash
# ビルド
docker-compose build

# 強制リビルド（キャッシュなし）
docker-compose build --no-cache

# イメージの確認
docker images 283-labeler
```

### データ管理

```bash
# ボリュームの確認
docker volume ls | grep labeler

# データベースのバックアップ
docker-compose exec labeler sh -c 'tar -czf - /app/data' > backup-$(date +%Y%m%d).tar.gz

# データベースのリストア
cat backup-20260112.tar.gz | docker-compose exec -T labeler sh -c 'tar -xzf - -C /'

# ボリュームの削除（注意：データが消えます）
docker-compose down -v
```

## Dockerfileの構造

マルチステージビルドを使用した最適化されたイメージ：

### Stage 1: ビルド環境
- Node.js 20 Alpine
- TypeScriptのビルド
- ネイティブモジュール（better-sqlite3）のコンパイル

### Stage 2: 本番環境
- Node.js 20 Alpine（軽量）
- ビルド済みアプリケーション
- 本番用依存関係のみ
- non-rootユーザーで実行（セキュリティ）

### 特徴
- イメージサイズ: 約150MB（最適化済み）
- セキュリティ: non-root実行
- ヘルスチェック: 自動監視
- データ永続化: 名前付きボリューム

## トラブルシューティング

### ビルドエラー

**エラー**: `better-sqlite3`のビルド失敗
```bash
# Alpineに必要なビルドツールがインストールされているか確認
docker-compose build --no-cache
```

**エラー**: メモリ不足
```bash
# Dockerのメモリ制限を増やす（Docker Desktop設定）
# または、docker-compose.ymlのresourcesを調整
```

### 起動エラー

**エラー**: 環境変数が設定されていない
```bash
# .envファイルの確認
cat .env

# 必須項目が設定されているか確認
docker-compose config
```

**エラー**: ポートが既に使用中
```bash
# .envでポート番号を変更
LABELER_PORT=14832

# 再起動
docker-compose up -d
```

### データベースエラー

**エラー**: データベースが読み取り専用
```bash
# ボリュームの権限確認
docker-compose exec labeler ls -la /app/data

# 権限修正が必要な場合
docker-compose down
docker volume rm $(docker volume ls -q | grep labeler)
docker-compose up -d
```

## 本番環境のベストプラクティス

### 1. リソース制限

docker-compose.ymlで適切なリソース制限を設定：
```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
```

### 2. ログローテーション

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 3. 定期バックアップ

cronで定期バックアップを設定：
```bash
# crontab -e
0 2 * * * cd /path/to/283-labeler && docker-compose exec -T labeler sh -c 'tar -czf - /app/data' > /backup/labeler-$(date +\%Y\%m\%d).tar.gz
```

### 4. モニタリング

```bash
# ヘルスチェック
docker inspect --format='{{.State.Health.Status}}' bluesky-labeler

# リソース使用状況
docker stats bluesky-labeler
```

### 5. アップデート

```bash
# コードを更新
git pull

# イメージを再ビルド
docker-compose build

# コンテナを再作成
docker-compose up -d
```

## セキュリティ考慮事項

1. **環境変数の保護**
   - `.env`ファイルをバージョン管理に含めない
   - ファイル権限を`600`に設定: `chmod 600 .env`

2. **non-root実行**
   - コンテナは`labeler`ユーザー（UID 1001）で実行

3. **ネットワーク分離**
   - 必要なポートのみ公開
   - リバースプロキシ（nginx, Caddy）の使用を推奨

4. **定期更新**
   - ベースイメージ（Node.js）を定期的に更新
   - 依存関係の脆弱性をチェック: `npm audit`

## パフォーマンス最適化

### 1. イメージサイズの削減

既に実施済み：
- マルチステージビルド使用
- Alpine Linuxベース
- 本番用依存関係のみ

### 2. キャッシュの活用

```dockerfile
# package.jsonを先にコピー（レイヤーキャッシュ）
COPY package*.json ./
RUN npm ci
# その後ソースコードをコピー
COPY . .
```

### 3. ビルド時間の短縮

```bash
# .dockerignoreで不要ファイルを除外済み
# ビルドコンテキストが小さくなる
```

## よくある質問

**Q: データベースファイルはどこに保存されますか？**

A: 名前付きボリューム`labeler-data`に永続化されます。物理的な場所は`docker volume inspect`で確認できます。

**Q: ログはどこで確認できますか？**

A: `docker-compose logs -f labeler`または、JSONファイルとして`/var/lib/docker/containers/`に保存されています。

**Q: コンテナを削除してもデータは残りますか？**

A: `docker-compose down`では残ります。`docker-compose down -v`を実行するとボリュームも削除されます。

**Q: 複数のLabelerを同じホストで実行できますか？**

A: できます。ポート番号とボリューム名を変更してください。
