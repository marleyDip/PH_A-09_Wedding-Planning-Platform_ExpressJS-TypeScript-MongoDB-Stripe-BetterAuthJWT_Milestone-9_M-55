import "dotenv/config";

import { z } from "zod";
import { blankToUndefined } from "../utils/query.js";

/* ================================
   URL VALIDATION
================================ */

// const httpUrl = z
//   .string()
//   .url("Must be a valid URL")
//   .refine(
//     (value) => ["http:", "https:"].includes(new URL(value).protocol),
//     "URL must use HTTP or HTTPS",
//   );

// Modern Zod 4 implementation
// This is cleaner because z.url() supports protocol validation directly. You no longer need .refine() or new URL().
const httpUrl = z.url({
  protocol: /^https?$/,
  error: "Must be a valid HTTP or HTTPS URL",
});

const clientOrigin = httpUrl.refine((value) => {
  const url = new URL(value);

  return url.pathname === "/" && !url.search && !url.hash;
}, "CLIENT_URL entries must be origins without paths, queries, or hashes");

/* ================================
   ENVIRONMENT SCHEMA
================================ */

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.preprocess(
    blankToUndefined,
    z.coerce.number().int().min(1).max(65535).default(5000),
  ),

  /* MongoDB */
  MONGODB_URI: z.string().trim().min(1, "MONGODB_URI is required"),
  DB_NAME: z.preprocess(
    blankToUndefined,
    z.string().trim().min(1).default("wedding-planning-platform"),
  ),
  USERS_COLLECTION: z.preprocess(
    blankToUndefined,
    z.string().trim().min(1).default("user"),
  ),
  SESSIONS_COLLECTION: z.preprocess(
    blankToUndefined,
    z.string().trim().min(1).default("session"),
  ),

  /* Authentication */
  BETTER_AUTH_URL: httpUrl,

  CLIENT_URL: z
    .string()
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .pipe(z.array(clientOrigin).min(1, "At least one CLIENT_URL is required"))
    .transform((origins) => [
      ...new Set(origins.map((origin) => new URL(origin).origin)),
    ]),

  /* Stripe */
  STRIPE_SECRET_KEY: z
    .string()
    .startsWith("sk_", "STRIPE_SECRET_KEY must start with sk_"),

  STRIPE_WEBHOOK_SECRET: z
    .string()
    .startsWith("whsec_", "STRIPE_WEBHOOK_SECRET must start with whsec_"),

  STRIPE_PREMIUM_PRICE_ID: z.preprocess(
    blankToUndefined,
    z.string().startsWith("price_").optional(),
  ),

  PREMIUM_PRICE_AMOUNT: z.preprocess(
    blankToUndefined,
    z.coerce.number().int().positive().optional(),
  ),

  PREMIUM_CURRENCY: z
    .string()
    .trim()
    .length(3, "PREMIUM_CURRENCY must contain 3 characters")
    .regex(/^[a-zA-Z]{3}$/, "PREMIUM_CURRENCY must be a valid 3-letter code")
    .transform((value) => value.toLowerCase())
    .default("usd"),

  /* Application */
  APP_TIMEZONE: z.preprocess(
    blankToUndefined,
    z.string().trim().min(1).default("Asia/Dhaka"),
  ),
});

/* ================================
   VALIDATE ENVIRONMENT
================================ */

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("\nInvalid environment variables:\n");

  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }

  console.error("\nPlease check your .env configuration.\n");

  process.exit(1);
}

/* ================================
   EXPORT ENVIRONMENT
================================ */

const { CLIENT_URL, ...rest } = parsed.data;

export const env = Object.freeze({
  ...rest,

  /** Allowed browser origins for CORS */
  CLIENT_ORIGINS: Object.freeze(CLIENT_URL),

  /** Production environment flag */
  isProd: rest.NODE_ENV === "production",
});

/** First allowed origin, used for Stripe redirects */
export const PRIMARY_CLIENT_URL = env.CLIENT_ORIGINS[0]!;

// import "dotenv/config.js";
// import { z } from "zod";
// import { blank } from "../utils/query.js";

// const schema = z.object({
//   NODE_ENV: z
//     .enum(["development", "production", "test"])
//     .default("development"),
//   PORT: z.coerce.number().int().positive().default(5000),

//   MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
//   DB_NAME: z.string().min(1).default("wedding-planning-platform"),
//   USERS_COLLECTION: z.string().min(1).default("user"),
//   SESSIONS_COLLECTION: z.string().min(1).default("session"),

//   BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a full URL"),
//   CLIENT_URL: z.string().min(1, "CLIENT_URL is required"),

//   STRIPE_SECRET_KEY: z
//     .string()
//     .startsWith("sk_", "STRIPE_SECRET_KEY must start with sk_"),
//   STRIPE_WEBHOOK_SECRET: z
//     .string()
//     .startsWith("whsec_", "STRIPE_WEBHOOK_SECRET must start with whsec_"),
//   STRIPE_PREMIUM_PRICE_ID: z.preprocess(
//     blank,
//     z.string().startsWith("price_").optional(),
//   ),
//   PREMIUM_PRICE_AMOUNT: z.preprocess(
//     blank,
//     z.coerce.number().int().positive().optional(),
//   ),
//   PREMIUM_CURRENCY: z.string().min(3).default("usd"),

//   APP_TIMEZONE: z.string().min(1).default("Asia/Dhaka"),
// });

// const parsed = schema.safeParse(process.env);
// if (!parsed.success) {
//   console.error("Invalid environment variables:");
//   for (const i of parsed.error.issues)
//     console.error(`  - ${i.path.join(".")}: ${i.message}`);
//   console.error("Copy .env.example to .env and fill it in.");
//   process.exit(1);
// }

// const e = parsed.data;
// const trim = (s: string) => s.replace(/\/+$/, "");

// export const env = {
//   ...e,
//   BETTER_AUTH_URL: trim(e.BETTER_AUTH_URL),
//   /** every allowed browser origin; the first one is also used for Stripe redirects */
//   CLIENT_ORIGINS: e.CLIENT_URL.split(",")
//     .map((s) => trim(s.trim()))
//     .filter(Boolean),
//   isProd: e.NODE_ENV === "production",
// } as const;

// export const PRIMARY_CLIENT_URL = env.CLIENT_ORIGINS[0];
