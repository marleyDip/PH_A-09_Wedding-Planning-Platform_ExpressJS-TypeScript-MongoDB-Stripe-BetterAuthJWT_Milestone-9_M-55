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

![WedPlan System Architecture](./docs/wedplan-system-architecture.png)

![WedPlan System Diagram](./docs/mermaid-diagram.png)

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
│   │   ├── service.controller.ts
│   │   ├── payment.controller.ts
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
│   │   ├── payment.routes.ts
│   │   ├── stripe-webhook.routes.ts
│   │   ├── service.routes.ts
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

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/categories` | Public | Retrieve service categories |
| GET | `/testimonials` | Public | Retrieve testimonials |

### Services API

The Services API allows vendors to create, manage, update, and delete their wedding-related services. Public users can browse available services, view service details, and access service statistics. Authenticated vendors can manage only their own services and update their availability.

### Services Base Endpoint

`/services`

### Services API Endpoints

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/services` | Public | Retrieve all available services. |
| GET | `/services/stats` | Public | Retrieve service statistics and summary information. |
| GET | `/services/:id` | Public | Retrieve detailed information about a specific service. |
| GET | `/services/mine` | Vendor | Retrieve all services created by the authenticated vendor. |
| GET | `/services/mine/:id` | Vendor | Retrieve a specific service owned by the authenticated vendor. |
| POST | `/services` | Vendor | Create a new wedding service. |
| PATCH | `/services/:id` | Vendor | Update an existing service owned by the authenticated vendor. |
| PATCH | `/services/:id/availability` | Vendor | Update the availability of a specific service. |
| DELETE | `/services/:id` | Vendor | Delete a service owned by the authenticated vendor. |

### Services Access Control

- **Public:** Anyone can browse services, view service details, and access service statistics without authentication.
- **Vendor:** Requires an authenticated vendor account. Vendors can manage only their own services.
- **Ownership Verification:** Protected service operations verify that the requested service belongs to the authenticated vendor.

### Services Main Features

- Browse and retrieve available wedding services.
- View detailed information about individual services.
- Access service statistics.
- Create new wedding service listings.
- Update service information and availability.
- Retrieve vendor-specific service listings.
- Delete services owned by the authenticated vendor.

### Service Example Requests

#### Get all services

```http
GET /services
```

#### Get a specific service

```http
GET /services/:id
Content-Type: application/json
Authorization: Bearer <token>
```

#### Create a service

```http
POST /services
Content-Type: application/json
Authorization: Bearer <token>
```

#### Update a service

```http
PATCH /services/:id
Content-Type: application/json
Authorization: Bearer <token>
```

#### Update service availability

```http
PATCH /services/:id/availability
Content-Type: application/json
Authorization: Bearer <token>
```

#### Delete a service

```http
DELETE /services/:id
Authorization: Bearer <token>
```

> **Note:** Vendor-only endpoints require a valid authentication token and vendor authorization. Request bodies must follow the corresponding service validation schemas.

### Bookings API

The Bookings API manages the wedding service booking process between customers and vendors. Customers can create bookings, check service availability, view their booking history, and cancel pending bookings. Vendors can view booking requests and update their booking statuses.

### Bookings Base Endpoint

`/bookings`

### Bookings API Endpoints

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/bookings` | Customer | Create a booking for a wedding service. |
| GET | `/bookings/check` | Public | Check the availability of a service for a requested event date. |
| GET | `/bookings/mine` | Customer | Retrieve bookings created by the authenticated customer. |
| GET | `/bookings/vendor` | Vendor | Retrieve booking requests received by the authenticated vendor. |
| PATCH | `/bookings/:id/cancel` | Customer | Cancel the customer's own pending booking. |
| PATCH | `/bookings/:id/status` | Vendor | Update the status of a booking request. |

### Bookings Access Control

- **Public:** Anyone can check service booking availability.
- **Customer:** Requires an authenticated customer account. Customers can create bookings, view their own bookings, and cancel their own pending bookings.
- **Vendor:** Requires an authenticated vendor account. Vendors can view bookings associated with their services and update booking statuses.
- **Ownership Verification:** Protected operations verify that the authenticated user owns the relevant booking or has permission to manage it.

### Bookings Main Features

- Create wedding service bookings.
- Check service availability before booking.
- Retrieve customer-specific booking history.
- Retrieve vendor-specific booking requests.
- Cancel pending customer bookings.
- Update booking statuses from the vendor dashboard.
- Protect booking operations through authentication and ownership verification.

### Bookings Example Requests

#### Create a Booking

```http
POST /bookings
Content-Type: application/json
Authorization: Bearer <token>
```

#### Check Booking Availability

```http
GET /bookings/check
```

#### Get My Bookings

```http
GET /bookings/mine
Authorization: Bearer <token>
```

#### Get Vendor Bookings

```http
GET /bookings/vendor
Authorization: Bearer <token>
```

#### Cancel a Booking

```http
PATCH /bookings/:id/cancel
Authorization: Bearer <token>
```

#### Update Booking Status

```http
PATCH /bookings/:id/status
Content-Type: application/json
Authorization: Bearer <token>
```

> **Note:** Customer and vendor endpoints require valid authentication and role authorization. Customers can cancel only their own pending bookings, while vendors can update bookings associated with their services. Request bodies and query parameters must follow the corresponding validation schemas.

### Payments API

The Payments API handles vendor subscription payments through Stripe. Vendors can create Stripe Checkout sessions to purchase or upgrade their subscription plans and view their payment history. Stripe sends webhook events to the backend to notify the application about payment status changes.

### Payments Base Endpoint

`/payments`

### Payments API Endpoints

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/payments/create-checkout-session` | Vendor | Create a Stripe Checkout session for a vendor subscription payment. |
| GET | `/payments/mine` | Vendor | Retrieve the authenticated vendor's payment and transaction history. |
| POST | `/payments/webhook` | Stripe Signature | Receive and process Stripe webhook events to update payment and subscription statuses. |

### Payments Access Control

- **Vendor:** Requires an authenticated vendor account. Vendors can create checkout sessions and view only their own payment history.
- **Stripe Signature:** This endpoint is called by Stripe, not directly by users. Requests are verified using the `STRIPE_WEBHOOK_SECRET` signing secret.

### Payments Features

- Create secure Stripe Checkout sessions.
- Process vendor subscription payments.
- Retrieve vendor-specific transaction history.
- Verify Stripe webhook signatures.
- Handle payment lifecycle events and synchronize transaction statuses.
- Update vendor subscription information after successful payment events.

### Payments Example Requests

#### Create Checkout Session

```http
POST /payments/create-checkout-session
Content-Type: application/json
Authorization: Bearer <token>
```

#### Get My Payments

```http
GET /payments/mine
Authorization: Bearer <token>
```

#### Stripe Webhook

```http
POST /payments/webhook
Content-Type: application/json
Stripe-Signature: <stripe-signature>
```

### Stripe Webhook Security

The webhook endpoint verifies incoming requests using Stripe's signature verification mechanism and the configured `STRIPE_WEBHOOK_SECRET`.

**Important implementation details:**

- The webhook route must use the raw request body (`express.raw`) for signature verification.
- Mount the webhook route before `express.json()` middleware.
- Never expose Stripe secret keys or webhook signing secrets in frontend code.
- Process verified webhook events to keep payment and subscription records synchronized.

> **Note:** Vendor endpoints require a valid authentication token and vendor authorization. The webhook endpoint requires a valid Stripe signature instead of vendor authentication.

### Admin API

The Admin API provides administrative tools for managing the WedPlan platform. Authorized administrators can monitor platform statistics, manage user accounts, review and moderate wedding services, and track payment transactions through a centralized dashboard.

### Admin Base Endpoint

`/admin`

### Admin API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/admin/stats` | Retrieve statistics and summary data for the admin dashboard. |
| GET | `/admin/users` | Retrieve a list of registered users. |
| PATCH | `/admin/users/:id/block` | Block or unblock a specific user account. |
| GET | `/admin/services` | Retrieve a list of wedding services across the platform. |
| PATCH | `/admin/services/:id/status` | Approve or reject a submitted wedding service. |
| DELETE | `/admin/services/:id` | Delete a specific service from the platform. |
| GET | `/admin/transactions` | Retrieve payment and transaction records across the platform. |

### Admin Access Control

- **Admin Only:** All endpoints require an authenticated administrator account.
- **Authentication:** Requests must include a valid authentication token.
- **Role Authorization:** The backend verifies the user's admin role before allowing access.
- **Resource Validation:** Operations validate the requested user or service before making changes.

### Admin Main Features

- View platform-wide dashboard statistics.
- Monitor and manage registered users.
- Block or unblock user accounts.
- Review all wedding service listings.
- Approve or reject vendor-submitted services.
- Remove inappropriate or unwanted services.
- Monitor payment transactions and subscription activity.

Provides administrative operations for:

- Dashboard statistics.
- User listing and blocking.
- Service listing and moderation.
- Service deletion.
- Transaction listing.

### Admin Example Requests

#### Get Dashboard Statistics

```http
GET /admin/stats
Authorization: Bearer <token>
```

#### Get All Users

```http
GET /admin/users
Authorization: Bearer <token>
```

#### Block or Unblock a User

```http
PATCH /admin/users/:id/block
Content-Type: application/json
Authorization: Bearer <token>
```

#### Get All Services

```http
GET /admin/services
Authorization: Bearer <token>
```

#### Approve or Reject a Service

```http
PATCH /admin/services/:id/status
Content-Type: application/json
Authorization: Bearer <token>
```

#### Delete a Service

```http
DELETE /admin/services/:id
Authorization: Bearer <token>
```

#### Get All Transactions

```http
GET /admin/transactions
Authorization: Bearer <token>
```

> **Note:** All Admin API endpoints are protected by authentication and admin role authorization. Only authorized administrators can access these operations.

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

## 👨‍💻 Author

### ✨ Md. Sofian Hasan ✨

> Software Engineer | Full-Stack (MERN / PERN) Developer

[![🌐 Portfolio](https://img.shields.io/badge/🌐_Portfolio-Visit_Website-0A0A0A?style=for-the-badge)](https://marleydip.netlify.app/)
&nbsp;
[![💻 GitHub](https://img.shields.io/badge/💻_GitHub-View_Profile-181717?style=for-the-badge&logo=github)](https://github.com/marleyDip)

Passionate about building **modern, scalable, and user-focused web applications** while continuously strengthening ***JavaScript, TypeScript, problem-solving, and full-stack development skills***.

### 🚀 Tech Focus

![Tech Stack](https://skillicons.dev/icons?i=js,ts,react,nextjs,tailwind,nodejs,express,nestjs,mongodb,postgres)

![MERN Stack](https://img.shields.io/badge/MERN-Stack-61DAFB?style=for-the-badge)
![PERN Stack](https://img.shields.io/badge/PERN-Stack-336791?style=for-the-badge)

---

## 📄 License

This project is developed for educational and learning purposes. You may adapt and extend it according to your requirements.

---

## 🙏 Acknowledgements & Learning Credits

### Special Thanks to Programming Hero

This project was developed as part of my learning journey through the **AI-Driven Full Stack Web Engineering Course Level-1 Batch-14**.

I would like to express my sincere gratitude to the entire **Programming Hero team, instructors, mentors, and community** for providing structured learning resources, practical guidance, and an encouraging environment to grow as a developer.

Throughout this journey, I have had the opportunity to strengthen my understanding of modern web development concepts, explore full-stack application architecture, and apply my knowledge by building real-world projects.

**WedPlan represents more than just a course assignment - it is an opportunity to transform the concepts I have learned into a practical, functional application.**

Special thanks for inspiring me to keep learning, experimenting, solving problems, and building better software.

**Learning never stops. Every project is another step forward.** 🚀

[![Programming Hero](https://img.shields.io/badge/Programming%20Hero-Visit%20My%20Profile-FF4B4B?style=for-the-badge)](https://codelab.programming-hero.com/u/marleydip)
