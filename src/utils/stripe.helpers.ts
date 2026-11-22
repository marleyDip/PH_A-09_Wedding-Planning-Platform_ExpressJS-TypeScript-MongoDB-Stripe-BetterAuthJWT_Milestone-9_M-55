import type Stripe from "stripe";

// Stripe has moved some fields between API versions.
// Read both the newer and older locations.
type Loose = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

// Get the subscription's current billing period end.
export function getSubscriptionPeriodEnd(
  subscription: Stripe.Subscription,
): Date | null {
  const sub = subscription as unknown as Loose;

  const seconds: number | undefined =
    sub["items"]?.data?.[0]?.current_period_end ?? sub["current_period_end"];

  return seconds ? new Date(seconds * 1000) : null;
}

// Extract a subscription ID from Stripe objects.
// Supports both older and newer Stripe object structures.
export function getSubscriptionId(object: unknown): string | null {
  const value = object as Loose;

  const raw =
    value["subscription"] ??
    value["parent"]?.subscription_details?.subscription;

  if (typeof raw === "string") {
    return raw;
  }

  return typeof raw?.id === "string" ? raw.id : null;
}
