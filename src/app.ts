import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { corsOptions } from "./config/cors.js";
import { env } from "./config/env.js";
// import { errorHandler, notFound } from "./middleware/error.js";
// import { globalLimiter } from "./middleware/rateLimit.js";
// import routes from "./routes/index.js";
// import { stripeWebhook } from "./routes/payments.routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1); // behind Render / Railway / Fly etc., so rate limits see the real client IP

  app.use(helmet());
  app.use(cors(corsOptions)); // answers OPTIONS preflight requests too
  app.use(morgan(env.isProd ? "combined" : "dev"));

  // Stripe signs the RAW body, so this route must be registered BEFORE express.json().
  //   app.post(
  //     "/payments/webhook",
  //     express.raw({ type: "application/json", limit: "1mb" }),
  //     stripeWebhook,
  //   );

  // 1. Security and request middleware
  //   app.use(express.json({ limit: "100kb" }));

  // Global protection
  //   app.use(globalLimiter);

  // 2. API routes
  //   app.use(routes);

  // 3. Handle unknown routes
  //   app.use(notFound);

  // 4. Centralized error handler (always last)
  //   app.use(errorHandler);

  return app;
}
