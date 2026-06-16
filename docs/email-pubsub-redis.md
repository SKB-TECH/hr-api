# Email, Pub/Sub & Redis — Developer Guide

This document explains how the asynchronous infrastructure of the HR API fits together: **Redis** (ephemeral state + dedup), **Google Cloud Pub/Sub** (message queue), and the **Email** subsystem (publisher → queue → worker → provider → templates).

If you only need the OTP / password flows to work locally, jump to [Local dev runbook](#local-dev-runbook).

---

## 1. The big picture

Outbound email is **never sent inline** from a request. The request handler publishes a message to a Pub/Sub topic and returns immediately; a background worker consumes the message and sends the email. Redis backs the short-lived state these flows depend on (OTPs, pending registrations, reset tokens) and guarantees each Pub/Sub message is handled once.

```
HTTP request (e.g. POST /auth/registration/register)
      │
      ├─► RedisService.set("pending_reg:<id>", …)      # ephemeral state (TTL)
      ├─► OtpService.generate(<id>)  ─► Redis "otp:<id>" # 6-digit code (TTL 600s)
      │
      └─► EmailPublisher.publishOtpEmail(email, otp)
                 │
                 ▼
          PubSubService.publish(EMAIL_QUEUE, "otp", {email, otp})
                 │   (topic name is suffixed with NODE_ENV, e.g. email-queue-local)
                 ▼
          ┌──────────────────────────┐
          │   Pub/Sub  EMAIL_QUEUE    │  ──(on failure ×5)──►  EMAIL_QUEUE_DLQ
          └──────────────────────────┘
                 │
                 ▼
          MailWorker  (subscription "email-queue-worker")
                 │   ├─ Redis setNx dedup (pubsub:dedup:<sub>:<msgId>)
                 │   └─ routes message.type → MailService method
                 ▼
          MailService.sendOtpEmail(to, otp)
                 │   └─ otpTemplate(otp) → { subject, html }
                 ▼
          Resend API   (if RESEND_API_KEY set)
                 └─ else: logs the rendered email (incl. OTP) to the app log
```

**Key consequence for dev:** with `PUBSUB_ENABLED=true` and **no** `RESEND_API_KEY`, the OTP is printed in the `MailService` log line — that's how you read codes locally without a real email provider. With `PUBSUB_ENABLED=false`, `publish()` is a no-op and **no email/OTP is produced at all**.

---

## 2. Redis

### Client — `src/libs/redis/`
- `redis-client.ts` creates a single shared `redis` client (`pubClient`) from `APP_REDIS_URL`. TLS is enabled when `APP_REDIS_SSL_CONNECTION=true`. It auto-reconnects (capped backoff) and logs—but does not crash—if Redis is unreachable. If `APP_REDIS_URL` is empty it stays disconnected and any feature that needs Redis fails at call time.
- `redis.service.ts` (`RedisService`) is the injectable wrapper. Methods:
  - `get(key)` → `string | null`
  - `set(key, value, ttl = 3600)` — seconds; `ttl <= 0` means no expiry
  - `del(key)`
  - `setNx(key, value, ttl)` → `true` only if the key was newly created (atomic; used for dedup and locks)

### What Redis stores

| Key pattern | Written by | TTL | Purpose |
| --- | --- | --- | --- |
| `otp:<requestId>` | `OtpService.generate` | 600s | The 6-digit code for a request, deleted on successful verify |
| `pending_reg:<requestId>` | `AuthService.register` | 600s | Pending registration payload (name/email/role) before the user row exists |
| `set_password:<requestId>` | `AuthService.setPasswordVerify` | 600s | Maps an in-progress set-password request to its userId |
| `reset_password:<requestId>` | `AuthService.forgotPassword` | 600s | Maps an in-progress reset request to its userId |
| `reset_token:<token>` | `AuthService.setPasswordConfirmOtp` / `forgotPasswordConfirmOtp` | 300s | Short-lived token that authorizes the final password write |
| refresh tokens | `JwtTokenService` | refresh-token lifetime | Server-side refresh token store (enables revocation/logout) |
| `pubsub:dedup:<sub>:<msgId>` | `PubSubService.subscribe` | 300s | Idempotency guard so a redelivered message isn't processed twice |

> All of these are **ephemeral**. Losing Redis loses in-flight OTPs/reset tokens (users retry) and forces re-login (refresh tokens gone) — but no persistent data.

---

## 3. Pub/Sub — `src/libs/pubsub/`

`PubSubService` wraps `@google-cloud/pubsub` and is the only place that talks to the broker.

### Enablement
On init it computes `enabled`:
- If `PUBSUB_ENABLED` is set → `=== 'true'`.
- Otherwise → enabled unless `NODE_ENV=local`.

When disabled, `publish()` returns `''` and `subscribe()` is skipped — the app boots fine, just without async messaging.

### Environment-scoped names
Every topic and subscription name is suffixed with `NODE_ENV` via `withEnv()`:
`email-queue` → `email-queue-local`, `email-queue-worker` → `email-queue-worker-local`. This lets one Pub/Sub project safely host `local`, `staging`, and `production` without crosstalk.

### Topics — `enums/topic.enum.ts`

| Topic | DLQ | Used by |
| --- | --- | --- |
| `EMAIL_QUEUE` (`email-queue`) | `EMAIL_QUEUE_DLQ` | Outbound email (`MailWorker`) |
| `IMAGE_PROCESSING` | `IMAGE_PROCESSING_DLQ` | Storage image-compression worker |
| `PUSH_NOTIFICATIONS`, `SMS_QUEUE`, `AUDIT_LOG`, `SESSION_LOG` | some have DLQs | Reserved / other workers |

### `publish<T>(topic, type, data)`
Wraps the payload in a `PubSubMessage<T>` envelope `{ type, data, timestamp }`, lazily creates the topic if missing (`ensureTopic`), and publishes JSON. The `type` field is what the worker switches on (e.g. `'otp'`, `'welcome'`).

### `subscribe<T>(topic, subscription, handler, dlqOptions?)`
- Lazily creates topic, DLQ topic, and subscription (`ackDeadline` 60s, retry backoff 10s→600s, `maxDeliveryAttempts` default 5 → DLQ).
- On each message: **dedup via `setNx`** → parse envelope → `await handler(parsed)` → `ack()`. On throw → `nack()` (Pub/Sub redelivers; after N attempts the message lands in the DLQ).
- Subscriptions are closed on module destroy.

### Adding a new async job
1. Add a topic (+ optional DLQ) to `topic.enum.ts`.
2. Create a publisher in `publishers/` that calls `pubSubService.publish(TOPIC, '<type>', payload)`.
3. Create a worker (`implements OnModuleInit`) that `subscribe`s and routes by `message.type`. Gate it on `pubSubService.isEnabled()`.
4. Register the worker as a provider in its module.

---

## 4. Email subsystem — `src/libs/mail/` + `src/libs/pubsub/publishers/email.publisher.ts`

### Flow components

| Piece | File | Role |
| --- | --- | --- |
| `EmailPublisher` | `pubsub/publishers/email.publisher.ts` | Thin API that publishes typed messages to `EMAIL_QUEUE`. Called from services (e.g. `AuthService`). |
| `MailWorker` | `mail/mail.worker.ts` | Subscribes to `EMAIL_QUEUE` (sub `email-queue-worker`, DLQ `email-queue-dlq`) and routes `message.type` → `MailService`. Idle when Pub/Sub is disabled. |
| `MailService` | `mail/mail.service.ts` | Renders a template and sends via Resend, or logs the email when no API key is configured. |
| Templates | `mail/templates/` | Pure functions returning `{ subject, html }`. |

### Message types (publisher ↔ worker contract)

| `type` | Publisher method | Worker → MailService | Payload |
| --- | --- | --- | --- |
| `otp` | `publishOtpEmail(email, otp)` | `sendOtpEmail` | `{ email, otp }` |
| `welcome` | `publishWelcomeEmail(email, fullName)` | `sendWelcomeEmail` | `{ email, fullName }` |
| `password-reset` | `publishPasswordResetEmail(email, otp)` | `sendPasswordResetEmail` | `{ email, otp }` |
| `password-changed` | `publishPasswordChangedEmail(email, fullName)` | `sendPasswordChangedEmail` | `{ email, fullName }` |

### Provider & dev fallback (`MailService`)
- Builds a `Resend` client only if `RESEND_API_KEY` is set; `from` is `RESEND_FROM_EMAIL` (default `noreply@hr-api.local`).
- `send(to, { subject, html })`: if no Resend client → `logger.log("[MAIL:dev] …")` with the full rendered HTML (so you can read OTPs in dev). If a client exists, it sends and logs (but does not throw) on provider errors.

### Templates — `src/libs/mail/templates/`
Each template is a pure function returning `EmailContent` (`{ subject, html }`), so they're trivially unit-testable and carry no side effects.

| Template | Signature | Subject |
| --- | --- | --- |
| `otpTemplate` | `(otp) → EmailContent` | "Your verification code" |
| `welcomeTemplate` | `(fullName) → EmailContent` | "Welcome to HR API" |
| `passwordResetTemplate` | `(otp) → EmailContent` | "Reset your password" |
| `passwordChangedTemplate` | `(fullName) → EmailContent` | "Your password was changed" |

`layout.ts` provides the shared, email-client-safe HTML shell:
- `renderLayout({ title, preheader, content })` — branded, table-based, inline-CSS wrapper (header bar, card body, footer). Inline styles + tables are required because email clients strip `<style>`/external CSS.
- `renderCode(code)` — the large, letter-spaced code block reused by OTP/reset templates.

Branding constants (name, colors) live at the top of `layout.ts` — change them there to re-theme every email at once.

#### Adding / editing a template
1. Add `src/libs/mail/templates/<name>.template.ts` exporting `function <name>Template(args): EmailContent` that calls `renderLayout(...)`.
2. Add a `MailService.send<Name>Email(...)` method that calls it.
3. Add a publisher method + a `case` in `MailWorker.handle` (and a new message `type`) if it's triggered asynchronously.
4. Keep all visual styling inline; preview by sending to a real inbox or pasting the rendered HTML into an email-preview tool.

---

## 5. Local dev runbook

To exercise the OTP / password flows end-to-end locally:

```bash
# 1. Redis (refresh tokens, OTPs, reset tokens, dedup)
#    any local Redis works; then in .env.local:
APP_REDIS_URL=redis://127.0.0.1:6379

# 2. Pub/Sub emulator (so publish/subscribe actually move messages)
pnpm pubsub:emulator           # docker compose, listens on localhost:8085
#    then in .env.local:
PUBSUB_ENABLED=true
PUBSUB_EMULATOR_HOST=localhost:8085

# 3. Email provider — leave the key EMPTY in dev to log emails instead of sending
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@hr-api.local

# 4. Run
pnpm start:dev
```

Then:
1. `POST /api/v1/auth/registration/register` `{ "fullName": "...", "email": "...", "acceptTerms": true }` → returns `{ requestId }`.
2. Read the OTP from the **app log** (the `[MAIL:dev]` line from `MailService`).
3. `POST /api/v1/auth/registration/verify-otp` `{ requestId, otp }` → tokens (status `pending`).
4. `POST /api/v1/auth/registration/setup-password` (Bearer) `{ password, confirmPassword }` → account `active`.

The reset-password and authenticated set-password flows work the same way (OTP arrives in the log).

To send **real** emails locally, set a valid `RESEND_API_KEY` (and a verified `RESEND_FROM_EMAIL` domain in Resend).

---

## 6. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Register returns `requestId` but no OTP anywhere | `PUBSUB_ENABLED=false` (publish is a no-op) | Set `PUBSUB_ENABLED=true` + run the emulator, or temporarily call MailService inline |
| OTP never appears in logs but Pub/Sub is on | Worker didn't subscribe / emulator unreachable | Check the `MailWorker` "Subscribed to email-queue-worker" log; verify `PUBSUB_EMULATOR_HOST` |
| `otp.expired` on verify | OTP TTL (600s) passed, or Redis was flushed/restarted | Resend the OTP (`resend-otp`) |
| Login returns 403 `password_not_set` | User is `pending` (verified but never set a password) | Complete `setup-password` |
| Emails attempted but never arrive (key set) | Resend domain not verified / send error | Check `MailService` error logs; verify the `RESEND_FROM_EMAIL` domain in Resend |
| Same email sent twice | Two distinct messages, or dedup window (300s) exceeded on redelivery | Expected only across long redelivery gaps; check publisher call sites |
| Messages piling in `email-queue-dlq` | Handler threw ≥5×; bad payload or provider outage | Inspect DLQ messages and `MailWorker`/`MailService` error logs |

---

## 7. Related config (`.env`)

| Variable | Default | Notes |
| --- | --- | --- |
| `APP_REDIS_URL` | — | Empty = no Redis (auth that needs it fails) |
| `APP_REDIS_SSL_CONNECTION` | `false` | `true` enables TLS |
| `PUBSUB_ENABLED` | enabled unless `NODE_ENV=local` | Master switch for publish/subscribe |
| `PUBSUB_PROJECT_ID` | falls back to `GCS_PROJECT_ID` | GCP project for Pub/Sub |
| `PUBSUB_KEY_FILE` | falls back to `GCS_KEY_FILE` | Service-account JSON; omit with the emulator / ADC |
| `PUBSUB_EMULATOR_HOST` | — | e.g. `localhost:8085`; read by the Google client library |
| `RESEND_API_KEY` | — | Empty = log emails instead of sending |
| `RESEND_FROM_EMAIL` | `noreply@hr-api.local` | Must be a verified domain to send for real |
