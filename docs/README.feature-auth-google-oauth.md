# Feature: Google OAuth
**Branch:** `feature/auth-google-oauth`
**Screens:** 1.7 Sign Up, 1.8 Login

---

## What This Branch Implements

Google OAuth for the "Sign Up with Google" and "Login with Google" buttons on screens 1.7 and 1.8. On first login a new user is created automatically. On return visits the existing user is found and tokens are issued. Also includes full test coverage for all auth endpoints.

---

## Endpoints

| Method | URL | Auth |
|---|---|---|
| GET | `/api/v1/auth/google` | Public |
| GET | `/api/v1/auth/google/callback` | Public |

---

### GET `/api/v1/auth/google`

Redirects the user to Google's login page. The frontend points the "Sign Up with Google" / "Login with Google" button to this URL.

---

### GET `/api/v1/auth/google/callback`

Google redirects back here after the user authenticates.

#### Success Response `200`
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
      "provider": "google",
      "emailVerified": true
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

## How It Works

```
1. User clicks "Sign Up / Login with Google"
2. Frontend redirects to GET /api/v1/auth/google
3. Google shows consent screen
4. Google redirects to GET /api/v1/auth/google/callback
5. Backend checks if user exists by email
   - Not found → creates new user (provider: google, emailVerified: true)
   - Found     → uses existing user
6. Issues accessToken + refreshToken
```

---

## Files Added

```
src/modules/auth/strategies/google.strategy.ts
src/modules/auth/guards/google-auth.guard.ts
src/modules/auth/auth.service.spec.ts
src/modules/auth/auth.controller.spec.ts
```

## Files Updated

```
src/modules/auth/auth.service.ts
src/modules/auth/auth.controller.ts
src/modules/auth/auth.module.ts
.env.example
```

---

## Dependencies Added

```
passport-google-oauth20
@types/passport-google-oauth20
```

---

## Test Coverage

| File | Tests | Result |
|---|---|---|
| `auth.service.spec.ts` | 12 | PASS |
| `auth.controller.spec.ts` | 5 | PASS |

| Endpoint | Scenarios Tested |
|---|---|
| POST /auth/register | Creates user and returns tokens, throws 409 on duplicate email |
| POST /auth/login | Returns tokens, throws on wrong password, throws on unknown email, 30-day token on rememberMe |
| POST /auth/logout | Deletes refresh token from DB |
| POST /auth/refresh | Returns new access token, throws on expired token, throws on unknown token |
| GET /auth/me | Returns current user from JWT payload |
| GET /auth/google/callback | Creates new Google user, returns tokens for existing Google user |
