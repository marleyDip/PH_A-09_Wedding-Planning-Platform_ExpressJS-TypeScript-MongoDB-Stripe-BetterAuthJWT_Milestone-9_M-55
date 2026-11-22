import type Stripe from "stripe";

import { cols, userIdFilter } from "../config/db.js";

import { PRIMARY_CLIENT_URL, env } from "../config/env.js";

import { stripe } from "../config/stripe.js";
import { ApiError } from "../utils/ApiError.js";

import {
  getSubscriptionId,
  getSubscriptionPeriodEnd,
} from "../utils/stripe.helpers.js";

import { toTransaction } from "../utils/serializers.js";

// ================
// CHECKOUT SESSION
// ================

/**
 * Creates a Stripe Checkout Session for a vendor.
 *
 * This function does not activate Premium.
 * Premium is activated only after a verified Stripe webhook.
 */
export async function createCheckoutSession(
  vendorId: string,
  vendorEmail: string,
): Promise<string> {
  let lineItem: Stripe.Checkout.SessionCreateParams.LineItem;

  if (env.STRIPE_PREMIUM_PRICE_ID) {
    lineItem = {
      price: env.STRIPE_PREMIUM_PRICE_ID,
      quantity: 1,
    };
  } else if (env.PREMIUM_PRICE_AMOUNT) {
    lineItem = {
      quantity: 1,
      price_data: {
        currency: env.PREMIUM_CURRENCY.toLowerCase(),
        unit_amount: env.PREMIUM_PRICE_AMOUNT,
        recurring: {
          interval: "month",
        },
        product_data: {
          name: "WedPlan Premium Vendor",
        },
      },
    };
  } else {
    throw new ApiError(500, "Premium pricing isn't configured on the server.", {
      code: "PRICE_NOT_CONFIGURED",
    });
  }

  const metadata = {
    vendorId,
    plan: "premium",
  };

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [lineItem],
    client_reference_id: vendorId,
    customer_email: vendorEmail,
    metadata,
    subscription_data: {
      metadata,
    },
    success_url: `${PRIMARY_CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${PRIMARY_CLIENT_URL}/payment/cancel`,
  });

  if (!session.url) {
    throw new ApiError(502, "Stripe didn't return a checkout URL.", {
      code: "STRIPE_NO_URL",
    });
  }

  return session.url;
}

// ===============
// PAYMENT HISTORY
// ===============

/**
 * Returns a vendor's own payment history.
 */
export async function getVendorPaymentHistory(vendorId: string) {
  const rows = await cols.transactions
    .find({ vendorId })
    .sort({ createdAt: -1 })
    .toArray();

  return rows.map((transaction) => toTransaction(transaction));
}

// =============================
// VENDOR / SUBSCRIPTION HELPERS
// =============================

/**
 * Checks that the supplied ID belongs to an existing vendor.
 */
async function getExistingVendorId(
  vendorId: string | undefined | null,
): Promise<string | null> {
  if (!vendorId) {
    return null;
  }

  const user = await cols.users.findOne(userIdFilter(vendorId), {
    projection: {
      role: 1,
    },
  });

  return user?.role === "vendor" ? vendorId : null;
}

/**
 * Updates a vendor's subscription plan.
 */
async function updateVendorPlan(
  vendorId: string,
  plan: "premium" | "free",
  expiresAt: Date | null,
): Promise<void> {
  await cols.users.updateOne(userIdFilter(vendorId), {
    $set: {
      subscriptionPlan: plan,
      subscriptionExpiresAt: plan === "premium" ? expiresAt : null,
      updatedAt: new Date(),
    },
  });
}

// ============================
// SUBSCRIPTION SYNCHRONIZATION
// ============================

/**
 * Keeps the vendor's plan synchronized with Stripe.
 *
 * Handles renewals, cancellation, and non-payment.
 */
async function syncSubscription(
  subscription: Stripe.Subscription,
): Promise<void> {
  const vendorId = await getExistingVendorId(
    subscription.metadata?.["vendorId"],
  );

  if (!vendorId) {
    return;
  }

  if (subscription.status === "active" || subscription.status === "trialing") {
    await updateVendorPlan(
      vendorId,
      "premium",
      getSubscriptionPeriodEnd(subscription),
    );
  } else if (
    ["canceled", "unpaid", "incomplete_expired"].includes(subscription.status)
  ) {
    await updateVendorPlan(vendorId, "free", null);
  }

  // past_due: keep Premium until the paid period ends.
}

// ==================
// CHECKOUT COMPLETED
// ==================

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const vendorId = await getExistingVendorId(
    session.metadata?.["vendorId"] ?? session.client_reference_id,
  );

  if (!vendorId) {
    console.warn(`Stripe session ${session.id} has no valid vendor; ignored.`);
    return;
  }

  const subscriptionId = getSubscriptionId(session);
  const paid = session.payment_status === "paid";

  // Upsert makes repeated webhook delivery safe.
  await cols.transactions.updateOne(
    {
      stripeSessionId: session.id,
    },
    {
      $set: {
        vendorId,
        plan: "premium",
        amount: session.amount_total ?? 0,
        currency: (session.currency ?? env.PREMIUM_CURRENCY).toLowerCase(),
        stripeSubscriptionId: subscriptionId,
        status: paid ? "paid" : "pending",
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    {
      upsert: true,
    },
  );

  // Activate Premium only after payment is confirmed.
  if (paid && subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    await updateVendorPlan(
      vendorId,
      "premium",
      getSubscriptionPeriodEnd(subscription),
    );
  }
}

// ==============
// INVOICE EVENTS
// ==============

async function handleInvoice(
  invoice: Stripe.Invoice,
  outcome: "paid" | "failed",
): Promise<void> {
  const subscriptionId = getSubscriptionId(invoice);

  if (!subscriptionId) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const vendorId = await getExistingVendorId(
    subscription.metadata?.["vendorId"],
  );

  if (!vendorId) {
    return;
  }

  // The first invoice is already recorded by
  // checkout.session.completed.
  const invoiceData = invoice as unknown as Record<string, unknown>;

  const billingReason = invoiceData["billing_reason"];

  if (billingReason !== "subscription_create") {
    await cols.transactions.updateOne(
      {
        stripeInvoiceId: invoice.id,
      },
      {
        $set: {
          vendorId,
          plan: "premium",
          amount: outcome === "paid" ? invoice.amount_paid : invoice.amount_due,
          currency: invoice.currency.toLowerCase(),
          stripeSubscriptionId: subscriptionId,
          status: outcome,
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      {
        upsert: true,
      },
    );
  }

  if (outcome === "paid") {
    await updateVendorPlan(
      vendorId,
      "premium",
      getSubscriptionPeriodEnd(subscription),
    );
  }
}

// ================
// CHECKOUT EXPIRED
// ================

async function handleCheckoutExpired(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const vendorId = await getExistingVendorId(
    session.metadata?.["vendorId"] ?? session.client_reference_id,
  );

  if (!vendorId) {
    return;
  }

  await cols.transactions.updateOne(
    {
      stripeSessionId: session.id,
    },
    {
      $set: {
        vendorId,
        plan: "premium",
        amount: session.amount_total ?? 0,
        currency: (session.currency ?? env.PREMIUM_CURRENCY).toLowerCase(),
        stripeSubscriptionId: null,
        status: "expired",
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    {
      upsert: true,
    },
  );
}

// ========================
// WEBHOOK EVENT DISPATCHER
// ========================

/**
 * Processes a verified Stripe event.
 *
 * Signature verification happens in the controller.
 */
export async function processStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await handleCheckoutCompleted(
        event.data.object as Stripe.Checkout.Session,
      );
      break;

    case "checkout.session.expired":
      await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
      break;

    case "invoice.payment_succeeded":
    case "invoice.paid":
      await handleInvoice(event.data.object as Stripe.Invoice, "paid");
      break;

    case "invoice.payment_failed":
      await handleInvoice(event.data.object as Stripe.Invoice, "failed");
      break;

    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;

    default:
      // Ignore events we don't process.
      break;
  }
}
