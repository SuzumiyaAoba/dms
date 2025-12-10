-- Document Management System - LibSQL Schema
-- This schema defines the document metadata storage structure

-- Documents table
-- Stores document metadata and references to file storage
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT NOT NULL DEFAULT '[]', -- JSON array of tags
  metadata TEXT NOT NULL DEFAULT '{}', -- JSON object for custom metadata
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  extracted_text TEXT,
  embedding_id TEXT,
  status TEXT NOT NULL DEFAULT 'processing' CHECK(status IN ('processing', 'ready', 'error')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at ON documents(deleted_at);
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at_created_at ON documents(deleted_at, created_at DESC);

-- Full-text search index (if needed later)
-- CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
--   title, description, extracted_text, content='documents', content_rowid='rowid'
-- );
