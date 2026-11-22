# WedPlan - REST API

A RESTful backend API for **WedPlan**, a wedding planning platform that connects customers with wedding service providers. It supports service management, booking workflows, vendor subscriptions, payment processing, and administrative operations.

Built with Node.js, Express 5, TypeScript, MongoDB, Stripe, and Better Auth JWT verification.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Architecture](#project-architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Overview](#api-overview)
- [Authentication and Authorization](#authentication-and-authorization)
- [Booking Workflow](#booking-workflow)
- [Payment Integration](#payment-integration)
- [Error Handling](#error-handling)
- [Deployment](#deployment)

## Features

- **Authentication and Authorization:** Secure JWT verification with Better Auth and role-based access control.
- **User Management:** Support for customers, vendors, and administrators.
- **Service Management:** Create, manage, retrieve, and moderate wedding services.
- **Booking Management:** Create bookings, check availability, cancel bookings, and manage booking requests.
- **Booking Validation:** Prevent duplicate active bookings and invalid booking operations.
- **Vendor Subscriptions:** Premium vendor subscription management using Stripe.
- **Payment Processing:** Stripe Checkout integration and subscription payment history.
- **Stripe Webhooks:** Handle checkout completion, subscription updates, payment success, payment failure, and expiration events.
- **Admin Dashboard API:** Administrative statistics, user management, service moderation, and transaction management.
- **Content Management:** Public endpoints for categories and testimonials.
- **Database Optimization:** MongoDB indexes and efficient database queries.
- **Centralized Error Handling:** Consistent API error responses.
- **Input Validation:** Request validation using Zod.
- **Security:** Helmet, CORS, and Express rate limiting.

## Technology Stack

| Technology | Purpose |
| --- | --- |
| Node.js 26 | JavaScript runtime |
| Express 5 | REST API framework |
| TypeScript 7 | Static type checking |
| MongoDB 7 | Database |
| Better Auth | Authentication and JWT verification |
| Stripe | Subscription and payment processing |
| Zod 4 | Request validation |
| jose | JWT verification |
| Helmet | HTTP security headers |
| CORS | Cross-origin resource sharing |
| express-rate-limit | API rate limiting |
| Morgan | HTTP request logging |
| dotenv | Environment configuration |

## System Architecture

The following diagram illustrates the overall architecture of the WedPlan backend,
including authentication, request handling, business logic, database operations,
and Stripe payment integration.

```mermaid
flowchart TB
    CLIENT["Frontend Application"]
    API["Express 5 REST API"]
    AUTH["Authentication & Authorization"]
    ROUTES["Route Layer"]
    CONTROLLERS["Controller Layer"]
    SERVICES["Service Layer"]
    DB[("MongoDB")]
    BA["Better Auth"]
    STRIPE["Stripe"]

    CLIENT --> API
    BA -.-> AUTH
    API --> AUTH
    AUTH --> ROUTES
    ROUTES --> CONTROLLERS
    CONTROLLERS --> SERVICES
    SERVICES --> DB
    SERVICES <--> STRIPE
    STRIPE -->|"Webhooks"| API
```

**My recommendation:** Use the first, more detailed diagram as your README architecture visualization. It communicates your backend's modular design and integrations much better than a simple frontend-to-database diagram.

## Project Architecture

The backend follows a modular architecture that separates HTTP handling, business logic, request validation, and routing.

```text
wedding-plan-server/
│
├── src/
│   ├── config/
│   │   ├── db.ts
│   │   ├── env.ts
│   │   ├── cors.ts
│   │   ├── stripe.ts
│   │   ├── constants.ts
│   │   └── content.ts
│   │
│   ├── controllers/
│   │   ├── content.controller.ts
│   │   ├── user.controller.ts
│   │   ├── admin.controller.ts
│   │   ├── booking.controller.ts
│   │   ├── payment.controller.ts  HTTP checkout response and payment history response
│   │   ├── service.controller.ts
│   │   └── stripe-webhook.controller.ts
│   │
│   ├── middlewares/
|   |   ├── auth.ts
│   │   ├── error.ts
│   │   └── rateLimit.ts
│   │
│   ├── routes/
│   │   ├── admin.routes.ts
│   │   ├── booking.routes.ts
│   │   ├── payment.routes.ts  // Authentication, vendor role, rate limiter, route registration
│   │   ├── service.routes.ts
│   │   ├── stripe-webhook.routes.ts
│   │   ├── users.routes.ts
│   │   ├── index.ts
│   │   └── content.routes.ts
│   │
│   ├── schemas/
|   |   ├── admin.schema.ts
│   │   ├── booking.schema.ts
│   │   └── service.schema.ts
│   │
│   ├── services/
│   │   ├── admin.service.ts
│   │   ├── booking.service.ts
│   │   ├── payment.service.ts
│   │   └── service.service.ts
│   │
│   ├── utils/
│   │   ├── ApiError.ts
│   │   ├── dates.ts
│   │   ├── ids.ts
│   │   ├── lookups.ts
│   │   ├── params.ts
│   │   ├── premium.ts
│   │   ├── query.ts
│   │   ├── serializers.ts
│   │   └── stripe.helpers.ts
│   │
│   ├── app.ts
|   |
│   └── index.ts
│
├── scripts/
│   └── make-admin.ts
│
├── .env
├── .env.example
├── .gitignore
├── .nvmrc
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

*Note: The tree illustrates the main architectural modules. Add any additional files or directories present in your actual repository.*

### Architecture Responsibilities

| Layer | Responsibility |
| --- | --- |
| Routes | Define API endpoints and middleware |
| Controllers | Handle HTTP requests and responses |
| Services | Implement business logic and database operations |
| Schemas | Validate incoming request data |
| Middlewares | Authentication, authorization, and error handling |
| Config | Environment variables and database configuration |
| Utils | Shared helper functions and transformations |

## Getting Started

### Prerequisites

Make sure you have installed:

- Node.js 26 or a compatible version satisfying the project's engine requirement.
- npm.
- MongoDB database.
- Stripe account for payment integration.
- Better Auth configured for authentication.

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Navigate to the backend directory:

```bash
cd wedding-plan-server
```

### 2. Install Dependencies

```bash
npm ci --include=dev
```

### 3. Configure Environment Variables

Create a `.env` file in the project root.

See the [Environment Variables](#environment-variables) section for configuration details.

### 4. Run the Development Server

```bash
npm run dev
```

The development server starts using `tsx` with watch mode.

### 5. Build the Project

```bash
npm run build
```

### 6. Run the Production Build

```bash
npm start
```

## Environment Variables

Configure the following variables according to your deployment environment and `src/config/env.ts`.

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string |
| `PORT` | Local development server port |
| `NODE_ENV` | Application environment |
| `APP_TIMEZONE` | Application timezone |
| `STRIPE_PREMIUM_PRICE_ID` | Stripe recurring Price ID (optional when using inline pricing) |
| `PREMIUM_PRICE_AMOUNT` | Premium subscription amount in the currency's smallest unit |
| `PREMIUM_CURRENCY` | Premium subscription currency |

Example local configuration:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
APP_TIMEZONE=Asia/Dhaka

# Stripe configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Use a Stripe Price ID or configure inline pricing
STRIPE_PREMIUM_PRICE_ID=price_your_price_id

# Alternative inline pricing
PREMIUM_PRICE_AMOUNT=50000
PREMIUM_CURRENCY=bdt
```

**Important:**

- Never commit your `.env` file or expose secret keys.
- Use Stripe test keys and test-mode Price IDs during development.
- Stripe Price IDs are specific to test or live mode.
- Keep environment variable names synchronized with `src/config/env.ts`.
- The example above includes Stripe variable names used by the integration; verify all required variables against your actual environment schema.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server with file watching |
| `npm run build` | Clean and compile TypeScript |
| `npm start` | Start the compiled production server |
| `npm run clean` | Remove the `dist` directory |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run check` | Run project type checks |
| `npm run format` | Format files with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run make-admin` | Run the admin creation script |

## API Overview

The API is organized into resource-based route modules.

### Content API

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/categories` | Retrieve service categories |
| GET | `/testimonials` | Retrieve testimonials |

### Services API

Provides service-related operations, including service creation, retrieval, updates, and management.

### Bookings API

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/bookings` | Create a booking |
| GET | `/bookings/check` | Check booking availability |
| GET | `/bookings/mine` | Retrieve customer bookings |
| GET | `/bookings/vendor` | Retrieve vendor bookings |
| PATCH | `/bookings/:id/cancel` | Cancel a customer's pending booking |
| PATCH | `/bookings/:id/status` | Update a vendor's booking status |

### Payments API

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/payments/create-checkout-session` | Create a Stripe Checkout session |
| GET | `/payments/mine` | Retrieve vendor payment history |
| POST | `/payments/webhook` | Process Stripe webhook events |

### Admin API

Provides administrative operations for:

- Dashboard statistics.
- User listing and blocking.
- Service listing and moderation.
- Service deletion.
- Transaction listing.

*Note: The endpoint paths above are relative to the corresponding route prefixes. Confirm the final mounted paths in `src/index.ts` and your route files before publishing API documentation.*

## Authentication and Authorization

The API uses Better Auth JWT verification to authenticate incoming requests.

Authenticated requests are associated with a user identity, which is used to enforce role-based permissions.

Supported roles:

- `customer`
- `vendor`
- `admin`

Protected endpoints require a valid authentication token. Role-specific middleware restricts access to authorized users.

Administrative endpoints require administrator privileges.

## Booking Workflow

The booking module implements the following workflow:

1. A customer selects an available wedding service.
2. The customer submits a booking request with event details.
3. The API validates the request and checks service availability.
4. The booking is created with a pending status.
5. The vendor reviews the booking request.
6. The vendor accepts or rejects the request.
7. Customers can cancel their own pending bookings.

Additional safeguards include:

- Customers cannot book their own services.
- Inactive or unapproved services cannot be booked.
- Booking dates must be in the future.
- Duplicate active bookings are prevented.
- MongoDB indexes help enforce booking constraints.

## Payment Integration

Stripe handles premium vendor subscriptions.

### Checkout Process

1. A vendor requests a premium subscription.
2. The API verifies the vendor's eligibility.
3. The backend creates a Stripe Checkout Session.
4. The frontend redirects the vendor to Stripe Checkout.
5. Stripe processes the payment.
6. Stripe sends webhook events to the backend.
7. The backend synchronizes the vendor's subscription status.

### Webhook Events

The integration handles events including:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.expired`
- `invoice.payment_succeeded`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

**Webhook security:** Stripe webhook requests are verified using the webhook signing secret. The webhook route uses raw request-body parsing and must be registered before the general `express.json()` middleware.

## Error Handling

The application uses centralized error handling to provide consistent API responses.

Request validation is performed using Zod schemas.

Invalid requests, authentication failures, authorization failures, missing resources, and unexpected server errors are handled through the centralized error middleware.

## Deployment

The backend is configured for deployment through Vercel with automatic GitHub integration.

### Deployment Workflow

1. Push the latest changes to GitHub.
2. Vercel detects the new commit.
3. Vercel installs dependencies.
4. Vercel runs the production build.
5. The application is deployed.

### Vercel Configuration

| Setting | Value |
| --- | --- |
| Install Command | `npm ci --include=dev` |
| Build Command | `npm run build` |
| Node.js Version | 26 |
| Root Directory | Directory containing the backend `package.json` |

Configure the required production environment variables in Vercel Project Settings.

Vercel manages the serverless runtime and port. Do not hardcode a production `PORT` value for Vercel deployment.

### Production Checklist

- [ ] Configure MongoDB production connection.
- [ ] Configure Better Auth JWT verification.
- [ ] Configure Stripe live-mode credentials.
- [ ] Configure Stripe webhook endpoint and signing secret.
- [ ] Set `APP_TIMEZONE`.
- [ ] Configure CORS for the frontend domain.
- [ ] Verify all required environment variables.
- [ ] Confirm the production build succeeds.
- [ ] Test authentication and protected endpoints.
- [ ] Test booking and payment workflows.

## License

This project was developed as part of a full-stack web engineering project.
