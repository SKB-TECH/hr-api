# Google and LinkedIn OpenID Connect

The API uses the existing NestJS/TypeORM authentication and JWT cookie flow.
OAuth identities are stored separately from users; a provider email match never
links or logs into an existing account automatically.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/auth/google` | Start Google OIDC |
| GET | `/api/v1/auth/google/callback` | Complete Google OIDC |
| GET | `/api/v1/auth/linkedin` | Start LinkedIn OIDC |
| GET | `/api/v1/auth/linkedin/callback` | Complete LinkedIn OIDC |
| GET | `/api/v1/auth/connected-accounts` | List the signed-in user's connections |
| POST | `/api/v1/auth/connected-accounts/:provider/link` | Start an authenticated link |
| DELETE | `/api/v1/auth/connected-accounts/:provider` | Remove a connection |
| POST | `/api/v1/auth/oauth/email` | Request OTP if the provider has no verified email |
| POST | `/api/v1/auth/oauth/verify-email` | Verify email and finish account creation |

LinkedIn uses only `openid profile email`. OAuth codes, access tokens, ID tokens,
and provider secrets are not returned to frontend JavaScript or logged.

## Database migration

Apply the TypeORM migration before deploying the new API:

```sh
pnpm typeorm:local:migration:run
```

In production, use the existing production migration command as part of the
deployment. The migration creates `oauth_accounts`, its foreign key to `users`,
and a unique constraint on `(provider, provider_account_id)`. It does not
backfill old provider-only user rows because those rows have no provider subject
ID. Legacy Google accounts are recovered only after an OTP is sent to and
verified against the email already on that account; other existing accounts
must sign in and explicitly connect a provider.

## Environment configuration

Set the provider credentials, callback URLs, and `FRONTEND_URL` in the API
environment. Set `BACKEND_URL` in the hr-app Next.js server environment for its
proxy. Never put client secrets in Next.js `NEXT_PUBLIC_*` variables:

```dotenv
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://<public-frontend-host>/api/proxy/auth/google/callback
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_CALLBACK_URL=https://<public-frontend-host>/api/proxy/auth/linkedin/callback
FRONTEND_URL=https://<public-frontend-host>
BACKEND_URL=https://<api-origin>
```

The local values currently documented in `.env.example` use
`http://localhost:3000/api/proxy/auth/google/callback` and
`http://localhost:3000/api/proxy/auth/linkedin/callback`. The callback must be
registered exactly as configured and must reach the Next.js proxy, which
forwards the API's httpOnly session cookies.

`BACKEND_URL` is used by the Next.js proxy as the API origin; provider callback
URLs use the frontend proxy so the session is established on the app's origin.
The API also supports the existing `WEB_APP_URL` as a fallback for
`FRONTEND_URL`.

## Provider setup

### Google

1. In Google Cloud Console, select or create a project and configure the OAuth
   consent screen and authorized domains.
2. Create an OAuth 2.0 **Web application** client.
3. Add the public frontend origin to Authorized JavaScript origins if required
   by the console.
4. Add the exact value of `GOOGLE_CALLBACK_URL` to Authorized redirect URIs.
5. Copy the client ID and secret into the API environment.

### LinkedIn

1. Create an app in the LinkedIn Developer Portal and associate the required
   company page.
2. Request/enable the **Sign In with LinkedIn using OpenID Connect** product.
3. Add the exact value of `LINKEDIN_CALLBACK_URL` as an authorized redirect URL.
4. Copy the client ID and secret into the API environment. The implementation
   requests only `openid`, `profile`, and `email`.

Both providers must have their production redirect URL configured before
deployment. A real login with each provider is still required to verify tenant,
consent-screen, redirect-URI, and provider-side access settings.

## Security behavior

- OIDC discovery and the OIDC client validate ID token signature, issuer,
  audience, expiration, and nonce.
- `state` is random, stored briefly in Redis, bound to an httpOnly SameSite=Lax
  cookie, and consumed once. PKCE uses S256.
- Redirect destinations are limited to same-site candidate/company paths.
- A new account requires a verified provider email, or an email verified through
  the existing OTP mail flow. An email collision requires the user to sign in
  and explicitly connect the provider from settings.
- Unlinking is rejected when it would remove the last usable sign-in method.
- Existing application roles and enabled profiles are retained when a provider
  is linked.

## Tests

Run focused authentication tests:

```sh
pnpm exec jest --forceExit --runInBand src/app/modules/auth/auth.service.spec.ts src/app/modules/auth/auth.controller.spec.ts src/app/modules/auth/oidc-auth.service.spec.ts
```

Provider credentials are not included in the repository. Passing automated tests
does not replace a real Google and LinkedIn sign-in test.
