# HR API

Backend REST API for the HR recruitment platform, built with NestJS, TypeORM, and PostgreSQL.

## Tech Stack

- **Framework:** NestJS (Node.js + TypeScript)
- **Database:** PostgreSQL (via Docker)
- **ORM:** TypeORM
- **File Storage:** Local (`/uploads` folder, CDN-ready via StorageProvider interface)
- **Package Manager:** pnpm

## Prerequisites

- Node.js v18+
- pnpm
- Docker (for PostgreSQL)

## Setup

**1. Install dependencies**
```bash
pnpm install
```

**2. Create your .env file**
```bash
cp .env.example .env
```

**3. Start the PostgreSQL Docker container**
```bash
docker start hr-api-db
```

**4. Start the server**
```bash
pnpm run start:dev
```

Server runs on `http://localhost:3000`

Uploaded files are served at `http://localhost:3000/files/<filename>`

---

## Project Structure

```
src/
├── common/
│   ├── errors/
│   │   ├── app-error.ts                  # Custom error class
│   │   └── global-exception.filter.ts    # Uniform error responses
│   ├── guards/
│   │   └── admin.guard.ts                # Bearer token auth stub
│   └── response/
│       └── api-response.ts               # Uniform success responses
│
├── modules/
│   ├── about/                            # About page feature
│   │   ├── dto/                          # Request validation
│   │   ├── entities/                     # Database table definitions
│   │   ├── repositories/
│   │   │   └── about.repository.ts       # All DB calls
│   │   ├── about.controller.ts           # HTTP layer
│   │   ├── about.service.ts              # Business logic
│   │   └── about.module.ts
│   │
│   └── media/                            # Shared image upload module
│       ├── entities/media.entity.ts
│       ├── media.controller.ts
│       ├── media.service.ts
│       ├── media.storage.ts              # StorageProvider interface
│       └── media.module.ts
│
├── app.module.ts
└── main.ts
```

## API Endpoints

### About — Public

| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/about/hero | Hero banner (title, subtitle, background image) |
| GET | /api/about/ceo | CEO section (name, title, photo, message) |
| GET | /api/about/team | All team members ordered by `order` field |
| POST | /api/about/contact | Submit contact form |

### About — Admin (requires `Authorization: Bearer <token>`)

| Method | URL | Description |
|--------|-----|-------------|
| PUT | /api/about/hero | Update hero content + image URL |
| PUT | /api/about/ceo | Update CEO content + image URL |
| POST | /api/about/team | Add a team member |
| PUT | /api/about/team/:id | Update a team member |
| DELETE | /api/about/team/:id | Delete a team member |

### Media — Admin (requires `Authorization: Bearer <token>`)

| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/media/upload | Upload image file → returns URL |
| DELETE | /api/media/:id | Delete image from storage + DB |

## Image Upload Flow

Images are a two-step process:

```
1. POST /api/media/upload   →  { url: "http://localhost:3000/files/image.jpg" }
2. PUT  /api/about/hero     →  { imageUrl: "<url from step 1>", title: "...", subtitle: "..." }
```

The about module never handles file buffers — it only stores and serves URL strings.

## Uniform Response Format

All endpoints return the same shape:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Errors follow the same shape with `success: false`.

## Running Tests

```bash
# Unit tests
pnpm run test

# Test coverage
pnpm run test:cov
```

Unit tests cover `AboutService` with mocked repository (13 tests, 100% service coverage).

---

## Database Tables

| Table | Description |
|-------|-------------|
| `hero_section` | One row — banner image, title, subtitle |
| `ceo_section` | One row — CEO name, title, photo, message |
| `team_members` | One row per member — name, role, photo, order |
| `contact_submissions` | One row per form submission |
| `media` | One row per uploaded file |
