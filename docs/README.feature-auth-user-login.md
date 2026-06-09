# Feature: User Login
**Branch:** `feature/auth-user-login`
**Screen:** 1.8 Login

---

## What This Branch Implements

Backend for the Login screen. An existing user authenticates with email and password. Supports "Remember Me" for extended sessions, logout, token refresh, and current user retrieval.

---

## Endpoints

| Method | URL | Auth |
|---|---|---|
| POST | `/api/v1/auth/login` | Public |
| POST | `/api/v1/auth/logout` | Public |
| POST | `/api/v1/auth/refresh` | Public |
| GET | `/api/v1/auth/me` | Bearer Token |

---

### POST `/api/v1/auth/login`

#### Request Body
```json
{
  "email": "john@example.com",
  "password": "password123",
  "rememberMe": true
}
```

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
      "role": "CANDIDATE"
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

#### Error Responses
| Status | Reason |
|---|---|
| 401 | Invalid credentials |
| 400 | Validation failed |

> `rememberMe: true` → refresh token expires in 30 days
> `rememberMe: false` → refresh token expires in 7 days

---

### POST `/api/v1/auth/logout`

#### Request Body
```json
{ "refreshToken": "eyJ..." }
```

#### Success Response `200`
```json
{ "success": true }
```

---

### POST `/api/v1/auth/refresh`

#### Request Body
```json
{ "refreshToken": "eyJ..." }
```

#### Success Response `200`
```json
{ "accessToken": "eyJ..." }
```

#### Error Responses
| Status | Reason |
|---|---|
| 401 | Invalid or expired refresh token |

---

### GET `/api/v1/auth/me`

#### Headers
```
Authorization: Bearer <accessToken>
```

#### Success Response `200`
```json
{
  "id": "uuid",
  "email": "john@example.com",
  "role": "CANDIDATE"
}
```

---

## Files Added

```
src/modules/auth/dto/login.dto.ts
```

## Files Updated

```
src/modules/auth/auth.service.ts
src/modules/auth/auth.controller.ts
```

---

## Token Strategy

| Token | Default Expiry | rememberMe Expiry |
|---|---|---|
| Access Token | 15 minutes | 15 minutes |
| Refresh Token | 7 days | 30 days |
