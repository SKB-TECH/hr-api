# HTTP Headers Reference

The API uses a few custom headers (alongside the standard ones) to control auth token delivery, password-reset confirmation, localization, and log correlation. This is the canonical list; the interactive Swagger docs (`/api/docs`) also surface the per-endpoint ones.

Base URL prefix: `/api/v1`.

---

## Request headers

| Header | Values / example | Required | Used by | Purpose |
| --- | --- | --- | --- | --- |
| `Authorization` | `Bearer <accessToken>` | On protected endpoints (unless using the cookie) | All `JwtAuthGuard` routes | Access-token auth. The JWT strategy reads the `access_token` **cookie first**, then falls back to this Bearer header — so mobile/API clients send the token here. |
| `x-client-type` | `web` (default) \| `mobile` | No | Auth endpoints (login, register, verify-otp, refresh, reset) | Selects token delivery. `web` (or absent) → tokens set as httpOnly **cookies**; `mobile` → tokens returned in the **response body**. Any value other than `mobile` is treated as `web`. |
| `x-refresh-token` | `<refreshToken>` | Mobile only, on `POST /auth/refresh` | `JwtRefreshStrategy` | Supplies the refresh token for mobile clients. Web clients send it automatically via the `refresh_token` cookie, so this header isn't needed there. |
| `x-reset-token` | `<resetToken>` | Yes, on the final password step | `PATCH /auth/set-password`, `PATCH /auth/reset-password/set-new-password` | One-time token (returned by the `confirm-otp` step, TTL 300s) that authorizes writing the new password. |
| `x-language-code` | `en` (a supported lang code) | No | `I18nMiddleware` (all routes) | Selects the response/message locale. Unknown or missing → the default language. (Note: this is **not** the standard `Accept-Language` header.) |
| `x-request-id` | any string / UUID | No | pino request logger | Correlation id echoed into structured logs. If absent, the logger generates a UUID per request. |
| `Content-Type` | `application/json`, or `multipart/form-data` | Yes for bodies/uploads | Global `ValidationPipe`, file endpoints | JSON for normal requests; `multipart/form-data` for endpoints that accept file uploads (avatar/portfolio/resume). |

### `x-client-type` cheat-sheet
```
# Web (default): tokens come back as Set-Cookie, no header needed
POST /api/v1/auth/login

# Mobile: tokens come back in the JSON body
POST /api/v1/auth/login
x-client-type: mobile
```

---

## Response headers & cookies

### Auth cookies (web clients)
Set by `setTokenCookies` on login / verify-otp / refresh / reset; cleared on logout.

| Cookie | Flags | Path | Max-Age |
| --- | --- | --- | --- |
| `access_token` | `httpOnly`; `secure` + `sameSite=strict` in prod (`lax` in local) | `/` | 24h |
| `refresh_token` | same as above | `/api/v1/auth/refresh` | 7d |

> The refresh cookie is scoped to the refresh path, so it's only sent on `POST /auth/refresh` — not on every request.

### Security & transport
- Standard security headers are applied globally via **helmet**.
- Responses are **gzip**-compressed via `compression`.
- `app.set('trust proxy', 1)` is enabled so secure cookies and client IPs work correctly behind a reverse proxy/load balancer.

---

## CORS

`enableCors` runs with `origin: true` (reflects the request origin) and `credentials: true` (cookies allowed cross-origin). Allowed request headers:

```
Content-Type, Authorization, Accept, x-client-type, x-refresh-token, x-reset-token, x-language-code
```

All custom headers used by the API are included, so cross-origin browser calls (e.g. the web reset-password `PATCH` with `x-reset-token`, or a localized request with `x-language-code`) pass the preflight. When adding a new custom request header, remember to add it to `allowedHeaders` in `src/main.ts`.

---

## Quick map: header → where it's handled

| Header | Source file |
| --- | --- |
| `Authorization` (Bearer) / `access_token` cookie | `src/app/modules/auth/strategies/jwt.strategy.ts` |
| `x-client-type` | `src/app/modules/auth/helpers/cookie.helper.ts` |
| `x-refresh-token` / `refresh_token` cookie | `src/app/modules/auth/strategies/jwt-refresh.strategy.ts` |
| `x-reset-token` | `set-password.controller.ts`, `reset-password.controller.ts` |
| `x-language-code` | `src/libs/i18n/i18n.middleware.ts` |
| `x-request-id` | `src/app/app.module.ts` (pino `genReqId`) |
| token cookies (set/clear) | `src/app/modules/auth/helpers/cookie.helper.ts` |
| CORS `allowedHeaders`, helmet, compression | `src/main.ts` |
