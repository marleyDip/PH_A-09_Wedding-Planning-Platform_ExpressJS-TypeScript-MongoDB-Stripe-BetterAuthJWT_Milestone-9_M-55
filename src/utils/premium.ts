import type { UserDoc } from "../config/db.js";

/**
 * Premium is active when the plan is "premium"
 * and the subscription has not expired.
 *
 * Premium status is managed exclusively by the Stripe webhook.
 */
export function isPremium(
  user:
    | Pick<UserDoc, "subscriptionPlan" | "subscriptionExpiresAt">
    | null
    | undefined,
): boolean {
  if (!user || user.subscriptionPlan !== "premium") {
    return false;
  }

  if (!user.subscriptionExpiresAt) {
    return true;
  }

  const now = Date.now();
  const expiresAt = new Date(user.subscriptionExpiresAt).getTime();

  return expiresAt > now;
}

/** Premium = plan is "premium" and it has not expired. Premium is only ever set by the Stripe webhook. */
/* export function isPremium(
  u:
    | Pick<UserDoc, "subscriptionPlan" | "subscriptionExpiresAt">
    | null
    | undefined,
): boolean {
  if (!u || u.subscriptionPlan !== "premium") return false;
  return (
    !u.subscriptionExpiresAt || new Date(u.subscriptionExpiresAt) > new Date()
  );
} */
