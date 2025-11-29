# DMS 設計ドキュメント

## 概要

このディレクトリには、ドキュメント管理システム（DMS）の詳細な設計ドキュメントが格納されています。

## ドキュメント一覧

### [00. アーキテクチャ概要](./00-architecture-overview.md)

システム全体のアーキテクチャ、レイヤー構成、データフロー、実装ロードマップを記載。

**主な内容:**
- システム全体構成図
- レイヤードアーキテクチャの詳細
- ディレクトリ構造
- データフロー（アップロード、検索、LLM対話）
- セキュリティ設計
- パフォーマンス最適化
- スケーラビリティ戦略
- 実装ロードマップ（Phase 1-7）

### [01. 技術選定](./01-technology-selection.md)

採用技術スタックと選定理由、代替案の比較検討。

**主な内容:**
- バックエンド: Hono + TypeScript
- データ層: PostgreSQL + pgvector, DuckDB
- ORM: Drizzle ORM
- ストレージ: ファイルシステム / S3互換
- LLM/Embedding: OpenAI API
- キャッシュ: Redis
- アーキテクチャパターン: Repository, Strategy, Factory, Adapter
- 依存関係一覧

### [02. API仕様設計](./02-api-specification.md)

RESTful API のエンドポイント定義、リクエスト/レスポンス形式。

**主な内容:**
- エンドポイント一覧
  - ドキュメント管理 CRUD
  - 統合検索（Hybrid, Embedding, FullText, String）
  - LLM対話型検索（ストリーミング対応）
  - Embedding管理
  - タグ管理
  - 統計・分析
- 共通仕様（認証、エラーハンドリング、ページネーション）
- WebSocket API（リアルタイム通知）
- レート制限
- セキュリティ

### [03. データモデルとリポジトリ設計](./03-data-models-and-repositories.md)

ドメインエンティティ、DBスキーマ、リポジトリパターンの詳細設計。

**主な内容:**
- ドメインエンティティ
  - `Document`
  - `DocumentEmbedding`
  - `SearchResult`
- PostgreSQL スキーマ
  - `documents`, `document_embeddings`, `tags`, `processing_jobs`, `search_logs`
  - pgvector インデックス（HNSW）
- DuckDB スキーマ（FTS）
- リポジトリインターフェース
  - `IDocumentRepository`
  - `IEmbeddingRepository`
  - `ISearchRepository`
  - `IStorageAdapter`
- リポジトリ実装例
  - `PostgresDocumentRepository`
  - `DuckDBSearchRepository`
  - `FileSystemStorageAdapter` / `S3StorageAdapter`
- DIコンテナ設計

## 設計原則

### 1. ストレージの抽象化

ドキュメント本体の保存先（ファイルシステム、S3等）を抽象化し、設定で切り替え可能。

```typescript
interface IStorageAdapter {
  upload(options): Promise<{ url, size }>;
  download(url): Promise<Buffer>;
  delete(url): Promise<void>;
}
```

### 2. DBの抽象化

データアクセスをリポジトリパターンで抽象化し、DB種別に非依存。

```typescript
interface IDocumentRepository {
  create(input): Promise<Document>;
  findById(id): Promise<Document | null>;
  // ...
}
```

### 3. 検索戦略の抽象化

複数の検索手法（Embedding, FullText, String）を統一インターフェースで提供。

```typescript
interface ISearchRepository {
  search(options): Promise<SearchResult>;
}
```

### 4. 依存性の逆転（DIP）

- ドメイン層はインフラ層に依存しない
- インフラ層がドメイン層のインターフェースを実装
- DIコンテナで実装を注入

```
Application → Domain ← Infrastructure
```

## 主要機能

### ドキュメント管理

- **CRUD操作**: 作成、読み取り、更新、削除（論理削除対応）
- **メタデータ管理**: タイトル、説明、タグ、カスタムフィールド（JSONB）
- **ファイルアップロード**: PDF, Word, Excel, テキスト（最大100MB）
- **テキスト抽出**: 自動テキスト抽出（非同期処理）

### 多様な検索方式

1. **LLM Embedding検索**
   - セマンティック検索（意味的類似性）
   - pgvector によるベクトル検索
   - コサイン類似度でランキング

2. **LLM対話型検索**
   - 自然言語での質問
   - RAG（Retrieval-Augmented Generation）
   - ストリーミングレスポンス

3. **全文検索**
   - DuckDB FTS（Full-Text Search）
   - 高速な全文検索

4. **文字列検索**
   - 部分一致、完全一致
   - タイトル、説明、本文を横断検索

5. **ハイブリッド検索**
   - 複数検索手法を組み合わせてランキング

### 非同期処理

- **テキスト抽出**: アップロード後にバックグラウンドで実行
- **Embedding生成**: テキスト抽出後に自動実行
- **バッチ処理**: 複数ドキュメントの一括処理
- **ジョブ管理**: Bull Queue（Redis）

## 技術スタック概要

| レイヤー | 技術 |
|---------|------|
| **API** | Hono |
| **ORM** | Drizzle ORM |
| **メタデータDB** | PostgreSQL + pgvector |
| **全文検索** | DuckDB |
| **ストレージ** | FS / S3 |
| **キャッシュ** | Redis |
| **LLM/Embedding** | OpenAI API |
| **ジョブキュー** | Bull |
| **ログ** | Pino |

## 実装の進め方

実装は以下の順序で進めることを推奨します:

### Phase 1: 基盤構築
1. DB スキーマ・マイグレーション
2. ドメインエンティティ
3. リポジトリインターフェース
4. PostgreSQL リポジトリ実装

### Phase 2: 基本機能
1. ドキュメント CRUD API
2. ファイルアップロード/ダウンロード
3. テキスト抽出
4. タグ管理

### Phase 3-7
- 詳細は [00-architecture-overview.md](./00-architecture-overview.md#実装ロードマップ) を参照

## セキュリティ

- **認証**: JWT Bearer Token
- **通信**: HTTPS (TLS 1.3)
- **ストレージ暗号化**: S3 SSE
- **入力バリデーション**: Zod
- **レート制限**: Redis（Sliding Window）
- **SQLインジェクション対策**: ORM

## パフォーマンス

- **キャッシュ**: Redis L1 Cache
- **インデックス**: pgvector HNSW, PostgreSQL GIN/B-tree, DuckDB FTS
- **非同期処理**: Bull Queue
- **コネクションプール**: PostgreSQL (min: 10, max: 50)

## モニタリング

- **ログ**: Pino（構造化ログ）
- **メトリクス**: Prometheus + Grafana
- **トレーシング**: OpenTelemetry + Jaeger

## 関連ドキュメント

- [プロジェクトルート README](../../README.md)
- API ドキュメント（実装後に生成）
- データベースマイグレーション（`packages/api/src/infrastructure/database/migrations/`）

## 更新履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2025-11-29 | 1.0.0 | 初版作成 |
