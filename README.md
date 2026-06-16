# HR API

Backend REST API for the HR recruitment platform, built with **NestJS**, **TypeORM**, and **PostgreSQL**.

## Tech Stack

- **Framework:** NestJS (Node.js + TypeScript)
- **ORM / DB:** TypeORM + PostgreSQL
- **Auth:** JWT (access + refresh, secret rotation) with Passport; refresh tokens stored in Redis
- **File storage:** Google Cloud Storage (async image compression via Pub/Sub worker)
- **Messaging:** Google Cloud Pub/Sub (local emulator supported)
- **Cache / sessions:** Redis
- **Logging:** pino (`nestjs-pino`)
- **Docs:** Swagger / OpenAPI
- **Package manager:** pnpm

---

## Prerequisites

- **Node.js 22+**
- **pnpm 10+** (via Corepack: `corepack enable`)
- **PostgreSQL 14+** (local or via Docker)
- **Redis** (optional locally — used for refresh tokens & Pub/Sub dedup)
- **Docker** (optional — for the bundled Postgres and the Pub/Sub emulator)

---

## Quick Start

```bash
# 1. Install dependencies
corepack enable
pnpm install

# 2. Configure environment
cp .env.example .env.local        # then fill in the values (see below)

# 3. Start PostgreSQL (option A — Docker, recommended)
cp .env.example .env              # docker-compose reads .env; set POSTGRES_PORT=5432
docker compose up -d postgres
#    (option B) point POSTGRES_* in .env.local at your own Postgres instance

# 4. Create the database schema
#    Local migrations aren't committed — generate your own from the entities first.
NODE_ENV=local pnpm typeorm:local:migration:generate src/database/local-migrations/Init
pnpm build                        # compile entities + the new migration into dist/
NODE_ENV=local pnpm typeorm:local:migration:run

# 5. Run the API
pnpm start:dev
```

API: <http://localhost:3000/api/v1> · Swagger: <http://localhost:3000/api/docs>

> `start:dev` already sets `NODE_ENV=local`, so the app loads `.env.local`.

---

## Environment Variables

Copy `.env.example` → `.env.local` and fill it in. Key groups:

| Group | Variables | Notes |
| --- | --- | --- |
| App | `NODE_ENV`, `APP_PORT` | `local` loads `.env.local`; otherwise `.env`. |
| Database | `POSTGRES_HOST/PORT/USER/PASSWORD/DB`, `DATABASE_SSL_CONNECTION`, `DB_POOL_*` | Set `DATABASE_SSL_CONNECTION=false` for local. |
| Redis | `APP_REDIS_URL`, `APP_REDIS_SSL_CONNECTION` | Leave `APP_REDIS_URL` empty to run without Redis (login/refresh need it). |
| JWT | `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRATION`, `JWT_REFRESH_EXPIRATION`, `JWT_*_SECRET_CURRENT/PREVIOUS` | `*_CURRENT/PREVIOUS` enable zero-downtime secret rotation. |
| Storage (GCS) | `GCS_BUCKET`, `GCS_PROJECT_ID`, `GCS_KEY_FILE` | `GCS_KEY_FILE` = path to a service-account JSON (gitignored); omit to use Application Default Credentials. |
| Pub/Sub | `PUBSUB_ENABLED`, `PUBSUB_PROJECT_ID`, `PUBSUB_KEY_FILE`, `PUBSUB_EMULATOR_HOST` | `PUBSUB_ENABLED=false` to disable in dev; defaults to the GCS project/key. |
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | For "Login with Google". |

> **Secrets:** `.env`, `.env.local`, and `*-service-account*.json` / `hr-project-*.json` keys are gitignored — never commit them.

---

## Database & Migrations

`synchronize` is **off** in every environment — the schema is managed exclusively through migrations, so a stray entity edit never silently alters the database (you catch it when you review the generated SQL). Because the datasource loads compiled files from `dist/`, always **build before generating/running** migrations.

### Per-environment migration directories

The datasource picks the migrations folder by `NODE_ENV`:

| Environment | Directory | Git | Purpose |
| --- | --- | --- | --- |
| **Local (`NODE_ENV=local`)** | `src/database/local-migrations/` | **gitignored** | Each developer generates their **own** throwaway migrations to set up their local DB. Not committed. |
| **Prod / staging (otherwise)** | `src/database/migrations/` | **committed** | The shared, reviewed migration history that actually ships. |

> Local migrations are private and disposable; the **prod migrations are the source of truth**. On a fresh clone there are no local migrations — generate your own (below).

### Dev workflow (your own local migrations — not committed)

```bash
# 1. Generate from entity changes (needs a reachable DB to diff against)
NODE_ENV=local pnpm typeorm:local:migration:generate src/database/local-migrations/<Name>
# 2. Compile the new migration into dist/
pnpm build
# 3. Apply / inspect / revert
NODE_ENV=local pnpm typeorm:local:migration:run
NODE_ENV=local pnpm typeorm:local:migration:show
NODE_ENV=local pnpm typeorm:local:migration:revert
```

### Prod workflow (committed, shared history)

```bash
# Generate against a CLEAN database so the migration reflects the full entity state
NODE_ENV=production pnpm typeorm:prod:migration:generate src/database/migrations/<Name>
pnpm build
```

Then **review the generated SQL** (watch for unexpected `DROP`s), commit `src/database/migrations/<Name>.ts`, and run it during deploy:

```bash
NODE_ENV=production pnpm typeorm:prod:migration:run
```

> `typeorm:*` (no env prefix) variants also exist and default to the `migrations/` directory.

---

## Optional Services

### Redis
Required for login/refresh (refresh tokens are stored in Redis) and Pub/Sub message dedup. Point `APP_REDIS_URL` at a running Redis, e.g. `redis://127.0.0.1:6379`. Leave it empty to boot without Redis (auth that needs it will fail at runtime).

### Pub/Sub emulator (local)
Backs the async workers — outbound **email** (OTP / password emails) and the storage **image-compression** pipeline. Off by default in dev.

```bash
pnpm pubsub:emulator              # starts the emulator on localhost:8085 (docker compose)
# then in .env.local:
PUBSUB_ENABLED=true
PUBSUB_EMULATOR_HOST=localhost:8085
```

The image-compression pipeline also needs Redis and a valid `GCS_KEY_FILE`.

### Email (OTP & password flows)
Email is sent asynchronously: a publisher enqueues a message on the `EMAIL_QUEUE` Pub/Sub topic, the `MailWorker` consumes it, and `MailService` renders a template and sends via **Resend**. With `RESEND_API_KEY` empty, emails (including OTP codes) are **logged** instead of sent — so dev works without a provider. This requires Pub/Sub to be on (above).

```bash
RESEND_API_KEY=                   # empty in dev → emails logged (read OTPs from the app log)
RESEND_FROM_EMAIL=noreply@hr-api.local
```

> **Full architecture (Email · Pub/Sub · Redis), key reference, runbook & troubleshooting:** see **[`docs/email-pubsub-redis.md`](docs/email-pubsub-redis.md)**.

---

## Project Structure

```text
src/
├── app/
│   ├── app.module.ts        # root module (TypeORM, logger, throttler, global filter)
│   └── modules/             # feature modules (auth, users, jobs, applications, candidate/…)
├── database/
│   ├── config/datasource.ts # TypeORM DataSource
│   └── local-migrations/    # migrations (+ migrations/ for prod)
├── libs/                    # cross-cutting integrations
│   ├── env/                 # ConfigService + env loading
│   ├── i18n/ jwt/ redis/    # i18n, token service, redis client/pub-sub
│   └── pubsub/ storage/     # GCP Pub/Sub, GCS storage + image compressor + worker
├── helpers/                 # filters, guards, decorators, pagination, message (sendResult)
├── utils/                   # shared enums, transformers
└── main.ts                  # bootstrap (pipes, cookies, CORS, Swagger, security)
```

---

## Scripts

| Command | Description |
| --- | --- |
| `pnpm start:dev` | Run in watch mode (`NODE_ENV=local`). |
| `pnpm build` | Compile to `dist/`. |
| `pnpm start:prod` | Run the compiled app (`node dist/main`). |
| `pnpm test` / `pnpm test:cov` | Unit tests (Jest) / with coverage. |
| `pnpm test:e2e` | End-to-end tests. |
| `pnpm lint` / `pnpm format` | ESLint (fix) / Prettier. |
| `pnpm typeorm:local:migration:*` | Generate / run / show / revert migrations (local). |
| `pnpm pubsub:emulator` | Start the local Pub/Sub emulator. |

---

## API & Responses

Interactive docs: **<http://localhost:3000/api/docs>** (global prefix `api/v1`).

All responses share a consistent envelope:

- **Success:** `{ statusCode, message, data }`
- **Paginated:** `{ statusCode, message, data: [...], meta: { totalItems, totalPages, currentPage, hasNextPage, hasPreviousPage } }`
- **Error:** `{ statusCode, message, error }`

Auth supports two delivery modes via the `x-client-type` header: `web` (default) sets httpOnly cookies, `mobile` returns tokens in the body.

> **Custom headers** (`Authorization`, `x-client-type`, `x-refresh-token`, `x-reset-token`, `x-language-code`, `x-request-id`), auth cookies, and CORS: see **[`docs/http-headers.md`](docs/http-headers.md)**.

---

## Testing

```bash
pnpm test            # all unit tests
pnpm test interviews # filter by name
pnpm test:e2e        # end-to-end
```
