# Feature: User Registration
**Branch:** `feature/auth-user-registration`
**Screen:** 1.7 Sign Up

---

## What This Branch Implements

Backend for the Sign Up screen. A new user registers as a **Job Seeker** (CANDIDATE) or **Company** (COMPANY_OWNER) and receives a JWT access token and refresh token.

---

## Endpoint

| Method | URL | Auth |
|---|---|---|
| POST | `/api/v1/auth/register` | Public |

### Request Body
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "CANDIDATE"
}
```

### Success Response `201`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CANDIDATE",
      "status": "active",
      "provider": "local",
      "emailVerified": false,
      "createdAt": "2026-05-29T..."
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### Error Responses
| Status | Reason |
|---|---|
| 409 | Email already in use |
| 400 | Validation failed |

---

## Database Tables Created

### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| email | VARCHAR | Unique |
| password | VARCHAR | bcrypt hashed |
| first_name | VARCHAR | |
| last_name | VARCHAR | |
| role | Enum | CANDIDATE, COMPANY_OWNER, etc. |
| status | Enum | active, suspended, pending, deleted |
| provider | Enum | local, google |
| email_verified | BOOLEAN | Default false |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `refresh_tokens`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK → users |
| token | VARCHAR | Unique |
| expires_at | TIMESTAMP | |
| created_at | TIMESTAMP | |

---

## Files Added

```
prisma/schema.prisma
prisma/migrations/20260529175243_add_auth_tables/

src/modules/users/users.repository.ts
src/modules/users/users.service.ts
src/modules/users/users.module.ts

src/modules/auth/dto/register.dto.ts
src/modules/auth/dto/refresh-token.dto.ts
src/modules/auth/strategies/jwt.strategy.ts
src/modules/auth/guards/jwt-auth.guard.ts
src/modules/auth/decorators/current-user.decorator.ts
src/modules/auth/auth.service.ts
src/modules/auth/auth.controller.ts
src/modules/auth/auth.module.ts
src/app.module.ts
```

---

## Security
- Password hashed with bcrypt (10 salt rounds)
- Password never returned in any response
- Access token expires in 15 minutes
- Refresh token expires in 7 days
