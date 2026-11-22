import type { CorsOptions } from "cors";
import { env } from "./env.js";

/**
 * CORS configuration.
 * Allows requests from trusted frontend origins.
 *
 * Your updated env.ts already normalizes origins using new URL(origin).origin so Removed trailing-slash normalization
 *
 */
export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Allow requests without an Origin header (server-to-server).
    if (!origin) {
      return callback(null, true);
    }

    // Allow only explicitly configured frontend origins.
    if (env.CLIENT_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    // Reject untrusted browser origins without throwing an error.
    return callback(null, false);
  },

  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],

  allowedHeaders: ["Authorization", "Content-Type", "Accept"],

  exposedHeaders: ["X-Total-Count"],

  // Allows credentialed cross-origin requests when required.
  credentials: true,

  // Caches preflight responses for 10 minutes.
  maxAge: 600,
};

/* import type { CorsOptions } from "cors";
import { env } from "./env.js";

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // no Origin header = server-to-server call (Stripe webhook, curl, health checks)
    if (!origin || env.CLIENT_ORIGINS.includes(origin.replace(/\/+$/, "")))
      return callback(null, true);
    return callback(null, false); // browsers will block it; no stack trace noise
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type", "Accept"],
  exposedHeaders: ["X-Total-Count"],
  maxAge: 600,
};
 */
