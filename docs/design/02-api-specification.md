# API仕様設計

## 概要

ドキュメント管理システムのRESTful API仕様を定義します。

## 基本情報

- **ベースURL**: `/api/v1`
- **認証方式**: JWT Bearer Token
- **レスポンス形式**: JSON
- **文字コード**: UTF-8

## 共通仕様

### リクエストヘッダー

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### 共通レスポンス形式

#### 成功時

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-11-29T10:00:00Z",
    "requestId": "uuid"
  }
}
```

#### エラー時

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2025-11-29T10:00:00Z",
    "requestId": "uuid"
  }
}
```

### エラーコード

| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| `UNAUTHORIZED` | 401 | 認証エラー |
| `FORBIDDEN` | 403 | 権限不足 |
| `NOT_FOUND` | 404 | リソースが見つからない |
| `VALIDATION_ERROR` | 400 | 入力値エラー |
| `CONFLICT` | 409 | リソースの競合 |
| `INTERNAL_ERROR` | 500 | サーバーエラー |
| `SERVICE_UNAVAILABLE` | 503 | サービス利用不可 |

## エンドポイント一覧

### 1. ドキュメント管理

#### 1.1 ドキュメント作成

```
POST /api/v1/documents
```

**リクエストボディ**:

```json
{
  "title": "ドキュメントタイトル",
  "description": "説明（オプション）",
  "tags": ["tag1", "tag2"],
  "metadata": {
    "author": "作成者",
    "category": "カテゴリ"
  },
  "file": "base64エンコードされたファイル or ファイルパス"
}
```

**レスポンス** (201 Created):

```json
{
  "success": true,
  "data": {
    "id": "doc_abc123",
    "title": "ドキュメントタイトル",
    "description": "説明",
    "tags": ["tag1", "tag2"],
    "metadata": { ... },
    "fileUrl": "https://storage/path/to/file",
    "createdAt": "2025-11-29T10:00:00Z",
    "updatedAt": "2025-11-29T10:00:00Z",
    "status": "processing" // processing | ready | error
  }
}
```

#### 1.2 ドキュメント取得

```
GET /api/v1/documents/:id
```

**レスポンス** (200 OK):

```json
{
  "success": true,
  "data": {
    "id": "doc_abc123",
    "title": "ドキュメントタイトル",
    "description": "説明",
    "tags": ["tag1", "tag2"],
    "metadata": { ... },
    "fileUrl": "https://storage/path/to/file",
    "downloadUrl": "https://storage/presigned-url",
    "extractedText": "抽出されたテキスト（オプション）",
    "embedding": null, // 通常は返さない（大きいため）
    "createdAt": "2025-11-29T10:00:00Z",
    "updatedAt": "2025-11-29T10:00:00Z",
    "status": "ready"
  }
}
```

#### 1.3 ドキュメント一覧取得

```
GET /api/v1/documents?page=1&limit=20&sort=createdAt&order=desc&tags=tag1,tag2
```

**クエリパラメータ**:

| パラメータ | 型 | デフォルト | 説明 |
|-----------|---|-----------|------|
| `page` | number | 1 | ページ番号 |
| `limit` | number | 20 | 1ページあたりの件数（最大100） |
| `sort` | string | createdAt | ソート項目（createdAt, updatedAt, title） |
| `order` | string | desc | ソート順（asc, desc） |
| `tags` | string | - | タグフィルタ（カンマ区切り） |
| `status` | string | - | ステータスフィルタ |

**レスポンス** (200 OK):

```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "doc_abc123",
        "title": "ドキュメントタイトル",
        "description": "説明",
        "tags": ["tag1"],
        "createdAt": "2025-11-29T10:00:00Z",
        "status": "ready"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

#### 1.4 ドキュメント更新

```
PATCH /api/v1/documents/:id
```

**リクエストボディ**:

```json
{
  "title": "新しいタイトル",
  "description": "新しい説明",
  "tags": ["tag1", "tag3"],
  "metadata": { ... }
}
```

**レスポンス** (200 OK): ドキュメント取得と同じ形式

#### 1.5 ドキュメント削除

```
DELETE /api/v1/documents/:id
```

**レスポンス** (204 No Content)

### 2. 検索

#### 2.1 統合検索

```
POST /api/v1/search
```

**リクエストボディ**:

```json
{
  "query": "検索クエリ",
  "type": "hybrid", // hybrid | embedding | fulltext | string
  "filters": {
    "tags": ["tag1"],
    "dateFrom": "2025-01-01",
    "dateTo": "2025-12-31"
  },
  "options": {
    "limit": 10,
    "threshold": 0.7, // Embedding検索の類似度閾値
    "includeExtractedText": false
  }
}
```

**検索タイプ**:

- `hybrid`: 複数の検索手法を組み合わせてランキング
- `embedding`: Embeddingベクトル検索
- `fulltext`: DuckDB全文検索
- `string`: 文字列部分一致検索

**レスポンス** (200 OK):

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "document": {
          "id": "doc_abc123",
          "title": "ドキュメントタイトル",
          "description": "説明",
          "tags": ["tag1"],
          "createdAt": "2025-11-29T10:00:00Z"
        },
        "score": 0.95, // 関連度スコア
        "highlights": ["マッチした<mark>キーワード</mark>を含むスニペット"],
        "searchType": "embedding"
      }
    ],
    "meta": {
      "total": 42,
      "took": 123, // ms
      "maxScore": 0.95
    }
  }
}
```

#### 2.2 LLM対話型検索

```
POST /api/v1/search/chat
```

**リクエストボディ**:

```json
{
  "message": "ユーザーの質問",
  "conversationId": "conv_xyz789", // オプション: 継続会話用
  "options": {
    "model": "gpt-4", // gpt-4 | gpt-3.5-turbo
    "maxTokens": 500,
    "temperature": 0.7,
    "topK": 5 // 参照するドキュメント数
  }
}
```

**レスポンス** (200 OK):

```json
{
  "success": true,
  "data": {
    "conversationId": "conv_xyz789",
    "message": {
      "role": "assistant",
      "content": "LLMの回答",
      "timestamp": "2025-11-29T10:00:00Z"
    },
    "sources": [
      {
        "documentId": "doc_abc123",
        "title": "参照ドキュメント",
        "relevance": 0.92
      }
    ],
    "usage": {
      "promptTokens": 1000,
      "completionTokens": 500,
      "totalTokens": 1500
    }
  }
}
```

#### 2.3 ストリーミング対話検索

```
POST /api/v1/search/chat/stream
```

**レスポンス**: Server-Sent Events (SSE)

```
data: {"type":"start","conversationId":"conv_xyz789"}

data: {"type":"token","content":"LLM"}

data: {"type":"token","content":"の"}

data: {"type":"token","content":"回答"}

data: {"type":"sources","sources":[{"documentId":"doc_abc123"}]}

data: {"type":"done","usage":{"totalTokens":1500}}
```

### 3. Embedding管理

#### 3.1 Embedding生成（手動）

```
POST /api/v1/documents/:id/embedding
```

**レスポンス** (202 Accepted):

```json
{
  "success": true,
  "data": {
    "jobId": "job_embedding_123",
    "status": "queued"
  }
}
```

#### 3.2 Embeddingステータス確認

```
GET /api/v1/jobs/:jobId
```

**レスポンス** (200 OK):

```json
{
  "success": true,
  "data": {
    "jobId": "job_embedding_123",
    "type": "embedding",
    "status": "completed", // queued | processing | completed | failed
    "progress": 100,
    "result": {
      "documentId": "doc_abc123",
      "vectorDimensions": 1536
    },
    "createdAt": "2025-11-29T10:00:00Z",
    "completedAt": "2025-11-29T10:01:00Z"
  }
}
```

### 4. タグ管理

#### 4.1 タグ一覧取得

```
GET /api/v1/tags
```

**レスポンス** (200 OK):

```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "name": "tag1",
        "count": 42,
        "color": "#FF5733"
      }
    ]
  }
}
```

### 5. 統計・分析

#### 5.1 ダッシュボード統計

```
GET /api/v1/stats/dashboard
```

**レスポンス** (200 OK):

```json
{
  "success": true,
  "data": {
    "totalDocuments": 1000,
    "documentsThisMonth": 50,
    "totalStorage": 10737418240, // bytes
    "topTags": [
      {"name": "tag1", "count": 100}
    ],
    "recentSearches": [
      {"query": "検索クエリ", "count": 10, "lastSearched": "2025-11-29T10:00:00Z"}
    ]
  }
}
```

## バッチ操作

### 一括ドキュメント作成

```
POST /api/v1/documents/batch
```

**リクエストボディ**:

```json
{
  "documents": [
    {
      "title": "ドキュメント1",
      "file": "..."
    },
    {
      "title": "ドキュメント2",
      "file": "..."
    }
  ]
}
```

**レスポンス** (202 Accepted):

```json
{
  "success": true,
  "data": {
    "batchId": "batch_abc123",
    "total": 2,
    "status": "processing"
  }
}
```

## WebSocket API（リアルタイム通知）

### 接続

```
WS /api/v1/ws?token=<JWT_TOKEN>
```

### メッセージ形式

#### ドキュメント処理完了通知

```json
{
  "type": "document.ready",
  "data": {
    "documentId": "doc_abc123",
    "title": "ドキュメントタイトル"
  }
}
```

#### Embedding生成完了通知

```json
{
  "type": "embedding.completed",
  "data": {
    "documentId": "doc_abc123",
    "jobId": "job_embedding_123"
  }
}
```

## レート制限

- **一般エンドポイント**: 100リクエスト/分
- **検索エンドポイント**: 30リクエスト/分
- **LLM検索**: 10リクエスト/分
- **アップロード**: 20リクエスト/時

レート制限超過時は `429 Too Many Requests` を返します。

## CORS設定

開発環境: `*`（全許可）
本番環境: 許可されたオリジンのみ

## セキュリティ

- すべてのエンドポイントで認証必須（一部の公開エンドポイントを除く）
- ファイルアップロード: 最大サイズ 100MB
- 入力値検証: Zodによる厳密なバリデーション
- SQLインジェクション対策: ORMのプリペアドステートメント使用
- XSS対策: レスポンスヘッダーに適切な設定
