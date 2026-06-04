# Work Report — Settings Module (Login Details)
**Project:** JobHuntly HR Recruitment Platform
**Date:** May 29, 2026
**Screen Implemented:** 2.10 Dashboard - Settings (Login Details)

---

## Summary

Backend for the Settings Login Details screen implemented. Covers updating email address, changing password, and closing an account. All endpoints are JWT-protected — only authenticated users can access them.

---

## Branch Delivered

| Branch | Purpose | Status |
|---|---|---|
| `feature/settings-login-details` | Screen 2.10 — Settings Login Details | Pushed |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| PATCH | `/api/v1/users/me/email` | Bearer Token | Update email address |
| PATCH | `/api/v1/users/me/password` | Bearer Token | Change password |
| DELETE | `/api/v1/users/me` | Bearer Token | Close account (soft delete) |

---

### PATCH `/api/v1/users/me/email`

#### Request Body
```json
{ "email": "newemail@example.com" }
```

#### Success Response `200`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "newemail@example.com",
    "emailVerified": false,
    "updatedAt": "2026-05-29T..."
  }
}
```

#### Error Responses
| Status | Reason |
|---|---|
| 409 | Email already in use by another account |
| 401 | Not authenticated |

---

### PATCH `/api/v1/users/me/password`

#### Request Body
```json
{
  "oldPassword": "currentpassword123",
  "newPassword": "newpassword123"
}
```

#### Success Response `200`
```json
{ "success": true }
```

#### Error Responses
| Status | Reason |
|---|---|
| 401 | Old password is incorrect |
| 401 | OAuth account has no password |
| 404 | User not found |

---

### DELETE `/api/v1/users/me`

#### Success Response `200`
```json
{ "success": true }
```

Sets `status: deleted` on the user and deletes all their refresh tokens.

---

## Files Added

```
src/modules/users/dto/update-email.dto.ts
src/modules/users/dto/update-password.dto.ts
src/modules/users/users.controller.ts
src/modules/users/users.service.spec.ts
src/modules/users/users.controller.spec.ts
```

## Files Updated

```
src/modules/users/users.repository.ts   ← update(), deleteRefreshTokens()
src/modules/users/users.service.ts      ← updateEmail(), updatePassword(), closeAccount()
src/modules/users/users.module.ts       ← UsersController registered
```

---

## Security

| Feature | Detail |
|---|---|
| All endpoints protected | JwtAuthGuard on entire controller |
| Email conflict check | Throws 409 if email taken by another user |
| Password verification | Old password bcrypt-compared before update |
| OAuth accounts | Cannot change password — throws 401 |
| Close account | Soft delete — sets status to `deleted`, clears all refresh tokens |
| Password in response | Never returned |

---

## Test Coverage

| File | Tests | Result |
|---|---|---|
| `users.service.spec.ts` | 8 | PASS |
| `users.controller.spec.ts` | 3 | PASS |
| Full suite | 36 | PASS |

### Tests by endpoint

| Endpoint | Scenarios Tested |
|---|---|
| PATCH /users/me/email | Updates email and sets emailVerified false, throws 409 on taken email, allows own email update |
| PATCH /users/me/password | Updates on correct old password, throws 401 on wrong password, throws 404 on unknown user, throws 401 for OAuth users |
| DELETE /users/me | Soft deletes user and clears refresh tokens |
