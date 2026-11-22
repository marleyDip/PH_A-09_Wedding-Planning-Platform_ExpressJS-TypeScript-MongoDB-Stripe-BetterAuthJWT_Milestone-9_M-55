import { FREE_LIMIT } from "../config/constants.js";
import { cols, type ServiceDoc } from "../config/db.js";

import { ApiError } from "../utils/ApiError.js";
import { parseId } from "../utils/ids.js";

// ============
// active count
// ============

/**
 * Count services that contribute toward the vendor's Free plan limit.
 * Rejected services are excluded.
 */
export function countActiveServices(
  vendorId: string,
  excludeId?: ServiceDoc["_id"],
): Promise<number> {
  return cols.services.countDocuments({
    vendorId,
    isActive: true,
    status: { $ne: "rejected" },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });
}

// ===========
// plan limits
// ===========

/**
 * Enforce the Free plan service limit.
 */
export function assertUnderLimit(count: number, premium: boolean): void {
  if (!premium && count >= FREE_LIMIT) {
    throw new ApiError(
      403,
      `Free vendors can have up to ${FREE_LIMIT} active services. Upgrade to Premium for unlimited services.`,
      { code: "FREE_LIMIT" },
    );
  }
}

/**
 * Check whether a vendor can activate another service.
 */
export async function assertCanActivateService(
  vendorId: string,
  premium: boolean,
  excludeId?: ServiceDoc["_id"],
): Promise<void> {
  const count = await countActiveServices(vendorId, excludeId);

  assertUnderLimit(count, premium);
}

// =========
// ownership
// =========

/**
 * Load a service and verify that it belongs to the requested vendor.
 */
export async function loadOwnedService(
  id: string,
  vendorId: string,
): Promise<ServiceDoc> {
  const serviceId = parseId(id, "service");

  const service = await cols.services.findOne({
    _id: serviceId,
  });

  if (!service) {
    throw new ApiError(404, "This service doesn't exist.", {
      code: "NOT_FOUND",
    });
  }

  if (service.vendorId !== vendorId) {
    throw new ApiError(403, "This service belongs to another vendor.", {
      code: "NOT_OWNER",
    });
  }

  return service;
}
