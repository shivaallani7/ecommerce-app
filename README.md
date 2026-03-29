# ShopAzure – Production-Ready E-Commerce on Microsoft Azure

A full-stack, production-ready e-commerce application built with **Next.js**, **Node.js/Express**, and optimised for deployment on **Microsoft Azure**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (TypeScript), Tailwind CSS, Zustand, Axios, React Query |
| Backend | Node.js, Express.js (TypeScript), Sequelize ORM |
| Database | Azure SQL Database (MSSQL via Sequelize) |
| Cache | Azure Cache for Redis |
| Storage | Azure Blob Storage + Azure CDN |
| Auth | JWT + Refresh Tokens (+ Azure AD B2C optional) |
| Payments | Stripe |
| Monitoring | Azure Application Insights |
| Secrets | Azure Key Vault |
| IaC | Azure Bicep |
| CI/CD | GitHub Actions → Azure App Service |

---

## Project Structure

```
ecommerce-app/
├── frontend/                   # Next.js 14 app
│   ├── components/
│   │   ├── layout/             # Header, Footer, Layout
│   │   ├── product/            # ProductCard
│   │   └── cart/               # CartDrawer
│   ├── pages/
│   │   ├── index.tsx           # Homepage (SSG + ISR)
│   │   ├── products/           # Product listing + detail
│   │   ├── checkout/           # Stripe checkout flow
│   │   ├── auth/               # Login + Register
│   │   ├── account/            # Profile, Order history
│   │   └── admin/              # Admin panel
│   ├── store/                  # Zustand (authStore, cartStore)
│   ├── services/               # Axios API services
│   ├── types/                  # Shared TypeScript types
│   └── styles/                 # Tailwind globals
│
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── config/             # DB, Redis, Key Vault, Swagger, env
│   │   ├── controllers/        # auth, products, orders, cart, reviews, admin
│   │   ├── middleware/         # auth, rbac, validate, errorHandler, rateLimiter
│   │   ├── models/             # Sequelize models (User, Product, Category, Order…)
│   │   ├── routes/             # Express routers
│   │   ├── services/           # Blob Storage, Insights, Stripe, Cart (Redis)
│   │   └── utils/              # logger, AppError, pagination, slugify
│   └── scripts/
│       └── seed.ts             # Database seed script
│
├── infra/                      # Azure Bicep templates
│   ├── main.bicep              # Orchestrator
│   ├── appservice.bicep        # App Service Plan + Web Apps
│   ├── sql.bicep               # Azure SQL Server + Database
│   ├── storage.bicep           # Azure Blob Storage
│   ├── redis.bicep             # Azure Cache for Redis
│   ├── keyvault.bicep          # Azure Key Vault
│   ├── cdn.bicep               # Azure CDN
│   └── insights.bicep          # Application Insights + Log Analytics
│
└── .github/workflows/
    ├── deploy-backend.yml      # Backend CI/CD (test → build → dev → staging → prod)
    ├── deploy-frontend.yml     # Frontend CI/CD
    └── infra.yml               # Manual infrastructure provisioning
```

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- npm 9+
- A running SQL Server (local or Azure SQL) **or** Docker
- Redis (local or Azure Cache for Redis)

### 1. Clone the repository

```bash
git clone https://github.com/your-org/ecommerce-app.git
cd ecommerce-app
```

### 2. Configure backend environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your local values (see section below for required vars).

### 3. Install and run the backend

```bash
cd backend
npm install
npm run dev          # starts ts-node-dev on port 5000
```

Swagger UI is available at `http://localhost:5000/api-docs`

### 4. Seed the database

```bash
cd backend
npm run seed
```

This creates sample categories, products, and test accounts:

| Role | Email | Password |
|---|---|---|
| Admin | admin@shopazure.dev | Admin@1234 |
| Customer | customer@shopazure.dev | Customer@1234 |

### 5. Configure and run the frontend

```bash
cd frontend
cp .env.local.example .env.local   # or create manually
npm install
npm run dev          # starts Next.js on port 3000
```

Minimum `.env.local` for local dev:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

### Local SQL Server via Docker (optional)

```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourPassword123!" \
  -p 1433:1433 --name sql-local \
  -d mcr.microsoft.com/mssql/server:2022-latest
```

Set in `.env`:
```env
DB_SERVER=localhost
DB_NAME=ecommerce
DB_USER=sa
DB_PASSWORD=YourPassword123!
```

### Local Redis via Docker (optional)

```bash
docker run -p 6379:6379 --name redis-local -d redis:7-alpine
```

Leave `REDIS_CONNECTION_STRING` empty in `.env` – the app falls back to `localhost:6379`.

---

## Azure Deployment

### Step 1 – Provision infrastructure (Bicep)

```bash
# Login
az login
az account set --subscription <YOUR_SUBSCRIPTION_ID>

# Create resource group
az group create --name rg-shopazure-dev --location eastus

# Preview changes (what-if)
az deployment group what-if \
  --resource-group rg-shopazure-dev \
  --template-file infra/main.bicep \
  --parameters environment=dev appName=shopazure \
               sqlAdminLogin=sqladmin sqlAdminPassword='YourSecureP@ss!'

# Deploy
az deployment group create \
  --resource-group rg-shopazure-dev \
  --template-file infra/main.bicep \
  --parameters environment=dev appName=shopazure \
               sqlAdminLogin=sqladmin sqlAdminPassword='YourSecureP@ss!'
```

This provisions:
- Azure Key Vault + all secrets
- Azure SQL Database
- Azure Cache for Redis
- Azure Blob Storage + container
- Azure CDN
- Azure App Service Plan + two Web Apps (API + Frontend)
- Azure Application Insights + Log Analytics Workspace

### Step 2 – Add secrets to Key Vault

After provisioning, add these secrets manually (or via pipeline):

```bash
KV_NAME=kv-shopazure-dev

az keyvault secret set --vault-name $KV_NAME --name jwt-secret --value "$(openssl rand -hex 64)"
az keyvault secret set --vault-name $KV_NAME --name jwt-refresh-secret --value "$(openssl rand -hex 64)"
az keyvault secret set --vault-name $KV_NAME --name stripe-secret-key --value "sk_live_xxxxx"
az keyvault secret set --vault-name $KV_NAME --name stripe-webhook-secret --value "whsec_xxxxx"
```

> Connection strings for SQL, Redis, and Storage are automatically stored by the Bicep templates.

### Step 3 – Configure GitHub Actions secrets

In your GitHub repository settings → Secrets and variables → Actions, add:

**Azure Credentials (create a service principal):**
```bash
az ad sp create-for-rbac \
  --name "shopazure-cicd-dev" \
  --role contributor \
  --scopes /subscriptions/<SUB_ID>/resourceGroups/rg-shopazure-dev \
  --sdk-auth
```
Copy the JSON output as `AZURE_CREDENTIALS_DEV`.

**Required GitHub Secrets:**

| Secret | Description |
|---|---|
| `AZURE_CREDENTIALS_DEV` | Azure SP JSON for dev |
| `AZURE_CREDENTIALS_STAGING` | Azure SP JSON for staging |
| `AZURE_CREDENTIALS_PROD` | Azure SP JSON for production |
| `AZURE_BACKEND_APP_NAME_DEV` | e.g. `api-shopazure-dev` |
| `AZURE_FRONTEND_APP_NAME_DEV` | e.g. `web-shopazure-dev` |
| `AZURE_RESOURCE_GROUP` | e.g. `rg-shopazure-dev` |
| `SQL_ADMIN_LOGIN` | SQL admin username |
| `SQL_ADMIN_PASSWORD` | SQL admin password |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

### Step 4 – Deploy via GitHub Actions

```bash
git push origin main
```

The pipeline automatically:
1. Runs tests and linting
2. Builds the app
3. Deploys to **dev** (on push to `staging` or `main`)
4. Deploys to **staging** (on push to `main`)
5. Deploys to **production** (requires manual approval in GitHub Environments)

---

## API Reference

Swagger UI is available at:
- Local: `http://localhost:5000/api-docs`
- Dev: `https://api-shopazure-dev.azurewebsites.net/api-docs`

### Core Endpoints

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/profile
PATCH  /api/v1/auth/profile

GET    /api/v1/products             ?search=&categoryId=&minPrice=&maxPrice=&sort=&page=
GET    /api/v1/products/featured
GET    /api/v1/products/slug/:slug
GET    /api/v1/products/:id
POST   /api/v1/products             [Admin]
PATCH  /api/v1/products/:id         [Admin]
DELETE /api/v1/products/:id         [Admin]

GET    /api/v1/products/:productId/reviews
POST   /api/v1/products/:productId/reviews
DELETE /api/v1/products/:productId/reviews/:reviewId

GET    /api/v1/categories
GET    /api/v1/categories/:slug
POST   /api/v1/categories           [Admin]
PATCH  /api/v1/categories/:id       [Admin]
DELETE /api/v1/categories/:id       [Admin]

GET    /api/v1/cart
POST   /api/v1/cart/items
PATCH  /api/v1/cart/items/:productId
DELETE /api/v1/cart/items/:productId
DELETE /api/v1/cart

POST   /api/v1/orders
POST   /api/v1/orders/:orderId/confirm
GET    /api/v1/orders/my
GET    /api/v1/orders/my/:id
GET    /api/v1/orders               [Admin]
PATCH  /api/v1/orders/:id/status    [Admin]

GET    /api/v1/admin/dashboard      [Admin]
GET    /api/v1/admin/users          [Admin]
PATCH  /api/v1/admin/users/:id/status [Admin]
GET    /api/v1/admin/reports/sales  [Admin]
POST   /api/v1/admin/upload/image   [Admin]

GET    /api/v1/health
```

---

## Security

- **HTTPS enforced** on all Azure App Service endpoints
- **JWT** access tokens (15 min) + **refresh tokens** (7 days) with rotation
- **Role-based access control**: `customer` and `admin` roles
- **Input validation** via `express-validator` on all POST/PATCH endpoints
- **Rate limiting**: 20 req/15 min on auth, 120 req/min general API
- **Parameterised queries** via Sequelize ORM (SQL injection prevention)
- **CORS** restricted to allowed origins only
- **Helmet.js** security headers on all responses
- **Azure Key Vault** for all secrets – never hardcoded
- **Soft-deletes** on users, products, categories, reviews

---

## Monitoring

- Azure Application Insights SDK integrated in the backend
- Tracks: API request/response times, exceptions, custom events
- Custom events tracked:
  - `product_view` – when a product detail page is viewed
  - `add_to_cart` – when an item is added to cart
  - `order_created` – when an order is placed
  - `order_paid` – when payment is confirmed
- **Error rate alert** fires when failed requests exceed 10 in 15 minutes

---

## Environment Variables Reference

### Backend (`.env`)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | `development` \| `staging` \| `production` |
| `PORT` | No | Server port (default: 5000) |
| `DB_SERVER` | Yes | Azure SQL server hostname |
| `DB_NAME` | Yes | Database name |
| `DB_USER` | Yes | SQL username |
| `DB_PASSWORD` | Yes | SQL password (use Key Vault in prod) |
| `JWT_SECRET` | Yes | 256-bit JWT signing secret |
| `JWT_REFRESH_SECRET` | Yes | 256-bit refresh token secret |
| `AZURE_STORAGE_CONNECTION_STRING` | Yes* | Blob Storage connection string |
| `AZURE_STORAGE_CONTAINER_NAME` | No | Default: `product-images` |
| `AZURE_CDN_ENDPOINT` | No | CDN base URL for images |
| `AZURE_KEY_VAULT_URL` | No | Key Vault URI (production) |
| `REDIS_CONNECTION_STRING` | No | Redis connection string |
| `STRIPE_SECRET_KEY` | Yes* | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes* | Stripe webhook signing secret |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | No | App Insights connection string |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins |

### Frontend (`.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key |
| `NEXT_PUBLIC_AAD_B2C_TENANT` | No | Azure AD B2C tenant name |
| `NEXT_PUBLIC_AAD_B2C_CLIENT_ID` | No | Azure AD B2C client ID |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "feat: add my feature"`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request targeting `main`

---

## License

MIT © ShopAzure
