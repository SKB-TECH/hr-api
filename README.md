# Feature: Job Detail API

This branch implements the job listings and applications functionality for the HR recruitment platform.

## What's Included

### Endpoints

**Public:**
- `GET /api/jobs/:id` - Get job details by ID
- `POST /api/jobs/:id/apply` - Submit job application

**Admin (requires `Authorization: Bearer <token>`):**
- `POST /api/jobs` - Create a new job listing
- `PUT /api/jobs/:id` - Update job listing
- `DELETE /api/jobs/:id` - Delete job listing

### Database Tables

**jobs**
- `id` (UUID, primary key)
- `title` (varchar)
- `location` (varchar)
- `salary_min` (int)
- `salary_max` (int)
- `salary_extras` (varchar, nullable)
- `job_type` (varchar)
- `reference` (varchar)
- `description` (text)
- `banner_url` (varchar, nullable)
- `is_active` (boolean, default true)
- `created_at`, `updated_at` (timestamps)

**job_applications**
- `id` (UUID, primary key)
- `job_id` (UUID, foreign key)
- `name` (varchar)
- `email` (varchar)
- `phone` (varchar)
- `resume_url` (varchar)
- `cover_letter` (text, nullable)
- `created_at` (timestamp)

### Module Structure

```
src/modules/jobs/
├── dto/
│   ├── job.dto.ts              # CreateJobDto, UpdateJobDto
│   └── apply-job.dto.ts        # ApplyJobDto
├── entities/
│   ├── job.entity.ts
│   └── job-application.entity.ts
├── repositories/
│   └── jobs.repository.ts      # All database operations
├── jobs.controller.ts
├── jobs.service.ts
├── jobs.service.spec.ts        # Unit tests
└── jobs.module.ts
```

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
