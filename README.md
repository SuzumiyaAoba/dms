# DMS - Document Management System

A modern, scalable document management system with AI-powered search capabilities.

## Features

- **Document Management**: Upload, store, and manage documents of various formats (PDF, Word, Excel, etc.)
- **Storage Abstraction**:
  - Pluggable storage adapters (FileSystem / S3-compatible)
  - Date-based file organization (YYYY/MM/DD)
  - Separation of document metadata and file storage
- **Repository Pattern**:
  - Clean separation between domain logic and data access
  - Currently using in-memory repository (PostgreSQL implementation planned)
- **OpenAPI Documentation**: Auto-generated API documentation with Zod schema validation
- **Type-Safe Development**: Full TypeScript support with strict type checking
- **Dependency Injection**: Effect Context and Layer for clean dependency management

### Planned Features
- 🤖 LLM Embedding Search: Semantic search using vector similarity
- 💬 LLM Chat Search: Conversational search with RAG (Retrieval-Augmented Generation)
- 📝 Full-Text Search: Fast full-text search powered by DuckDB
- 🔍 String Search: Traditional keyword-based search
- 🔀 Hybrid Search: Combined ranking from multiple strategies
- ⚡ Async Processing: Background text extraction and embedding generation

## Architecture

DMS follows clean architecture principles with dependency inversion:

- **Monorepo**: pnpm workspaces with 3 packages
- **Frontend**: Next.js 14+ with App Router (React 19)
- **API**: Hono (lightweight, fast web framework)
- **Shared Core**: Domain logic, entity definitions, and adapter interfaces
- **Dependency Injection**: Effect Context and Layer (migrated from tsyringe)
- **Path Aliases**: Clean imports using `@/` prefix

### Technology Stack

**Backend:**
- Hono 4.x for API server
- Effect for functional programming and DI
- Zod for schema validation and type inference
- Pino for structured logging
- Vitest for testing with full coverage

**Planned Integrations:**
- PostgreSQL + pgvector for embeddings
- DuckDB for full-text search
- Redis for caching and job queue
- OpenAI API for embeddings and chat

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

### Future Prerequisites (for search features)
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

See `packages/api/.env.example` for available environment variables.

Current configuration:
- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: 0.0.0.0)
- `STORAGE_TYPE`: Storage backend (`filesystem` or `s3`, default: filesystem)
- `STORAGE_PATH`: Base path for file storage (default: `./storage/documents`)

Future configuration (for search features):
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `OPENAI_API_KEY`: OpenAI API key for embeddings and chat

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

# Testing
pnpm --filter @dms/api test              # Run tests in watch mode
pnpm --filter @dms/api test:run          # Run tests once
pnpm --filter @dms/api test:coverage     # Run tests with coverage
pnpm --filter @dms/api test:ui           # Run tests with UI

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
- **Hono 4.x**: Lightweight web framework with OpenAPI support
- **Effect**: Functional programming and dependency injection
- **Zod**: Schema validation and type inference
- **Pino**: Structured logging
- **Vitest**: Unit testing framework
- **TypeScript 5.9+**: Type safety with strict mode

### Frontend
- **Next.js 16**: React framework with App Router
- **React 19**: UI library
- **TypeScript 5.9+**: Type safety

### DevOps & Tools
- **pnpm**: Fast, disk space efficient package manager
- **Biome**: Fast linter and formatter (replaces ESLint + Prettier)
- **Husky**: Git hooks for pre-commit checks
- **lint-staged**: Run linters on staged files
- **tsup**: Fast TypeScript bundler for libraries

### Planned Technologies
- **Drizzle ORM**: Type-safe SQL ORM
- **PostgreSQL + pgvector**: Vector similarity search
- **DuckDB**: Full-text search
- **Redis**: Caching and job queue
- **Docker**: Containerization
- **GitHub Actions**: CI/CD

## Design Principles

1. **Clean Architecture**: Clear separation of concerns with layered architecture
   - Domain layer defines interfaces, infrastructure implements them
   - Business logic independent of frameworks and external dependencies

2. **Storage Abstraction**: Pluggable storage adapters
   - `IStorageAdapter` interface for file storage
   - Current: FileSystem with date-based organization
   - Future: S3-compatible object storage

3. **Repository Pattern**: DB-agnostic data access
   - `IDocumentRepository` interface for metadata
   - Current: In-memory implementation
   - Future: PostgreSQL with Drizzle ORM

4. **Dependency Injection**: Effect Context and Layer
   - Type-safe dependency management
   - Easy testing with mock implementations
   - Clear dependency graph

5. **OpenAPI-First**: All endpoints documented with Zod schemas
   - Auto-generated API documentation
   - Type-safe request/response validation
   - Single source of truth for API contracts

## Roadmap

### Completed
- [x] Phase 1: Project setup and architecture design
  - [x] Monorepo structure with pnpm workspaces
  - [x] TypeScript configuration with path aliases
  - [x] Code quality tools (Biome, Husky, lint-staged)

- [x] Phase 2: Core domain and infrastructure
  - [x] Storage adapter abstraction (`IStorageAdapter`)
  - [x] FileSystem storage implementation with date-based organization
  - [x] Repository pattern (`IDocumentRepository`)
  - [x] In-memory repository implementation
  - [x] Effect-based dependency injection (migrated from tsyringe)

- [x] Phase 3: API foundation
  - [x] Hono server setup with OpenAPI support
  - [x] Document CRUD endpoints with file upload
  - [x] Middleware (CORS, error handling, logging)
  - [x] Health check endpoints
  - [x] Comprehensive test suite with Vitest

### In Progress
- [ ] Phase 4: Database integration
  - [ ] PostgreSQL setup with Drizzle ORM
  - [ ] Migrate from in-memory to PostgreSQL repository
  - [ ] Database migrations
  - [ ] pgvector extension setup

### Planned
- [ ] Phase 5: Search features
  - [ ] Embedding generation with OpenAI
  - [ ] Vector similarity search with pgvector
  - [ ] Full-text search with DuckDB
  - [ ] Hybrid search strategies
  - [ ] LLM chat search with RAG

- [ ] Phase 6: Frontend implementation
  - [ ] Document upload interface
  - [ ] Document listing and management
  - [ ] Search interface
  - [ ] Authentication and authorization

- [ ] Phase 7: Production readiness
  - [ ] Docker containerization
  - [ ] CI/CD pipeline
  - [ ] Performance optimization
  - [ ] Security hardening
  - [ ] Deployment documentation

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](./LICENSE) file for details.

## Acknowledgments

- Architecture inspired by clean architecture and domain-driven design principles
- Built with modern TypeScript ecosystem tools
- Effect ecosystem for functional programming and dependency injection
