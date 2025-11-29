# データモデルとリポジトリ設計

## 概要

ドキュメント管理システムのデータモデル、ドメインエンティティ、リポジトリパターンの設計を定義します。

## アーキテクチャ原則

### 1. ストレージの抽象化

```
┌─────────────────────────────────────────────┐
│         Application Layer (Use Cases)       │
└──────────────────┬──────────────────────────┘
                   │ 依存
┌──────────────────▼──────────────────────────┐
│    Domain Layer (Repository Interfaces)     │
└──────────────────▲──────────────────────────┘
                   │ 実装
┌──────────────────┴──────────────────────────┐
│  Infrastructure Layer (Repository Impls)    │
│  - PostgresDocumentRepository               │
│  - DuckDBSearchRepository                   │
│  - FileSystemStorage / S3Storage            │
└─────────────────────────────────────────────┘
```

### 2. 依存性の逆転

- ドメイン層はインフラ層に依存しない
- インフラ層がドメイン層のインターフェースを実装
- DIコンテナで実装を注入

## ドメインエンティティ

### Document (ドキュメント)

```typescript
// packages/core/src/domain/entities/Document.ts

export type DocumentStatus = 'processing' | 'ready' | 'error';

export interface DocumentMetadata {
  author?: string;
  category?: string;
  [key: string]: unknown;
}

export class Document {
  constructor(
    public readonly id: string,
    public title: string,
    public description: string | null,
    public tags: string[],
    public metadata: DocumentMetadata,
    public fileUrl: string,
    public fileName: string,
    public fileSize: number,
    public mimeType: string,
    public extractedText: string | null,
    public embeddingId: string | null,
    public status: DocumentStatus,
    public createdAt: Date,
    public updatedAt: Date,
    public deletedAt: Date | null = null,
  ) {}

  // ビジネスロジック
  markAsReady(): void {
    this.status = 'ready';
    this.updatedAt = new Date();
  }

  markAsError(): void {
    this.status = 'error';
    this.updatedAt = new Date();
  }

  updateMetadata(metadata: DocumentMetadata): void {
    this.metadata = { ...this.metadata, ...metadata };
    this.updatedAt = new Date();
  }

  addTags(tags: string[]): void {
    this.tags = [...new Set([...this.tags, ...tags])];
    this.updatedAt = new Date();
  }

  removeTags(tags: string[]): void {
    this.tags = this.tags.filter((tag) => !tags.includes(tag));
    this.updatedAt = new Date();
  }

  softDelete(): void {
    this.deletedAt = new Date();
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }
}
```

### DocumentEmbedding (Embeddingベクトル)

```typescript
// packages/core/src/domain/entities/DocumentEmbedding.ts

export class DocumentEmbedding {
  constructor(
    public readonly id: string,
    public readonly documentId: string,
    public readonly vector: number[], // Embeddingベクトル（1536次元等）
    public readonly model: string, // 'text-embedding-3-small' 等
    public readonly createdAt: Date,
  ) {}

  getDimensions(): number {
    return this.vector.length;
  }
}
```

### SearchResult (検索結果)

```typescript
// packages/core/src/domain/entities/SearchResult.ts

export type SearchType = 'embedding' | 'fulltext' | 'string' | 'hybrid';

export interface SearchResultItem {
  document: Document;
  score: number;
  highlights: string[];
  searchType: SearchType;
}

export class SearchResult {
  constructor(
    public readonly items: SearchResultItem[],
    public readonly total: number,
    public readonly took: number, // ms
    public readonly maxScore: number,
  ) {}

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  getTopResult(): SearchResultItem | null {
    return this.items[0] || null;
  }
}
```

## データベーススキーマ

### PostgreSQL スキーマ

#### documents テーブル

```sql
CREATE TABLE documents (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(1000) NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  file_url VARCHAR(2048) NOT NULL,
  file_name VARCHAR(1000) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  extracted_text TEXT,
  embedding_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'processing',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT status_check CHECK (status IN ('processing', 'ready', 'error'))
);

-- インデックス
CREATE INDEX idx_documents_status ON documents(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_created_at ON documents(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX idx_documents_metadata ON documents USING GIN(metadata);
CREATE INDEX idx_documents_deleted_at ON documents(deleted_at);

-- 全文検索用（PostgreSQL tsvector）
ALTER TABLE documents ADD COLUMN search_vector tsvector;
CREATE INDEX idx_documents_search_vector ON documents USING GIN(search_vector);

-- トリガー: 更新日時の自動更新
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- トリガー: 検索ベクトルの自動更新
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector =
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.extracted_text, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_documents_search_vector
BEFORE INSERT OR UPDATE OF title, description, extracted_text ON documents
FOR EACH ROW
EXECUTE FUNCTION update_search_vector();
```

#### document_embeddings テーブル

```sql
-- pgvector 拡張を有効化
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE document_embeddings (
  id VARCHAR(255) PRIMARY KEY,
  document_id VARCHAR(255) NOT NULL,
  embedding vector(1536) NOT NULL, -- OpenAI text-embedding-3-small
  model VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_document FOREIGN KEY (document_id)
    REFERENCES documents(id) ON DELETE CASCADE
);

-- インデックス: コサイン類似度検索用（HNSW）
CREATE INDEX idx_embeddings_hnsw ON document_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- インデックス: IVFFlat（代替案）
-- CREATE INDEX idx_embeddings_ivfflat ON document_embeddings
-- USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);

CREATE UNIQUE INDEX idx_embeddings_document_id ON document_embeddings(document_id);
```

#### tags テーブル（正規化）

```sql
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  color VARCHAR(7), -- HEX color
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE document_tags (
  document_id VARCHAR(255) NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  PRIMARY KEY (document_id, tag_id),
  CONSTRAINT fk_document FOREIGN KEY (document_id)
    REFERENCES documents(id) ON DELETE CASCADE,
  CONSTRAINT fk_tag FOREIGN KEY (tag_id)
    REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX idx_document_tags_tag_id ON document_tags(tag_id);
```

#### processing_jobs テーブル（非同期ジョブ管理）

```sql
CREATE TABLE processing_jobs (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'embedding', 'extraction', 'batch_upload'
  status VARCHAR(50) NOT NULL DEFAULT 'queued',
  progress INTEGER DEFAULT 0,
  document_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT status_check CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  CONSTRAINT fk_document FOREIGN KEY (document_id)
    REFERENCES documents(id) ON DELETE SET NULL
);

CREATE INDEX idx_jobs_status ON processing_jobs(status);
CREATE INDEX idx_jobs_created_at ON processing_jobs(created_at DESC);
```

#### search_logs テーブル（検索ログ・分析用）

```sql
CREATE TABLE search_logs (
  id SERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  search_type VARCHAR(50) NOT NULL,
  filters JSONB,
  result_count INTEGER,
  took_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_search_logs_created_at ON search_logs(created_at DESC);
CREATE INDEX idx_search_logs_query ON search_logs USING gin(to_tsvector('english', query));
```

### DuckDB スキーマ（全文検索用）

```sql
-- documents_fts テーブル
CREATE TABLE documents_fts (
  id VARCHAR PRIMARY KEY,
  title VARCHAR NOT NULL,
  description VARCHAR,
  extracted_text VARCHAR,
  tags VARCHAR[], -- DuckDB supports arrays
  created_at TIMESTAMP NOT NULL
);

-- Full-Text Search インデックス（将来的に）
-- DuckDB 1.0+ では FTS extension を使用可能
INSTALL fts;
LOAD fts;

-- FTS インデックス作成
PRAGMA create_fts_index('documents_fts', 'id', 'title', 'description', 'extracted_text');
```

## リポジトリインターフェース

### IDocumentRepository

```typescript
// packages/core/src/domain/repositories/IDocumentRepository.ts

import { Document } from '../entities/Document';

export interface CreateDocumentInput {
  title: string;
  description?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface UpdateDocumentInput {
  title?: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  status?: DocumentStatus;
  extractedText?: string;
}

export interface ListDocumentsOptions {
  page: number;
  limit: number;
  sortBy: 'createdAt' | 'updatedAt' | 'title';
  order: 'asc' | 'desc';
  tags?: string[];
  status?: DocumentStatus;
}

export interface IDocumentRepository {
  // 基本CRUD
  create(input: CreateDocumentInput): Promise<Document>;
  findById(id: string): Promise<Document | null>;
  findMany(options: ListDocumentsOptions): Promise<{ documents: Document[]; total: number }>;
  update(id: string, input: UpdateDocumentInput): Promise<Document>;
  delete(id: string): Promise<void>; // 物理削除
  softDelete(id: string): Promise<void>; // 論理削除

  // カスタムクエリ
  findByTags(tags: string[]): Promise<Document[]>;
  findByStatus(status: DocumentStatus): Promise<Document[]>;
  searchByText(query: string): Promise<Document[]>;

  // 統計
  count(): Promise<number>;
  countByStatus(status: DocumentStatus): Promise<number>;
}
```

### IEmbeddingRepository

```typescript
// packages/core/src/domain/repositories/IEmbeddingRepository.ts

import { DocumentEmbedding } from '../entities/DocumentEmbedding';

export interface CreateEmbeddingInput {
  documentId: string;
  vector: number[];
  model: string;
}

export interface IEmbeddingRepository {
  create(input: CreateEmbeddingInput): Promise<DocumentEmbedding>;
  findByDocumentId(documentId: string): Promise<DocumentEmbedding | null>;
  delete(id: string): Promise<void>;

  // ベクトル検索
  findSimilar(
    vector: number[],
    limit: number,
    threshold?: number,
  ): Promise<Array<{ embedding: DocumentEmbedding; similarity: number }>>;
}
```

### ISearchRepository

```typescript
// packages/core/src/domain/repositories/ISearchRepository.ts

import { SearchResult, SearchType } from '../entities/SearchResult';

export interface SearchOptions {
  query: string;
  type: SearchType;
  filters?: {
    tags?: string[];
    dateFrom?: Date;
    dateTo?: Date;
  };
  limit: number;
  threshold?: number;
}

export interface ISearchRepository {
  search(options: SearchOptions): Promise<SearchResult>;
}
```

### IStorageAdapter

```typescript
// packages/core/src/domain/adapters/IStorageAdapter.ts

export interface UploadOptions {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  metadata?: Record<string, string>;
}

export interface IStorageAdapter {
  upload(options: UploadOptions): Promise<{ url: string; size: number }>;
  download(url: string): Promise<Buffer>;
  delete(url: string): Promise<void>;
  getDownloadUrl(url: string, expiresIn?: number): Promise<string>;
  exists(url: string): Promise<boolean>;
}
```

## リポジトリ実装

### PostgresDocumentRepository

```typescript
// packages/api/src/infrastructure/repositories/PostgresDocumentRepository.ts

import { IDocumentRepository } from '@dms/core/domain/repositories/IDocumentRepository';
import { Document } from '@dms/core/domain/entities/Document';
import { db } from '../database/client';
import { documents } from '../database/schema';
import { eq, desc, asc, and, inArray } from 'drizzle-orm';

export class PostgresDocumentRepository implements IDocumentRepository {
  async create(input: CreateDocumentInput): Promise<Document> {
    const id = generateId('doc');
    const now = new Date();

    const [row] = await db.insert(documents).values({
      id,
      title: input.title,
      description: input.description || null,
      tags: input.tags,
      metadata: input.metadata,
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      status: 'processing',
      createdAt: now,
      updatedAt: now,
    }).returning();

    return this.mapToEntity(row);
  }

  async findById(id: string): Promise<Document | null> {
    const [row] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), isNull(documents.deletedAt)))
      .limit(1);

    return row ? this.mapToEntity(row) : null;
  }

  async findMany(options: ListDocumentsOptions) {
    const offset = (options.page - 1) * options.limit;
    const orderFn = options.order === 'asc' ? asc : desc;
    const orderColumn = documents[options.sortBy];

    let query = db
      .select()
      .from(documents)
      .where(isNull(documents.deletedAt));

    // フィルタ適用
    if (options.tags && options.tags.length > 0) {
      // タグ配列のオーバーラップチェック
      query = query.where(sql`${documents.tags} && ${options.tags}`);
    }

    if (options.status) {
      query = query.where(eq(documents.status, options.status));
    }

    // 件数取得
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(query.as('filtered'));

    // データ取得
    const rows = await query
      .orderBy(orderFn(orderColumn))
      .limit(options.limit)
      .offset(offset);

    return {
      documents: rows.map((row) => this.mapToEntity(row)),
      total: count,
    };
  }

  async update(id: string, input: UpdateDocumentInput): Promise<Document> {
    const [row] = await db
      .update(documents)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, id))
      .returning();

    return this.mapToEntity(row);
  }

  async softDelete(id: string): Promise<void> {
    await db
      .update(documents)
      .set({ deletedAt: new Date() })
      .where(eq(documents.id, id));
  }

  private mapToEntity(row: any): Document {
    return new Document(
      row.id,
      row.title,
      row.description,
      row.tags,
      row.metadata,
      row.fileUrl,
      row.fileName,
      row.fileSize,
      row.mimeType,
      row.extractedText,
      row.embeddingId,
      row.status,
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }
}
```

### DuckDBSearchRepository

```typescript
// packages/api/src/infrastructure/repositories/DuckDBSearchRepository.ts

import { ISearchRepository, SearchOptions } from '@dms/core/domain/repositories/ISearchRepository';
import { SearchResult } from '@dms/core/domain/entities/SearchResult';
import { Database } from 'duckdb';

export class DuckDBSearchRepository implements ISearchRepository {
  constructor(private db: Database) {}

  async search(options: SearchOptions): Promise<SearchResult> {
    const startTime = Date.now();

    // Full-Text Search クエリ
    const query = `
      SELECT
        id,
        title,
        description,
        fts_main_documents_fts.match_bm25(id, ?) as score,
        snippet(documents_fts, 2, '<mark>', '</mark>', '...', 64) as highlight
      FROM documents_fts
      WHERE score IS NOT NULL
      ORDER BY score DESC
      LIMIT ?
    `;

    const results = await this.db.all(query, [options.query, options.limit]);

    const took = Date.now() - startTime;

    // Document エンティティに変換（詳細はPostgreSQLから取得）
    // ...

    return new SearchResult(items, results.length, took, maxScore);
  }
}
```

### FileSystemStorageAdapter & S3StorageAdapter

```typescript
// packages/api/src/infrastructure/adapters/FileSystemStorageAdapter.ts

export class FileSystemStorageAdapter implements IStorageAdapter {
  constructor(private basePath: string) {}

  async upload(options: UploadOptions): Promise<{ url: string; size: number }> {
    const filePath = path.join(this.basePath, generateFileName(options.fileName));
    await fs.promises.writeFile(filePath, options.buffer);
    return {
      url: filePath,
      size: options.buffer.length,
    };
  }

  async download(url: string): Promise<Buffer> {
    return fs.promises.readFile(url);
  }

  async getDownloadUrl(url: string): Promise<string> {
    // ローカルの場合は直接パスを返す（または /files エンドポイント経由）
    return `/files/${path.basename(url)}`;
  }
}

// packages/api/src/infrastructure/adapters/S3StorageAdapter.ts

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3StorageAdapter implements IStorageAdapter {
  constructor(
    private s3Client: S3Client,
    private bucket: string,
  ) {}

  async upload(options: UploadOptions): Promise<{ url: string; size: number }> {
    const key = generateS3Key(options.fileName);

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: options.buffer,
        ContentType: options.mimeType,
        Metadata: options.metadata,
      }),
    );

    return {
      url: `s3://${this.bucket}/${key}`,
      size: options.buffer.length,
    };
  }

  async getDownloadUrl(url: string, expiresIn = 3600): Promise<string> {
    const key = this.extractKeyFromUrl(url);
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }
}
```

## DIコンテナ設定

```typescript
// packages/api/src/infrastructure/di/container.ts

import { IDocumentRepository } from '@dms/core/domain/repositories/IDocumentRepository';
import { PostgresDocumentRepository } from '../repositories/PostgresDocumentRepository';
import { S3StorageAdapter } from '../adapters/S3StorageAdapter';

export class Container {
  private static instance: Container;
  private repositories: Map<string, any> = new Map();

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  registerDocumentRepository(repo: IDocumentRepository) {
    this.repositories.set('IDocumentRepository', repo);
  }

  getDocumentRepository(): IDocumentRepository {
    return this.repositories.get('IDocumentRepository');
  }

  // 環境変数に基づいて適切な実装を登録
  static bootstrap() {
    const container = Container.getInstance();

    const documentRepo = new PostgresDocumentRepository();
    container.registerDocumentRepository(documentRepo);

    const storageAdapter =
      process.env.STORAGE_TYPE === 's3'
        ? new S3StorageAdapter(s3Client, bucket)
        : new FileSystemStorageAdapter(basePath);
    container.registerStorageAdapter(storageAdapter);
  }
}
```

## まとめ

この設計により:

1. ✅ **ストレージの完全な抽象化**: Repository Pattern + Adapter Pattern
2. ✅ **DBの抽象化**: インターフェース駆動開発
3. ✅ **テスタビリティ**: モックリポジトリで単体テスト可能
4. ✅ **拡張性**: 新しいストレージ/DB実装を簡単に追加
5. ✅ **保守性**: ドメインロジックとインフラを分離
