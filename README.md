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
│   └── utils/               # Shared utilities (e.g., pagination.util.ts)
│
├── infrastructure/          # External services and core infrastructure
│   ├── cloudinary/          # Cloudinary providers and streaming services
│   └── prisma/              # Prisma ORM setup, services, and modules
│
├── modules/                 # Feature-specific bounded contexts
│   ├── hero/                # Hero Image management feature
│   │   ├── controllers/     # Route handlers for /hero
│   │   ├── dto/             # Data Transfer Objects
│   │   ├── repositories/    # Database abstraction layer for Hero
│   │   └── services/        # Business logic for Hero
│   │
│   └── jobs/                # Job Listings management feature
│       ├── controllers/     # Route handlers for /jobs
│       ├── dto/             # Data Transfer Objects
│       ├── repositories/    # Database abstraction layer for Jobs
│       └── services/        # Business logic for Jobs
│
├── app.module.ts            # Root application module
└── main.ts                  # Application entry point (pipes, swagger, security setup)
```

---

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

1. **Install dependencies:**
```bash
$ pnpm install
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
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
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

### Available Resources:
- `GET /api/v1/jobs` - Fetch all jobs (supports `?page`, `?limit`, `?search`, `?location`, `?employmentType`, `?experienceLevel`)
- `POST /api/v1/jobs` - Create a new job (supports `multipart/form-data` for image upload)
- `GET /api/v1/jobs/:id` - Fetch job by ID
- `GET /api/v1/jobs/slug/:slug` - Fetch job by unique slug
- `PATCH /api/v1/jobs/:id` - Update job details and image
- `DELETE /api/v1/jobs/:id` - Delete a job
- `GET /api/v1/hero/active` - Fetch the current active hero image
- `POST /api/v1/hero` - Upload a new hero image
- `PATCH /api/v1/hero/:id` - Update/replace a hero image

---


