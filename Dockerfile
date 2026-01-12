# ============================================
# Stage 1: ビルド環境
# ============================================
FROM node:20-alpine AS builder

# ビルドに必要なツールをインストール
# better-sqlite3のネイティブモジュールビルドに必要
RUN apk add --no-cache \
    python3 \
    make \
    g++

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール（開発依存関係も含む）
RUN npm ci

# ソースコードをコピー
COPY . .

# TypeScriptをビルド
RUN npm run build

# 本番用の依存関係のみインストール
# better-sqlite3を再ビルドして本番環境用にする
RUN npm ci --omit=dev && \
    npm rebuild better-sqlite3

# ============================================
# Stage 2: 本番環境
# ============================================
FROM node:20-alpine

# ヘルスチェック用にwgetをインストール
RUN apk add --no-cache wget

# セキュリティ：non-rootユーザーで実行
RUN addgroup -g 1001 -S nodejs && \
    adduser -S labeler -u 1001

# 作業ディレクトリを設定
WORKDIR /app

# ビルド成果物をコピー
COPY --from=builder --chown=labeler:nodejs /app/dist ./dist
COPY --from=builder --chown=labeler:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=labeler:nodejs /app/package*.json ./

# データベースディレクトリを作成
RUN mkdir -p /app/data && \
    chown labeler:nodejs /app/data

# ボリュームマウントポイント
VOLUME ["/app/data"]

# non-rootユーザーに切り替え
USER labeler

# ヘルスチェック（LabelerServerのヘルスエンドポイントを確認）
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${LABELER_PORT:-14831}/xrpc/_health || exit 1

# ポートを公開
EXPOSE 14831

# アプリケーション起動
CMD ["node", "dist/src/index.js"]
