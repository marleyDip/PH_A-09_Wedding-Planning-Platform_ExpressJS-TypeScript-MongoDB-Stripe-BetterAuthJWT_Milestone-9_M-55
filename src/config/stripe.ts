import Stripe from "stripe";

import { env } from "./env.js";

/**
 * Shared Stripe SDK instance.
 *
 * - Secret key remains server-side.
 * - Uses the API version pinned by the installed Stripe SDK.
 * - Reuse this instance across services and controllers.
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  appInfo: {
    name: "WedPlan API",
    version: "1.0.0",
  },
});

/** Secret key stays on the server. The API version is the one pinned by the installed stripe package. */
// export const stripe = new Stripe(env.STRIPE_SECRET_KEY);
