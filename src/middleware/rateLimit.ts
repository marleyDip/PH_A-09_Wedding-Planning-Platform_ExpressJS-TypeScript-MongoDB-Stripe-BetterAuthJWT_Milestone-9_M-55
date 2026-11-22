import rateLimit from "express-rate-limit";

const WINDOW_MS = 15 * 60 * 1000;

const makeLimiter = (limit: number, message: string) =>
  rateLimit({
    // windowMs: windowMinutes * 60 * 1000,

    windowMs: WINDOW_MS,
    limit,

    standardHeaders: "draft-8",
    legacyHeaders: false,

    message: {
      message,
      code: "RATE_LIMITED",
    },

    // Avoid counting failed requests against the limit.
    skipSuccessfulRequests: false,

    // Use the default IP-based key generator.
    // Do not trust arbitrary client-supplied headers.
  });

/**
 * Generous global protection against excessive requests.
 */
export const globalLimiter = makeLimiter(
  600,
  "Too many requests. Please slow down.",
);

/**
 * Protect resource creation and modification endpoints.
 */
export const writeLimiter = makeLimiter(
  80,
  "Too many changes in a short time. Please try again shortly.",
);

/**
 * Protect Stripe Checkout session creation.
 */
export const checkoutLimiter = makeLimiter(
  10,
  "Too many checkout attempts. Please try again later.",
);

/* const make = (windowMinutes: number, limit: number, message: string) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message, code: "RATE_LIMITED" },
  }); */

// Every request: generous, just stops runaway clients.
/* export const globalLimiter = make(
  15,
  600,
  "Too many requests. Please slow down.",
); */

// Creating / changing things (services, bookings).
/* export const writeLimiter = make(
  15,
  80,
  "Too many changes in a short time. Please try again shortly.",
); */

// Stripe Checkout sessions.
/* export const checkoutLimiter = make(
  15,
  10,
  "Too many checkout attempts. Please try again later.",
); */
