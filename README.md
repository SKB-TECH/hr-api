
# HR API

Backend REST API for the HR recruitment platform, built with NestJS, TypeORM, and PostgreSQL.

## Tech Stack

- **Framework:** NestJS (Node.js + TypeScript)
- **Database:** PostgreSQL (via Docker)
- **ORM:** TypeORM
- **File Storage:** Local (`/uploads` folder, CDN-ready via StorageProvider interface)
- **Package Manager:** pnpm
<div align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  <h1>Infinity Tech Innovation API</h1>
  <p>A professional, enterprise-grade Job Listing Backend built with <strong>NestJS</strong>, <strong>PostgreSQL</strong>, <strong>Prisma ORM</strong>, and <strong>Cloudinary</strong>.</p>
</div>

<hr />

## Overview

The **Infinity Tech Innovation API** powers a dynamic Job Listing platform. It follows a Clean Architecture approach to ensure scalability, maintainability, and security.

### Key Features
- **Clean Architecture:** Well-structured modules (`Jobs`, `Hero`), separated repositories, controllers, services, and shared utilities.
- **Robust Database Layer:** PostgreSQL managed via Prisma (`@prisma/client@5`).
- **Cloudinary Integration:** Dynamic image uploads configured for a specific `"infinity job image"` folder (stream-based upload with delete/replace functionality).
- **Advanced Job Management:** Full CRUD operations for `Jobs` with dynamic search, pagination, and location/type/experience filters.
- **Hero Image Management:** Dedicated CRUD endpoints for dynamically controlling the frontend's main hero section.
- **Global Error Handling & Formatting:** Custom global exception filters and Prisma exception handling to provide clean, normalized JSON responses (`{ success, message, statusCode, timestamp, data, meta }`).
- **Strict Validation:** Extensive request validation using `class-validator` and DTOs.
- **Security & Optimization:** Protected with Helmet, CORS, Throttler (rate limiting), and HTTP response Compression.
- **Swagger Documentation:** Auto-generated interactive API docs detailing schemas, parameters, and multi-part file uploads.

---

## 📂 Folder Structure

This project enforces a highly modular and professional folder structure:

```text
src/
├── common/                  # Shared resources across the application
│   ├── exceptions/          # Global & Prisma-specific exception filters
│   ├── interceptors/        # Global response formatting interceptors
│   ├──utils/                # Shared utilities (e.g., pagination.util.ts)
|   ├──pipes                 # transform input data
|   ├── response           
│
├── infrastructure/          # External services and core infrastructure
│   ├── cloudinary/          # Cloudinary providers and streaming services
│   └── prisma/              # Prisma ORM setup, services, and modules
│
├── modules/                 # Feature-specific bounded contexts
│   ├── Auth/                # Hero Image management feature
│   │   ├── decorators/      # Route handlers for /hero
│   │   ├── dto/             # Data Transfer Objects
│   │   ├── guards/          # Database abstraction layer for Hero
│   │   └── starategies/     # Business logic for Hero
|   |   ├── 
│   │
│   └── candidate-section/                
│   |    ├── dto/
│   |    ├── controller.ts   
         ├── module.ts           
│   |    ├── repositories.ts    
│   |    └── services.ts        
│   ├──candidate-resume
|        ├──dto
|        ├── interceptors
├── app.module.ts            # Root application module
└── main.ts                  # Application entry point (pipes, swagger, security setup)
```

---

## Prerequisites

- Node.js v18+
- pnpm
- Docker (for PostgreSQL)

1. **Install dependencies:**
```bash
pnpm install
```

2. **Environment Configuration:**
Create `.env` and `.env.local` files based on the `.env.example` template. Ensure your database and Cloudinary keys are set.
```env
DATABASE_URL="postgresql://user:password@localhost:5432/infinity_tech_innovation?schema=public"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
PORT=3000
```

3. **Database Initialization & Seeding:**
Push the schema to your local PostgreSQL instance and seed the mock data:
```bash
cp .env.example .env
```

---

## Running the Application

```bash
# development
npm run start

# watch mode (recommended)
npm run start:dev

# production mode
npm run start:prod
```

---

## API Endpoints & Documentation

Once the server is running, navigate to the auto-generated Swagger UI to explore and test all available endpoints:

**[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**




# Feature: Job Detail API

This branch implements the job listings and applications functionality for the HR recruitment platform.







### Tests

- Unit tests: `src/modules/jobs/jobs.service.spec.ts`
- E2E tests: `test/jobs.e2e-spec.ts`

## Testing

```bash
# Run unit tests
pnpm test jobs

# Run E2E tests
pnpm test:e2e
```

