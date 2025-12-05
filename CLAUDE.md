# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DMS (Document Management System) is a modern document management system with AI-powered search capabilities built as a pnpm monorepo with three packages:
- **@dms/core**: Shared domain logic and repository interfaces
- **@dms/api**: Hono-based API server
- **@dms/web**: Next.js 14 frontend with App Router

## Essential Commands

### Development
```bash
# Install dependencies
pnpm install

# Start development servers
pnpm --filter @dms/api dev     # API server (http://localhost:3000)
pnpm --filter @dms/web dev      # Web frontend (http://localhost:3001)
pnpm --filter @dms/core dev     # Watch and build core package
```

### Testing
```bash
# Run tests
pnpm --filter @dms/api test              # Interactive mode
pnpm --filter @dms/api test:run          # Run once
pnpm --filter @dms/api test:coverage     # With coverage report
pnpm --filter @dms/api test:ui           # UI mode
```

### Build & Type Checking
```bash
# Build packages
pnpm --filter @dms/core build
pnpm --filter @dms/api build
pnpm --filter @dms/web build

# Type checking
pnpm --filter @dms/api exec tsc --noEmit
pnpm --filter @dms/web exec tsc --noEmit
```

### Code Quality
```bash
# Format and lint (Biome)
pnpm format           # Format all code
pnpm lint             # Lint all code
pnpm check            # Format and lint together

# Pre-commit hooks run automatically via Husky

# Feature-Sliced Design validation (Web package)
pnpm --filter @dms/web steiger    # Check FSD architecture
```

## Architecture Overview

### Layered Architecture

The system follows clean architecture principles with dependency inversion:

```
Frontend (Next.js) → API Routes (Hono) → Use Cases → Domain Layer ← Infrastructure
```

1. **Presentation Layer** (`packages/api/src/routes/`)
   - HTTP request handling with Hono
   - OpenAPI documentation via @hono/zod-openapi
   - Middleware: CORS, error handling, logging

2. **Application Layer** (`packages/api/src/application/use-cases/`)
   - Business logic orchestration
   - Coordinates multiple repositories
   - Not yet implemented in codebase

3. **Domain Layer** (`packages/core/src/domain/`)
   - Pure business logic and rules
   - Entity definitions
   - Repository interfaces
   - Storage adapter interfaces
   - **Critical**: Domain layer defines interfaces, infrastructure implements them

4. **Infrastructure Layer** (`packages/api/src/infrastructure/`)
   - Database implementations (PostgreSQL + Drizzle ORM)
   - External service integrations (OpenAI, Redis, S3)
   - Repository implementations
   - Storage adapters (FileSystem / S3)

### Storage Architecture

The system cleanly separates **document metadata** from **document files**:

**Document Metadata Storage** (Repository Pattern):
- **Interface**: `IDocumentRepository` (packages/api/src/repositories/DocumentRepository.ts)
- **Current implementation**: `InMemoryDocumentRepository` (temporary, for development)
- **Future**: Will be replaced by `PostgresDocumentRepository` using Drizzle ORM
- Stores: title, description, tags, metadata, status, file references (fileUrl, fileName, fileSize, mimeType)

**Document File Storage** (Adapter Pattern):
- **Interface**: `IStorageAdapter` (@dms/core/domain/adapters/IStorageAdapter.ts)
- **Implementations**:
  - `FileSystemStorageAdapter`: Local file system with date-based organization (packages/api/src/infrastructure/adapters/)
  - `S3StorageAdapter`: S3-compatible object storage (planned)
- Stores: Actual document files (PDF, Word, Excel, etc.)
- Files organized in: `YYYY/MM/DD/` subdirectories with unique IDs

**Storage Service** (packages/api/src/config/storage.ts):
- Singleton service that holds both storage adapter and document repository
- Initialized at server startup
- Configured via environment variables (STORAGE_TYPE, STORAGE_PATH)

### Current Implementation Status

The project is under active development. Current state:
- ✅ API foundation: Hono setup, middleware, error handling
- ✅ Document CRUD endpoints with OpenAPI docs
- ✅ Storage abstraction: IStorageAdapter interface in @dms/core
- ✅ File storage: FileSystemStorageAdapter with date-based organization
- ✅ Repository pattern: IDocumentRepository with in-memory implementation
- ✅ Document types: Full metadata schema (title, description, tags, file info, status)
- ✅ Storage Service: Singleton for managing storage and repository
- ✅ Testing setup with Vitest (all tests passing)
- ❌ Database (PostgreSQL + pgvector) not yet implemented
- ❌ Search functionality (embedding, full-text, LLM chat) not implemented
- ❌ Frontend implementation pending

## Key Design Patterns

### 1. Dependency Injection (tsyringe)
The project uses tsyringe for dependency injection with the following benefits:
- **Automatic dependency resolution**: Services and repositories are automatically injected
- **Type-safe**: Full TypeScript support with decorators
- **Testability**: Easy to mock dependencies in tests
- **Configuration**: All DI setup in `packages/api/src/config/container.ts`

Key concepts:
- Use `@injectable()` decorator on services
- Use `@inject(TOKEN)` for constructor injection
- Resolve dependencies with `container.resolve(Service)`
- Register dependencies in `setupContainer()` function

### 2. Repository Pattern
Domain layer defines repository interfaces, infrastructure layer implements them. This enables:
- Database-agnostic domain logic
- Easy mocking for tests
- Swappable storage backends

### 3. Service Layer
Business logic is encapsulated in service classes:
- `DocumentService`: Coordinates document operations between storage and repository
- Services are registered in DI container
- Routes resolve services via `container.resolve()`

### 4. Dependency Inversion
Higher-level modules (domain) define interfaces, lower-level modules (infrastructure) implement them.

### 5. OpenAPI-First API Design
- All endpoints documented with `@hono/zod-openapi`
- Schema validation with Zod
- Auto-generated API documentation at `/doc`

### 6. Feature-Sliced Design (FSD) - Web Package
The frontend follows Feature-Sliced Design architecture for better scalability and maintainability.

**Directory Structure**:
```
packages/web/src/
├── app/                    # Next.js App Router (pages, layouts)
├── entities/               # Business entities
│   └── document/
│       ├── ui/            # Document-related UI components
│       └── index.ts       # Public API
├── features/              # User interactions/features
│   └── document-delete/
│       ├── ui/            # Feature-specific UI
│       └── index.ts       # Public API
├── shared/                # Shared resources
│   ├── api/              # API clients (client & server)
│   ├── model/            # Type definitions and schemas
│   └── ui/               # Shared UI components
└── widgets/               # Composite UI blocks (future)
```

**FSD Principles**:
1. **Layers** (top to bottom dependency):
   - `app` → Application initialization (Next.js pages/layouts)
   - `features` → User interactions (delete, edit, create)
   - `entities` → Business entities (Document, User)
   - `shared` → Shared code (API, UI, utilities)

2. **Public API** (`index.ts`):
   - Every layer/slice/segment exports through `index.ts`
   - Import only from public APIs: `@/entities/document`, `@/shared/api`
   - NEVER import internal files: `@/entities/document/ui/DocumentList` ❌

3. **Dependency Rules**:
   - Higher layers can import from lower layers only
   - Same layer: no cross-imports between slices
   - Validated automatically with Steiger

**Example Usage**:
```typescript
// ✅ CORRECT: Import from public API
import { DocumentList } from '@/entities/document';
import { apiClient } from '@/shared/api';
import { Pagination } from '@/shared/ui';

// ❌ WRONG: Direct import from internal structure
import { DocumentList } from '@/entities/document/ui/DocumentList';
```

**Validation**:
Run `pnpm --filter @dms/web steiger` to validate FSD structure.

## Code Style & Conventions

### Formatting (Biome)
- Indent: 2 spaces
- Quotes: Single quotes
- Line width: 100 characters
- Trailing commas: Always
- Semicolons: Always
- Arrow parens: Always

### Type Safety: Parse, Don't Validate

**CRITICAL**: Follow "Parse, don't validate" principle for all external data.

- **NEVER use type assertions (`as`, `as unknown as`)** for external data
- **ALWAYS use Zod schemas (v4+)** to parse and validate data from:
  - API responses
  - User input
  - External services
  - Database queries
  - File uploads

**Zod v4 Key Changes**:
- `z.record()` now requires two arguments: `z.record(z.string(), z.unknown())`
- `.datetime()` validation for ISO 8601 strings works the same way
- Better TypeScript inference and error messages

```typescript
// ❌ BAD: Type assertion without validation
const data = await response.json() as MyType;

// ✅ GOOD: Parse with Zod schema
const MySchema = z.object({ ... });
const data = MySchema.parse(await response.json());
```

**Benefits**:
- Runtime validation catches invalid data
- Type safety guaranteed by parser
- Self-documenting schemas
- Better error messages

**Example Implementation**:
```typescript
import { z } from 'zod';

// Define schema
const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: DocumentSchema,
});

// Parse API response
const response = await fetch(url);
const parsed = ApiResponseSchema.parse(await response.json());
// TypeScript now knows `parsed` is valid and typed correctly
```

### Error Handling
Use custom error classes from `packages/api/src/utils/errors.ts`:
- `ValidationError`: For invalid input (400)
- `NotFoundError`: For missing resources (404)
- `ConflictError`: For conflicts (409)
- `UnauthorizedError`: For auth failures (401)
- `InternalServerError`: For unexpected errors (500)

Example:
```typescript
if (!document) {
  throw new NotFoundError('Document not found');
}
```

### Logging
Use the Pino logger from `packages/api/src/utils/logger.ts`:
```typescript
import { logger } from '../utils/logger';

logger.info({ documentId }, 'Document created');
logger.error({ error }, 'Failed to create document');
```

### Response Utilities
Use standardized responses from `packages/api/src/utils/response.ts`:
```typescript
import { success, error, created } from '../utils/response';

return success(c, data);              // 200
return created(c, data);              // 201
return error(c, 404, 'Not found');    // 4xx/5xx
```

## Testing Guidelines

### Test Structure
- Test files: `*.test.ts` alongside source files
- Use Vitest with globals enabled
- Coverage configured with v8 provider

### Writing Tests
```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('FeatureName', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something', () => {
    // Test
  });
});
```

### Running Specific Tests
```bash
# Run specific file
pnpm --filter @dms/api test src/routes/documents.test.ts

# Run with pattern
pnpm --filter @dms/api test -- documents
```

## Project Structure Notes

### Core Package (`@dms/core`)
- Built with tsup for dual CJS/ESM output
- Exports via `src/index.ts`
- Currently minimal - most domain logic will live here

### API Package (`@dms/api`)
- Entry point: `src/index.ts` → `src/app.ts`
- Routes registered in `src/routes/index.ts`
- Environment variables loaded from `.env` via dotenv

### Web Package (`@dms/web`)
- Next.js 14 App Router
- Minimal implementation currently

## Technology Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Hono (lightweight, fast)
- **DI Container**: tsyringe with reflect-metadata
- **Validation**: Zod v4 (type-safe schema validation)
- **Logger**: Pino
- **Testing**: Vitest
- **Planned**: Drizzle ORM, PostgreSQL, pgvector, DuckDB, Redis

### Frontend
- **Framework**: Next.js 14 with App Router
- **React**: 19+
- **Validation**: Zod v4 (shared with backend)

### Code Quality
- **Formatter/Linter**: Biome (replaces ESLint + Prettier)
- **Git Hooks**: Husky + lint-staged
- **Type Safety**: TypeScript 5.9+

## Important Files

- **Core Domain**: `packages/core/src/domain/`
  - `adapters/IStorageAdapter.ts`: Storage adapter interface
- **API Routes**: `packages/api/src/routes/`
  - `documents.ts`: Document upload/CRUD with DI-injected services
  - `health.ts`: Health check endpoints
- **Services**: `packages/api/src/services/`
  - `DocumentService.ts`: Document business logic with DI
- **Infrastructure**: `packages/api/src/infrastructure/adapters/`
  - `FileSystemStorageAdapter.ts`: Local file storage implementation
- **Repositories**: `packages/api/src/repositories/`
  - `DocumentRepository.ts`: Document repository interface and in-memory implementation
- **Configuration**: `packages/api/src/config/`
  - `container.ts`: DI container setup with tsyringe
  - `env.ts`: Environment variables
- **Middleware**: `packages/api/src/middleware/`
  - `errorHandler.ts`: Global error handling
  - `logger.ts`: Request logging
- **Types**: `packages/api/src/types/`
  - `document.ts`: Document schemas with Zod validation
- **Design Docs**: `docs/design/`
  - `00-architecture-overview.md`: Complete architecture (Japanese)
  - `03-data-models-and-repositories.md`: DB schema and repository patterns

## Environment Setup

Key environment variables (see `packages/api/.env.example`):
- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: 0.0.0.0)
- `STORAGE_TYPE`: Storage backend (`filesystem` or `s3`, default: filesystem)
- `STORAGE_PATH`: Base path for file storage (default: `./storage/documents`)
- `DATABASE_URL`: PostgreSQL connection string (when implemented)
- `REDIS_URL`: Redis connection string (when implemented)
- `OPENAI_API_KEY`: For embeddings and chat (when implemented)

## Development Workflow

1. Make changes in appropriate package
2. Tests run automatically on commit (Husky pre-commit hook)
3. Biome formats and lints staged files automatically
4. Core package changes require rebuild: `pnpm --filter @dms/core build`
5. API/Web packages have hot reload with tsx/Next.js

## Important Notes

- **UUIDs**: Use UUIDv7 from `uuidv7` package for document IDs (time-sortable)
- **Monorepo**: Changes to `@dms/core` require rebuild (`pnpm --filter @dms/core build`)
- **OpenAPI**: All new endpoints must have OpenAPI documentation with Zod schemas
- **Design Docs**: Architecture details are in Japanese in `docs/design/`
- **Storage Pattern**: Files in storage, metadata in repository - never mix the two
- **File Upload**: Document creation now requires multipart/form-data with file upload
- **Dependency Injection**:
  - All services use `@injectable()` decorator
  - Resolve dependencies with `container.resolve(Service)` in routes
  - Register dependencies in `setupContainer()` function
  - Use `@inject(TOKEN)` for constructor injection
  - Import `reflect-metadata` at app entry point
- **Service Layer**: Business logic goes in services, not routes
- **Temporary Implementation**: `InMemoryDocumentRepository` will be replaced by PostgreSQL
