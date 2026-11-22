# WedPlan Server

REST API for the WedPlan wedding planning platform: **Node.js + Express + TypeScript + MongoDB**, with **Stripe Checkout** for Premium vendors. It trusts the **Better Auth JWT** that your Next.js app issues.

> Status: written to the assignment, **not yet run against your database or Stripe account**. Run `npm run typecheck` first, then test the flows in the checklist at the bottom.

## Folder structure

```text
server/
├─ src/
│  ├─ index.ts                  starts the server (connect DB, listen, graceful shutdown)
│  ├─ app.ts                    builds the Express app (helmet, CORS, Stripe raw body, routes, errors)
│  ├─ config/
│  │  ├─ env.ts                 validates environment variables (fails fast with a clear message)
│  │  ├─ db.ts                  MongoDB connection, typed collections, indexes
│  │  ├─ cors.ts · stripe.ts
│  │  ├─ constants.ts           roles, statuses, FREE_LIMIT = 3, price types
│  │  └─ content.ts             the 6 categories + sample testimonials (no extra collections)
│  ├─ middleware/
│  │  ├─ auth.ts                authenticate (JWT) + requireRole(...)
│  │  ├─ error.ts               404 + one error handler (401/403/404/409/422/500)
│  │  └─ rateLimit.ts
│  ├─ routes/
│  │  ├─ index.ts               mounts everything
│  │  ├─ content.routes.ts      /categories, /testimonials
│  │  ├─ services.routes.ts     public browse + vendor service management
│  │  ├─ bookings.routes.ts     customer requests + vendor accept / reject
│  │  ├─ payments.routes.ts     Stripe checkout session + the webhook
│  │  ├─ users.routes.ts        /users/me
│  │  └─ admin.routes.ts        admin only: users, services, transactions, stats
│  └─ utils/                    ApiError, asyncHandler, ids, dates, premium, serializers, lookups, query
├─ scripts/make-admin.ts        promote an account to admin
├─ .env.example · package.json · tsconfig.json
```

You asked for `app.js` and `index.js`. Because this is TypeScript they are `src/app.ts` and `src/index.ts`; `npm run build` compiles them to `dist/app.js` and `dist/index.js`.

## Setup

```bash
npm install
cp .env.example .env        # fill it in
npm run dev                 # http://localhost:5000
```

| Variable | What it is |
| --- | --- |
| `MONGODB_URI`, `DB_NAME` | The **same database** Better Auth uses (default `wedding-planning-platform`). |
| `USERS_COLLECTION`, `SESSIONS_COLLECTION` | Better Auth's collection names (`user`, `session` by default). |
| `BETTER_AUTH_URL` | Base URL of the Next.js app. Must equal `BETTER_AUTH_URL` in `auth.ts` exactly, because it is the JWT issuer and audience and the JWKS source. |
| `CLIENT_URL` | Allowed browser origins (comma separated). The first is used for Stripe redirects. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe test keys. Never commit them. |
| `STRIPE_PREMIUM_PRICE_ID` **or** `PREMIUM_PRICE_AMOUNT` + `PREMIUM_CURRENCY` | The Premium price. The assignment gives none, so you choose it. |
| `APP_TIMEZONE` | Decides what "today" is for event dates (default `Asia/Dhaka`). |

**Create the admin account** (admins can never come from public sign-up): register normally on the site, then run `npm run make-admin -- you@example.com`.

**Stripe webhook locally:** `stripe listen --forward-to localhost:5000/payments/webhook`, and put the printed `whsec_...` in `.env`. In production, add the endpoint `https://<your-api>/payments/webhook` in the Stripe dashboard with these events: `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `invoice.paid`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`.

## How security works

- **JWT verification:** `authenticate` checks the Bearer token's signature (against Better Auth's JWKS), issuer, audience and expiry. Invalid or expired token: **401**.
- **Role and blocked status come from the database**, never from the token or request body. A blocked account gets **403** on its next request, and blocking also deletes its sessions.
- **`requireRole`** gates every protected route: wrong role gets **403**.
- **Ownership:** vendors and customers can only touch their own services and bookings. Accept, reject and cancel are single atomic updates that only match `status: "pending"` for the right owner, so a request can't be processed twice.
- **Identity is never trusted from the client:** `vendorId` and `customerId` are taken from the token and the service record.
- **Premium** is activated and removed **only** by the signature-verified Stripe webhook. The success redirect and the checkout route never touch it. Webhook handlers are idempotent (unique indexes on Stripe ids).
- **Transactions are read-only** for everyone: there is no create, update or delete route for them.
- Validation (zod) on every input, a regex-escaped search, helmet, CORS allow-list, rate limits, a 100 KB body limit.

## Endpoints

Public: `GET /services` (approved and active only; `search, category, location, minPrice, maxPrice, sort=rating|newest|price_asc|price_desc, page, limit`; total in `X-Total-Count`), `GET /services/stats`, `GET /services/:id`, `GET /categories`, `GET /testimonials`, `GET /health`.

| Who | Endpoint | Notes |
| --- | --- | --- |
| any signed-in | `GET /users/me` | |
| vendor | `GET /services/mine`, `GET /services/mine/:id` | all statuses |
| vendor | `POST /services` | starts `pending`; **403 `FREE_LIMIT`** past 3 active on Free |
| vendor | `PATCH /services/:id`, `PATCH /services/:id/availability`, `DELETE /services/:id` | owner only; delete refused (409) while pending/accepted requests exist |
| customer, vendor | `POST /bookings` | not your own service, future date, no duplicate active request |
| customer, vendor | `GET /bookings/mine`, `GET /bookings/check`, `PATCH /bookings/:id/cancel` | pending only |
| vendor | `GET /bookings/vendor`, `PATCH /bookings/:id/status` | `accepted` or `rejected`, pending only |
| vendor | `POST /payments/create-checkout-session`, `GET /payments/mine` | |
| Stripe | `POST /payments/webhook` | signature verified |
| admin | `GET /admin/stats`, `GET /admin/users`, `PATCH /admin/users/:id/block` | cannot block admins or yourself |
| admin | `GET /admin/services`, `PATCH /admin/services/:id/status`, `DELETE /admin/services/:id` | |
| admin | `GET /admin/transactions` | read-only |

Admins cannot submit bookings. Errors are JSON `{ message, code?, errors? }`. Codes you may want in the UI: `FREE_LIMIT`, `DUPLICATE_BOOKING`, `NOT_PENDING`, `HAS_ACTIVE_BOOKINGS`, `UNAVAILABLE`, `ACCOUNT_BLOCKED`, `TOKEN_EXPIRED`.

Database: your three business collections `services`, `bookings`, `transactions` (fields as in the assignment; services are stored with `serviceName` and returned as both `name` and `serviceName`), plus Better Auth's own collections.

## Connecting the Next.js client

The client was written against a json-server mock, which has no security, so a few calls change:

| Client function | Now call |
| --- | --- |
| `getFeaturedServices`, `getAllServices` | `GET /services?sort=rating&limit=6` (or `limit=500`). Vendor info is already inside each service. |
| `getCategoryCounts`, `getPlatformStats`, `getLocationCounts` | `GET /services/stats` (`byCategory`, `byLocation`, totals) |
| `getServiceById` | `GET /services/:id`. 404 = not found, 403 = unavailable. |
| `hasActiveBooking` | `GET /bookings/check?serviceId=&eventDate=` (send the token) returns `{ exists }` |
| `createBooking` | `POST /bookings` with the token and body `{ serviceId, eventDate, eventLocation, message }` only |
| `getMyBookings` / `cancelBooking` | `GET /bookings/mine` / `PATCH /bookings/:id/cancel` |
| vendor-api | `GET /services/mine`, `/services/mine/:id`, `POST /services`, `PATCH /services/:id`, `PATCH /services/:id/availability`, `DELETE /services/:id`, `GET /bookings/vendor`, `PATCH /bookings/:id/status` |
| admin-api | `GET /admin/users`, `PATCH /admin/users/:id/block { blocked }`, `GET /admin/services`, `PATCH /admin/services/:id/status`, `DELETE /admin/services/:id`, `GET /admin/transactions` |

Stop sending `customerId`, `vendorId`, `status` or `createdAt` from the client. The server sets them. Set `NEXT_PUBLIC_API_URL` to this server's URL. These client API files still need updating to the table above.

## Deploy

Use a long-running host (Render, Railway, Fly.io): `npm run build`, then `npm start`. Set every variable from `.env.example`, add the production origin to `CLIENT_URL`, and register the Stripe webhook. Serverless hosts need extra care so the webhook still receives the raw body.

## Known limits

- The Free-plan limit check (count, then insert) isn't atomic, so two simultaneous requests could slip a 4th service through.
- Editing an approved service doesn't send it back for re-review.
- There are no automated tests yet.

## Test checklist

1. Sign up as a vendor, add 3 services (all `pending`), and try a 4th: expect 403 `FREE_LIMIT`.
2. As admin, approve a service: it appears in `GET /services`. Reject it: it disappears.
3. As a customer, book it twice for the same date: the second returns 409. Book your own service: 403.
4. As the vendor, accept the request, then accept again: 409.
5. Block a user in the admin dashboard: their next API call returns 403 `ACCOUNT_BLOCKED`.
6. Pay with Stripe test card `4242 4242 4242 4242`: after the webhook, the vendor shows Premium and a `paid` row appears in transactions. Check the redirect alone does not activate it.
7. Call a protected route with no token (401), a customer token on an admin route (403), and an expired token (401).
