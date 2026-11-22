import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { corsOptions } from "./config/cors.js";
import { env } from "./config/env.js";

import { errorHandler, notFound } from "./middleware/error.js";
import { globalLimiter } from "./middleware/rateLimit.js";

import routes from "./routes/index.js";
// import { stripeWebhook } from "./routes/payments.routes.js";
import stripeWebhookRoutes from "./routes/stripe-webhook.routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1); // behind Render / Railway / Fly etc., so rate limits see the real client IP

  app.use(helmet());
  app.use(cors(corsOptions)); // answers OPTIONS preflight requests too
  app.use(morgan(env.isProd ? "combined" : "dev"));

  // 1. Stripe webhook: raw body required for signature verification.
  app.use("/payments/webhook", stripeWebhookRoutes);

  // Stripe signs the RAW body, so this route must be registered BEFORE express.json().
  //   app.post(
  //     "/payments/webhook",
  //     express.raw({ type: "application/json", limit: "1mb" }),
  //     stripeWebhook,
  //   );

  // 2. Security and request middleware
  app.use(express.json({ limit: "100kb" }));

  // Global protection
  app.use(globalLimiter);

  // 3. API routes
  app.use(routes);

  // 4. Handle unknown routes
  app.use(notFound);

  // 5. Centralized error handler (always last)
  app.use(errorHandler);

  return app;
}

// import contentRoutes from "./routes/content.routes.js";
// import serviceRoutes from "./routes/service.routes.js";
// import bookingRoutes from "./routes/booking.routes.js";
// import paymentRoutes from "./routes/payment.routes.js";
// import adminRoutes from "./routes/admin.routes.js";

// app.use("/", contentRoutes);
// app.use("/api", contentRoutes);

// app.use("/services", serviceRoutes);
// app.use("/bookings", bookingRoutes);
// app.use("/payments", paymentRoutes);
// app.use("/admin", adminRoutes);
