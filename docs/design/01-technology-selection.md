# 技術選定

## 概要

ドキュメント管理システム（DMS）の技術スタックと選定理由を記載します。

## システム要件

- ドキュメントの保存・管理（DB/ファイルシステムを抽象化）
- LLMベースのEmbedding検索
- LLM対話型検索
- 文字列検索（部分一致、完全一致）
- DuckDBによる全文検索
- ストレージ層の抽象化（RDBMS/NoSQL/NewSQL非依存）

## 技術スタック

### バックエンド

#### API Framework
**選定: Hono**

- 理由:
  - 軽量・高速なWeb Framework
  - TypeScriptファーストの設計
  - マルチランタイム対応（Node.js、Deno、Cloudflare Workers等）
  - 既にプロジェクトで採用済み
  - ミドルウェアが充実

#### 言語
**選定: TypeScript**

- 理由:
  - 型安全性による品質向上
  - 大規模開発での保守性
  - 既にプロジェクトで採用済み
  - リッチなエコシステム

### データ層

#### メタデータストレージ
**選定: PostgreSQL + pgvector**

- 理由:
  - **PostgreSQL**:
    - 成熟したRDBMS
    - ACID特性による信頼性
    - JSON型サポート（柔軟なスキーマ）
    - 拡張性が高い
  - **pgvector**:
    - ベクトル検索をPostgreSQL上で実現
    - インフラの一元化
    - コサイン類似度、ユークリッド距離をサポート
    - インデックスによる高速検索（HNSW、IVFFlat）

代替案:
- Supabase（PostgreSQL + pgvector + RESTful API）
- Pinecone（専用ベクトルDB、ただし外部依存）
- Qdrant（OSS ベクトルDB）

#### 全文検索
**選定: DuckDB**

- 理由:
  - 要件で指定済み
  - 高速な分析クエリ
  - SQLベース（学習コスト低）
  - ファイルベース（デプロイ容易）
  - Parquet, CSV等多様なフォーマット対応

#### ドキュメント本体ストレージ
**選定: ファイルシステム抽象化レイヤー**

実装:
1. **ローカルファイルシステム** (開発環境)
2. **S3互換ストレージ** (本番環境)
   - AWS S3
   - MinIO
   - Cloudflare R2

- 理由:
  - ドキュメント本体はバイナリ/大容量
  - DBに保存すると肥大化
  - オブジェクトストレージが適している
  - S3互換にすることで選択肢が広い

#### ORM/Query Builder
**選定: Drizzle ORM**

- 理由:
  - TypeScript完全対応
  - 軽量（Prismaより小さい）
  - SQLライクな記法
  - マイグレーション管理
  - 型安全なクエリ

代替案: Prisma（より機能豊富だが重い）

### LLM/Embedding

#### Embedding生成
**選定: OpenAI Embeddings API (text-embedding-3-small/large)**

- 理由:
  - 高品質なEmbedding
  - API経由で簡単に利用可能
  - スケーラブル

代替案:
- ローカルモデル（sentence-transformers）
  - コスト削減
  - プライバシー
  - ただし、GPUリソースが必要

#### LLM (対話型検索)
**選定: OpenAI API (GPT-4/GPT-3.5-turbo)**

- 理由:
  - 高度な自然言語理解
  - RAG（Retrieval-Augmented Generation）に最適
  - ストリーミング対応

代替案:
- Anthropic Claude
- ローカルLLM（Llama, Mistral等）

### キャッシュ層

**選定: Redis**

- 理由:
  - Embedding結果のキャッシュ
  - セッション管理
  - レート制限
  - 高速なインメモリDB

### 検索戦略

#### 1. LLM Embedding検索
- Embeddingベクトル生成 → pgvector検索 → コサイン類似度でランキング

#### 2. LLM対話型検索
- ユーザークエリ → Embedding検索で関連文書取得 → LLMに文脈として渡す → 回答生成

#### 3. 文字列検索
- PostgreSQLのLIKE/ILIKE/正規表現
- 複数フィールド対象（タイトル、本文抽出テキスト、タグ）

#### 4. 全文検索
- DuckDB FTS（Full-Text Search）
- テキスト抽出後のドキュメントをインデックス化

## アーキテクチャパターン

### レイヤードアーキテクチャ

```
┌─────────────────────────────────────┐
│   Presentation Layer (API Routes)  │  Hono Controllers
├─────────────────────────────────────┤
│   Application Layer (Use Cases)    │  Business Logic
├─────────────────────────────────────┤
│   Domain Layer                      │  Entities, Repositories (Interface)
├─────────────────────────────────────┤
│   Infrastructure Layer              │  Repository Impl, External Services
└─────────────────────────────────────┘
```

### デザインパターン

1. **Repository Pattern**
   - データアクセスの抽象化
   - `IDocumentRepository` インターフェース
   - 実装: `PostgresDocumentRepository`, `FileSystemDocumentRepository`

2. **Strategy Pattern**
   - 検索戦略の切り替え
   - `ISearchStrategy` インターフェース
   - 実装: `EmbeddingSearchStrategy`, `FullTextSearchStrategy`, `StringSearchStrategy`

3. **Factory Pattern**
   - Repositoryの生成
   - 設定に基づいて適切な実装を返す

4. **Adapter Pattern**
   - ストレージアダプター（FS, S3）
   - LLMプロバイダーアダプター（OpenAI, Anthropic, Local）

## 依存関係

### Core Dependencies

```json
{
  "dependencies": {
    "hono": "^4.0.0",
    "@hono/node-server": "^1.0.0",
    "drizzle-orm": "^0.33.0",
    "postgres": "^3.4.0",
    "pgvector": "^0.2.0",
    "duckdb": "^1.0.0",
    "openai": "^4.0.0",
    "ioredis": "^5.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.24.0"
  }
}
```

### Optional Dependencies (Storage)

```json
{
  "dependencies": {
    "@aws-sdk/client-s3": "^3.0.0",
    "@aws-sdk/s3-request-presigner": "^3.0.0"
  }
}
```

## セキュリティ

- API認証: JWT + Bearer Token
- ファイルアクセス: Pre-signed URL（S3）
- 入力バリデーション: Zod
- レート制限: Redis
- CORS設定: Honoミドルウェア

## スケーラビリティ

- **水平スケーリング**:
  - APIサーバー（ステートレス設計）
  - PostgreSQL（Read Replica）
  - Redis（クラスタモード）

- **垂直スケーリング**:
  - DuckDB（単一ノード、大容量メモリで高速化）

## モニタリング

- ログ: Pino（構造化ログ）
- メトリクス: Prometheus + Grafana
- トレーシング: OpenTelemetry

## 結論

この技術スタックにより、以下が実現されます:

1. ✅ ストレージの抽象化（Repository Pattern）
2. ✅ DB種別の抽象化（Interface駆動設計）
3. ✅ 多様な検索方式のサポート
4. ✅ 高いスケーラビリティ
5. ✅ 保守性・拡張性の高いコードベース
