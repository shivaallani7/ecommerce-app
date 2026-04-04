# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack e-commerce monorepo with three main directories:
- `frontend/` — Next.js 14 (React 18, TypeScript, Tailwind CSS)
- `backend/` — Express.js (Node.js 20, TypeScript, Sequelize ORM)
- `infra/` — Azure Bicep infrastructure-as-code templates

## Commands

### Frontend (`cd frontend`)
```bash
npm run dev       # Dev server on http://localhost:3000
npm run build     # Production build (standalone output)
npm run lint      # ESLint (extends next/core-web-vitals)
npm test          # Jest (--passWithNoTests)
```

### Backend (`cd backend`)
```bash
npm run dev       # ts-node-dev on http://localhost:5001
npm run build     # Compile TypeScript → dist/
npm run lint      # ESLint with TypeScript parser
npm run lint:fix  # Auto-fix lint issues
npm test          # Jest with coverage
npm run seed      # Seed DB with categories, products, and test users
npm run swagger   # Generate Swagger API docs
```

### Local Infrastructure (Docker)
```bash
# SQL Server
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=LocalDev@123456!" \
  -p 1433:1433 --name sql-local \
  -d mcr.microsoft.com/mssql/server:2022-latest

# Redis (optional, falls back to localhost:6379)
docker run -p 6379:6379 --name redis-local -d redis:7-alpine
```

### Infrastructure Deployment
```bash
az deployment group create --template-file infra/main.bicep
```

## Local Dev Setup

1. Start Docker containers above
2. `cd backend && npm install && npm run dev`
3. `cd frontend && npm install && npm run dev`
4. `cd backend && npm run seed` — creates test users:
   - Admin: `admin@shopazure.dev` / `Admin@1234`
   - Customer: `customer@shopazure.dev` / `Customer@1234`

**Frontend env** (`frontend/.env.local` — create manually):
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Backend env**: `/backend/.env` is pre-populated for local development.

## Architecture

### Backend (`backend/src/`)
- `routes/` → `controllers/` → `services/` → `models/` (strict layering)
- `middleware/` — auth (JWT verification + RBAC), rate limiting, error handling
- `models/` — Sequelize models: User, Category, Product, Order, OrderItem, Review (all support soft-deletes via `deletedAt`)
- Auth: 15-min JWT access tokens + 7-day refresh tokens
- Cart: Redis-backed (`ioredis`), falls back to `localhost:6379` if no `REDIS_CONNECTION_STRING`
- API versioned at `/api/v1/*`; Swagger docs at `http://localhost:5000/api-docs`

### Frontend (`frontend/`)
- Pages Router (not App Router) under `pages/`
- State: Zustand (`store/authStore.ts`, `store/cartStore.ts`)
- Server state: React Query (TanStack)
- HTTP: Axios via `services/api.ts` (with interceptors for JWT refresh)
- `next.config.js` uses standalone output mode; configures remote image patterns for Azure Blob/CDN

### Azure Services (Production)
| Service | Use |
|---------|-----|
| Azure SQL | Primary database (MSSQL via Sequelize/tedious) |
| Azure Redis | Cart and session caching |
| Azure Blob Storage | Product images (multer upload) |
| Azure CDN | Static asset delivery |
| Azure Key Vault | Secrets management |
| Application Insights | Telemetry and custom event tracking |
| Azure App Service | Hosting for both frontend and backend |

### CI/CD (`.github/workflows/`)
- `deploy-backend.yml` / `deploy-frontend.yml`: push to `main` or `staging` → auto-deploy dev → auto-deploy staging → manual approval for prod
- `infra.yml`: manual workflow dispatch for Bicep deployments
- Frontend build injects `NEXT_PUBLIC_API_URL_DEV` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` from GitHub secrets
