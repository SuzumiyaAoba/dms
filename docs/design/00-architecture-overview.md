# アーキテクチャ概要

## システム概要

ドキュメント管理システム（DMS: Document Management System）は、ドキュメントの保存・管理・検索を統合的に提供するシステムです。

### 主要機能

1. **ドキュメント管理**
   - アップロード、ダウンロード、更新、削除
   - メタデータ管理（タイトル、説明、タグ、カスタムフィールド）
   - ファイル形式: PDF, Word, Excel, テキスト等

2. **多様な検索方式**
   - **LLM Embedding検索**: セマンティック検索（意味的類似性）
   - **LLM対話型検索**: 自然言語で質問し、LLMが回答を生成
   - **全文検索**: DuckDBによる高速全文検索
   - **文字列検索**: 部分一致、完全一致検索

3. **抽象化レイヤー**
   - ストレージ抽象化: ファイルシステム / S3互換ストレージ
   - DB抽象化: RDBMS / NoSQL / NewSQL 非依存
   - 検索戦略抽象化: 複数検索手法の統一インターフェース

## システムアーキテクチャ

### 全体構成図

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                      │
│                     Web UI / User Interface                     │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTPS / REST API
┌───────────────────────────────▼─────────────────────────────────┐
│                      API Layer (Hono)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Documents   │  │   Search     │  │    LLM       │         │
│  │  Controller  │  │  Controller  │  │  Controller  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                     Application Layer                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Use Cases (Business Logic)                              │  │
│  │  - UploadDocumentUseCase                                 │  │
│  │  - SearchDocumentsUseCase                                │  │
│  │  - GenerateEmbeddingUseCase                              │  │
│  │  - ChatWithDocumentsUseCase                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                      Domain Layer                               │
│  ┌──────────────────────┐  ┌───────────────────────────────┐   │
│  │  Entities            │  │  Repository Interfaces        │   │
│  │  - Document          │  │  - IDocumentRepository        │   │
│  │  - DocumentEmbedding │  │  - IEmbeddingRepository       │   │
│  │  - SearchResult      │  │  - ISearchRepository          │   │
│  └──────────────────────┘  │  - IStorageAdapter            │   │
│                             └───────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────┘
                                │ (依存性の逆転)
┌───────────────────────────────▼─────────────────────────────────┐
│                   Infrastructure Layer                          │
│  ┌────────────────────┐  ┌──────────────────────────────────┐  │
│  │  Repositories      │  │  External Services               │  │
│  │  - Postgres        │  │  - OpenAI API (Embedding/LLM)    │  │
│  │  - DuckDB          │  │  - Redis Cache                   │  │
│  │  - pgvector        │  │  - S3 Storage                    │  │
│  └────────────────────┘  └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         Data Layer                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │
│  │ PostgreSQL │  │  DuckDB    │  │   Redis    │  │   S3     │ │
│  │ + pgvector │  │    FTS     │  │   Cache    │  │  Files   │ │
│  └────────────┘  └────────────┘  └────────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### レイヤード アーキテクチャ

#### 1. Presentation Layer (API Routes)
- **責務**: HTTPリクエストの受付、レスポンス返却
- **技術**: Hono Router, Middleware (CORS, Auth, Validation)
- **場所**: `packages/api/src/routes/`

#### 2. Application Layer (Use Cases)
- **責務**: ビジネスロジックの実行、複数リポジトリの調整
- **技術**: TypeScript Classes
- **場所**: `packages/api/src/application/use-cases/`

#### 3. Domain Layer (Entities & Interfaces)
- **責務**: ビジネスルール、エンティティ定義、インターフェース定義
- **技術**: TypeScript Classes, Interfaces
- **場所**: `packages/core/src/domain/`
- **特徴**: インフラ層に依存しない（依存性の逆転）

#### 4. Infrastructure Layer (Implementations)
- **責務**: 外部システムとの統合、リポジトリ実装
- **技術**: Drizzle ORM, DuckDB, OpenAI SDK, AWS SDK
- **場所**: `packages/api/src/infrastructure/`

## ディレクトリ構造

```
dms/
├── packages/
│   ├── core/                         # 共有ドメインロジック
│   │   └── src/
│   │       ├── domain/
│   │       │   ├── entities/         # エンティティ
│   │       │   │   ├── Document.ts
│   │       │   │   ├── DocumentEmbedding.ts
│   │       │   │   └── SearchResult.ts
│   │       │   ├── repositories/     # リポジトリインターフェース
│   │       │   │   ├── IDocumentRepository.ts
│   │       │   │   ├── IEmbeddingRepository.ts
│   │       │   │   └── ISearchRepository.ts
│   │       │   ├── adapters/         # アダプターインターフェース
│   │       │   │   ├── IStorageAdapter.ts
│   │       │   │   └── ILLMProvider.ts
│   │       │   └── value-objects/    # 値オブジェクト
│   │       │       ├── DocumentId.ts
│   │       │       └── EmbeddingVector.ts
│   │       └── index.ts
│   │
│   ├── api/                          # API サーバー
│   │   └── src/
│   │       ├── index.ts              # エントリーポイント
│   │       ├── app.ts                # Hono アプリケーション
│   │       ├── routes/               # API ルート
│   │       │   ├── documents.ts      # /api/v1/documents
│   │       │   ├── search.ts         # /api/v1/search
│   │       │   ├── embeddings.ts     # /api/v1/embeddings
│   │       │   └── index.ts
│   │       ├── middleware/           # ミドルウェア
│   │       │   ├── auth.ts           # JWT認証
│   │       │   ├── errorHandler.ts   # エラーハンドリング
│   │       │   ├── rateLimit.ts      # レート制限
│   │       │   └── validation.ts     # 入力バリデーション
│   │       ├── application/          # アプリケーション層
│   │       │   └── use-cases/
│   │       │       ├── UploadDocumentUseCase.ts
│   │       │       ├── SearchDocumentsUseCase.ts
│   │       │       ├── GenerateEmbeddingUseCase.ts
│   │       │       └── ChatWithDocumentsUseCase.ts
│   │       ├── infrastructure/       # インフラ層
│   │       │   ├── database/
│   │       │   │   ├── client.ts     # Drizzle クライアント
│   │       │   │   ├── schema.ts     # DB スキーマ定義
│   │       │   │   └── migrations/   # マイグレーション
│   │       │   ├── repositories/
│   │       │   │   ├── PostgresDocumentRepository.ts
│   │       │   │   ├── PostgresEmbeddingRepository.ts
│   │       │   │   └── DuckDBSearchRepository.ts
│   │       │   ├── adapters/
│   │       │   │   ├── FileSystemStorageAdapter.ts
│   │       │   │   ├── S3StorageAdapter.ts
│   │       │   │   ├── OpenAIProvider.ts
│   │       │   │   └── RedisCache.ts
│   │       │   ├── di/               # DI コンテナ
│   │       │   │   └── container.ts
│   │       │   └── services/         # 外部サービス連携
│   │       │       ├── embeddingService.ts
│   │       │       ├── textExtractor.ts
│   │       │       └── vectorSearch.ts
│   │       ├── config/               # 設定
│   │       │   ├── env.ts            # 環境変数
│   │       │   └── constants.ts
│   │       └── utils/                # ユーティリティ
│   │           ├── logger.ts
│   │           └── idGenerator.ts
│   │
│   └── web/                          # Web フロントエンド
│       └── src/
│           ├── app/                  # Next.js App Router
│           ├── components/           # React コンポーネント
│           ├── lib/                  # API クライアント
│           └── hooks/                # カスタムフック
│
├── docs/                             # ドキュメント
│   ├── design/                       # 設計書
│   │   ├── 00-architecture-overview.md
│   │   ├── 01-technology-selection.md
│   │   ├── 02-api-specification.md
│   │   └── 03-data-models-and-repositories.md
│   └── api/                          # API ドキュメント
│
└── scripts/                          # スクリプト
    ├── setup-db.sh                   # DB セットアップ
    └── seed.ts                       # テストデータ投入
```

## データフロー

### ドキュメントアップロード

```
1. Client → POST /api/v1/documents (ファイル + メタデータ)
2. API → Validation (Zod)
3. API → UploadDocumentUseCase
4. UseCase → StorageAdapter.upload() (S3 or FileSystem)
5. UseCase → DocumentRepository.create() (PostgreSQL)
6. UseCase → Queue.enqueue('extract-text', documentId)
7. API → 201 Created (Document ID)

[非同期処理]
8. Worker → TextExtractor.extract(documentId)
9. Worker → DocumentRepository.update(extractedText)
10. Worker → Queue.enqueue('generate-embedding', documentId)

11. Worker → EmbeddingService.generate(extractedText)
12. Worker → EmbeddingRepository.create(vector)
13. Worker → DocumentRepository.update(embeddingId)
14. Worker → WebSocket.notify('document.ready', documentId)
```

### Embedding検索

```
1. Client → POST /api/v1/search { query: "..." }
2. API → SearchDocumentsUseCase
3. UseCase → EmbeddingService.generate(query) → queryVector
4. UseCase → EmbeddingRepository.findSimilar(queryVector, limit)
   → pgvector: SELECT ... ORDER BY embedding <=> queryVector LIMIT 10
5. UseCase → DocumentRepository.findByIds(documentIds)
6. UseCase → Rank & Sort results
7. API → 200 OK (SearchResult)
```

### LLM対話検索

```
1. Client → POST /api/v1/search/chat { message: "..." }
2. API → ChatWithDocumentsUseCase
3. UseCase → EmbeddingSearch(message) → top 5 documents
4. UseCase → LLMProvider.chat({
     messages: [...history, userMessage],
     context: extractedTexts[]
   })
5. LLM → Stream response tokens
6. API → SSE Stream → Client
```

## セキュリティ設計

### 認証・認可

- **JWT認証**: Bearer Token
- **トークン有効期限**: 24時間
- **リフレッシュトークン**: 30日
- **権限**: RBAC（Role-Based Access Control）
  - `admin`: 全権限
  - `user`: 読み書き権限
  - `viewer`: 読み取りのみ

### データ保護

- **通信**: HTTPS (TLS 1.3)
- **ストレージ暗号化**: S3 Server-Side Encryption (SSE-S3)
- **DB接続**: SSL/TLS
- **環境変数**: `.env` (gitignore)

### 入力バリデーション

- **Zod**: 型安全なバリデーション
- **ファイルサイズ制限**: 最大100MB
- **MIME Type検証**: ホワイトリスト方式
- **SQLインジェクション対策**: ORM (Drizzle)

### レート制限

- **Redis**: Sliding Window アルゴリズム
- **一般API**: 100 req/min
- **検索API**: 30 req/min
- **LLM API**: 10 req/min

## パフォーマンス最適化

### キャッシュ戦略

1. **Redis L1 Cache**
   - Embedding結果（TTL: 1時間）
   - 検索結果（TTL: 10分）
   - ドキュメントメタデータ（TTL: 5分）

2. **PostgreSQL Connection Pool**
   - Min: 10, Max: 50

3. **DuckDB In-Memory**
   - 全文検索インデックスをメモリに展開

### インデックス戦略

- **pgvector HNSW**: Embedding検索の高速化
- **PostgreSQL GIN**: タグ検索、JSONB検索
- **PostgreSQL B-tree**: 時系列検索（created_at）
- **DuckDB FTS**: 全文検索インデックス

### 非同期処理

- **Bull Queue (Redis)**: ジョブキュー
  - テキスト抽出
  - Embedding生成
  - バッチアップロード

## スケーラビリティ

### 水平スケーリング

- **APIサーバー**: ステートレス設計、ロードバランサー
- **PostgreSQL**: Read Replica（読み取り負荷分散）
- **Redis**: Cluster Mode

### 垂直スケーリング

- **DuckDB**: 単一ノード、大容量メモリで高速化
- **PostgreSQL**: CPU/Memory増強

## モニタリング・オブザーバビリティ

### ログ

- **Pino**: 構造化ログ（JSON形式）
- **Log Levels**: error, warn, info, debug
- **ログ出力先**: stdout (コンテナ環境)

### メトリクス

- **Prometheus**: メトリクス収集
- **Grafana**: ダッシュボード
- **メトリクス項目**:
  - リクエスト数/秒
  - レスポンスタイム（p50, p95, p99）
  - エラー率
  - DB接続数
  - キャッシュヒット率

### トレーシング

- **OpenTelemetry**: 分散トレーシング
- **Jaeger**: トレース可視化

## デプロイメント

### 開発環境

- **Docker Compose**: ローカル開発
- **Hot Reload**: tsx watch

### 本番環境

- **コンテナ化**: Docker
- **オーケストレーション**: Kubernetes (optional)
- **CI/CD**: GitHub Actions
  - Lint → Test → Build → Deploy

### 環境変数

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dms
DUCKDB_PATH=./data/dms.duckdb

# Storage
STORAGE_TYPE=s3 # or 'filesystem'
S3_BUCKET=dms-documents
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx

# Redis
REDIS_URL=redis://localhost:6379

# OpenAI
OPENAI_API_KEY=sk-xxx

# App
NODE_ENV=production
PORT=3000
JWT_SECRET=xxx
```

## 実装ロードマップ

### Phase 1: 基盤構築（2週間）

- [ ] プロジェクト初期化
- [ ] DB スキーマ設計・マイグレーション
- [ ] ドメインエンティティ実装
- [ ] リポジトリインターフェース定義
- [ ] PostgreSQL リポジトリ実装
- [ ] ファイルシステム ストレージアダプター

### Phase 2: 基本機能（3週間）

- [ ] ドキュメントCRUD API
- [ ] ファイルアップロード/ダウンロード
- [ ] テキスト抽出（PDF, Word）
- [ ] タグ管理
- [ ] 基本的な文字列検索

### Phase 3: Embedding検索（2週間）

- [ ] OpenAI Embedding統合
- [ ] pgvector セットアップ
- [ ] Embedding生成ワーカー
- [ ] ベクトル検索API
- [ ] キャッシュ層（Redis）

### Phase 4: 全文検索（1週間）

- [ ] DuckDB 統合
- [ ] FTSインデックス構築
- [ ] 全文検索API
- [ ] ハイブリッド検索

### Phase 5: LLM対話検索（2週間）

- [ ] OpenAI Chat API統合
- [ ] RAG実装（検索結果 → LLMコンテキスト）
- [ ] ストリーミングレスポンス
- [ ] 会話履歴管理

### Phase 6: フロントエンド（3週間）

- [ ] Next.js セットアップ
- [ ] ドキュメント管理UI
- [ ] 検索UI
- [ ] チャットUI
- [ ] ダッシュボード

### Phase 7: 最適化・運用（2週間）

- [ ] パフォーマンステスト
- [ ] 負荷テスト
- [ ] モニタリング設定
- [ ] ドキュメント整備
- [ ] デプロイ自動化

## まとめ

このアーキテクチャにより、以下が実現されます:

1. ✅ **高度な抽象化**: ストレージ、DB、検索戦略の完全な抽象化
2. ✅ **スケーラビリティ**: 水平・垂直スケーリング対応
3. ✅ **保守性**: レイヤードアーキテクチャ、依存性の逆転
4. ✅ **拡張性**: 新機能・新技術の追加が容易
5. ✅ **テスタビリティ**: モック・スタブを使った単体テスト
6. ✅ **パフォーマンス**: キャッシュ、インデックス、非同期処理
7. ✅ **セキュリティ**: 認証、暗号化、バリデーション
