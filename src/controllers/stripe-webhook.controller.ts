import type { RequestHandler } from "express";
import type Stripe from "stripe";

import { env } from "../config/env.js";
import { stripe } from "../config/stripe.js";

import { processStripeEvent } from "../services/payment.service.js";

// POST /payments/webhook
export const stripeWebhook: RequestHandler = async (req, res) => {
  const signature = req.headers["stripe-signature"];

  if (typeof signature !== "string") {
    res.status(400).json({
      message: "Missing Stripe signature.",
    });
    return;
  }

  let event: Stripe.Event;

  // Verify the event using the original raw request body.
  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    res.status(400).json({
      message: "Invalid Stripe signature.",
    });
    return;
  }

  // Process the verified event.
  try {
    await processStripeEvent(event);

    res.json({ received: true });
  } catch (error) {
    // Return 500 so Stripe retries the event.
    console.error(`Stripe webhook ${event.type} failed:`, error);

    res.status(500).json({
      message: "Webhook handler failed.",
    });
  }
};
