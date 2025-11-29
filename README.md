# DMS - Document Management System

A modern, scalable document management system with AI-powered search capabilities.

## Features

- **Document Management**: Upload, store, and manage documents of various formats (PDF, Word, Excel, etc.)
- **Multiple Search Methods**:
  - 🤖 LLM Embedding Search: Semantic search using vector similarity
  - 💬 LLM Chat Search: Conversational search with RAG (Retrieval-Augmented Generation)
  - 📝 Full-Text Search: Fast full-text search powered by DuckDB
  - 🔍 String Search: Traditional keyword-based search
  - 🔀 Hybrid Search: Combined ranking from multiple strategies
- **Storage Abstraction**: Supports both local file system and S3-compatible storage
- **Database Abstraction**: Repository pattern allows easy database switching
- **Async Processing**: Background text extraction and embedding generation

## Architecture

- **Monorepo**: pnpm workspaces with 3 packages
- **Frontend**: Next.js 14 with App Router
- **API**: Hono (lightweight, fast web framework)
- **Shared Core**: Domain logic and repository interfaces
- **Database**: PostgreSQL + pgvector for embeddings
- **Full-Text Search**: DuckDB
- **Cache**: Redis
- **LLM**: OpenAI API (embeddings and chat)

For detailed architecture information, see [Architecture Overview](./docs/design/00-architecture-overview.md).

## Project Structure

```
dms/
├── packages/
│   ├── core/          # Shared domain logic and interfaces
│   ├── api/           # Hono API server
│   └── web/           # Next.js frontend
├── docs/
│   └── design/        # Design documentation
└── scripts/           # Utility scripts
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL 15+ (with pgvector extension)
- DuckDB
- Redis

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp packages/api/.env.example packages/api/.env
# Edit .env with your configuration

# Start development servers
pnpm --filter @dms/api dev     # API server
pnpm --filter @dms/web dev     # Web frontend
```

### Environment Variables

See `packages/api/.env.example` for required environment variables.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `OPENAI_API_KEY`: OpenAI API key for embeddings and chat
- `STORAGE_TYPE`: `filesystem` or `s3`

## Development

### Scripts

```bash
# Development
pnpm --filter @dms/api dev      # Start API server
pnpm --filter @dms/web dev      # Start web frontend
pnpm --filter @dms/core dev     # Watch and build core package

# Build
pnpm --filter @dms/api build    # Build API
pnpm --filter @dms/web build    # Build web
pnpm --filter @dms/core build   # Build core

# Linting & Formatting
pnpm format                      # Format all code with Biome
pnpm lint                        # Lint all code
pnpm check                       # Format and lint

# Type Checking
pnpm --filter @dms/api exec tsc --noEmit
pnpm --filter @dms/web exec tsc --noEmit
```

### Code Quality

This project uses:
- **Biome**: Fast linter and formatter
- **Husky**: Git hooks
- **lint-staged**: Pre-commit file processing
- **TypeScript**: Type safety

Pre-commit hooks automatically format and lint staged files.

## Documentation

- [Design Documents](./docs/design/README.md)
  - [Architecture Overview](./docs/design/00-architecture-overview.md)
  - [Technology Selection](./docs/design/01-technology-selection.md)
  - [API Specification](./docs/design/02-api-specification.md)
  - [Data Models & Repositories](./docs/design/03-data-models-and-repositories.md)

## API Endpoints

Base URL: `http://localhost:3000/api/v1`

### Documents
- `POST /documents` - Upload document
- `GET /documents/:id` - Get document details
- `GET /documents` - List documents (with pagination)
- `PATCH /documents/:id` - Update document
- `DELETE /documents/:id` - Delete document

### Search
- `POST /search` - Unified search endpoint
- `POST /search/chat` - LLM chat search
- `POST /search/chat/stream` - Streaming chat search

### Health
- `GET /health` - Health check
- `GET /health/ready` - Readiness check

For complete API documentation, see [API Specification](./docs/design/02-api-specification.md).

## Technology Stack

### Backend
- **Hono**: Web framework
- **Drizzle ORM**: Type-safe SQL ORM
- **PostgreSQL**: Primary database
- **pgvector**: Vector similarity search
- **DuckDB**: Full-text search
- **Redis**: Caching and job queue
- **Pino**: Structured logging
- **Zod**: Schema validation

### Frontend
- **Next.js 14**: React framework with App Router
- **React**: UI library
- **TypeScript**: Type safety

### DevOps
- **Docker**: Containerization
- **GitHub Actions**: CI/CD
- **pnpm**: Package manager

## Design Principles

1. **Storage Abstraction**: Hide storage implementation (file system vs S3) behind interface
2. **Database Abstraction**: Repository pattern for DB-agnostic data access
3. **Search Strategy Abstraction**: Unified interface for multiple search methods
4. **Dependency Inversion**: Domain layer defines interfaces, infrastructure implements

## Roadmap

- [x] Phase 1: Foundation (DB schema, domain entities, repositories)
- [x] Phase 2: API foundation (Hono setup, middleware, error handling)
- [ ] Phase 3: Basic document CRUD
- [ ] Phase 4: Embedding search
- [ ] Phase 5: Full-text search
- [ ] Phase 6: LLM chat search
- [ ] Phase 7: Frontend implementation
- [ ] Phase 8: Optimization and deployment

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC

## Acknowledgments

- Design inspired by clean architecture and domain-driven design principles
- Built with modern TypeScript ecosystem tools
