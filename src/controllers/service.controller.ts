import type { Request, RequestHandler } from "express";
import type { Filter, Sort } from "mongodb";

import {
  cols,
  liveVendorIds,
  userIdFilter,
  type ServiceDoc,
  type ServiceFields,
} from "../config/db.js";

import {
  availabilitySchema,
  createServiceSchema,
  serviceListQuerySchema,
  updateServiceSchema,
} from "../schemas/service.schema.js";

import {
  assertCanActivateService,
  loadOwnedService,
} from "../services/service.service.js";

import { ApiError } from "../utils/ApiError.js";
import { parseId } from "../utils/ids.js";
import { usersById } from "../utils/lookups.js";
import { isPremium } from "../utils/premium.js";
import { escapeRegex } from "../utils/query.js";

import { toPublicVendor, toService } from "../utils/serializers.js";

import type { AuthUser } from "../middleware/auth.js";

// helpers

/**
 * Get the authenticated vendor.
 * Route middleware guarantees authentication and the vendor role,
 * but this runtime check keeps controllers type-safe.
 */
function getVendor(req: Request): AuthUser {
  if (!req.user) {
    throw new ApiError(401, "Authentication required.", {
      code: "UNAUTHORIZED",
    });
  }

  if (req.user.role !== "vendor") {
    throw new ApiError(403, "Vendor access required.", {
      code: "FORBIDDEN",
    });
  }

  return req.user;
}

/**
 * Validate an Express route parameter.
 */
function getRouteId(value: string | string[] | undefined): string {
  if (typeof value !== "string") {
    throw new ApiError(400, "Invalid service id.", {
      code: "INVALID_ID",
    });
  }

  return value;
}

// ======
// public
// ======

/**
 * GET /services
 *
 * Public service listing.
 * Only approved & active services from non-blocked vendors.
 *
 * Supports:
 * search, category, location, minPrice, maxPrice,
 * sort, page, limit.
 */
export const getServices: RequestHandler = async (req, res) => {
  const query = serviceListQuerySchema.parse(req.query);

  const vendorIds = await liveVendorIds();

  const filter: Filter<ServiceDoc> = {
    status: "approved",
    isActive: true,
    vendorId: { $in: vendorIds },
  };

  if (query.category) {
    filter.category = query.category;
  }

  if (query.location) {
    filter.location = query.location;
  }

  if (query.search) {
    filter.serviceName = {
      $regex: escapeRegex(query.search),
      $options: "i",
    };
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {
      ...(query.minPrice !== undefined ? { $gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { $lte: query.maxPrice } : {}),
    };
  }

  const sort: Sort =
    query.sort === "price_asc"
      ? { price: 1, _id: 1 }
      : query.sort === "price_desc"
        ? { price: -1, _id: 1 }
        : query.sort === "newest"
          ? { createdAt: -1, _id: 1 }
          : { rating: -1, reviewCount: -1, _id: 1 };

  const [total, rows] = await Promise.all([
    cols.services.countDocuments(filter),

    cols.services
      .find(filter)
      .sort(sort)
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .toArray(),
  ]);

  const vendors = await usersById(rows.map((service) => service.vendorId));

  const result = rows.map((service) => {
    const vendor = vendors.get(service.vendorId);

    return toService(service, vendor ? toPublicVendor(vendor) : null);
  });

  res.set("X-Total-Count", String(total)).json(result);
};

/**
 * GET /services/stats
 *
 * Public homepage statistics from live services.
 */
export const getServiceStats: RequestHandler = async (_req, res) => {
  const vendorIds = await liveVendorIds();

  const liveServices = await cols.services
    .find(
      {
        status: "approved",
        isActive: true,
        vendorId: { $in: vendorIds },
      },
      {
        projection: {
          category: 1,
          location: 1,
          vendorId: 1,
        },
      },
    )
    .toArray();

  const byCategory: Record<string, number> = {};
  const byLocation: Record<string, number> = {};

  for (const service of liveServices) {
    byCategory[service.category] = (byCategory[service.category] ?? 0) + 1;

    byLocation[service.location] = (byLocation[service.location] ?? 0) + 1;
  }

  res.json({
    services: liveServices.length,

    vendors: new Set(liveServices.map((service) => service.vendorId)).size,

    cities: Object.keys(byLocation).length,

    categories: Object.keys(byCategory).length,

    byCategory,
    byLocation,
  });
};

// ===========
// vendor: own
// ===========

/**
 * GET /services/mine
 *
 * Return every service belonging to the authenticated vendor.
 * Includes all statuses.
 */
export const getMyServices: RequestHandler = async (req, res) => {
  const vendor = getVendor(req);

  const rows = await cols.services
    .find({ vendorId: vendor.id })
    .sort({ createdAt: -1 })
    .toArray();

  res.json(rows.map((service) => toService(service)));
};

/**
 * GET /services/mine/:id
 *
 * Return one service belonging to the authenticated vendor.
 */
export const getMyService: RequestHandler = async (req, res) => {
  const vendor = getVendor(req);

  const service = await loadOwnedService(
    getRouteId(req.params["id"]),
    vendor.id,
  );

  res.json(toService(service));
};

/**
 * POST /services
 *
 * Create a service.
 * vendorId comes from the authenticated user, never the request body.
 * New services always start as pending.
 */
export const createService: RequestHandler = async (req, res) => {
  const vendor = getVendor(req);

  const input = createServiceSchema.parse(req.body);

  const premium = isPremium(vendor.doc);

  await assertCanActivateService(vendor.id, premium);

  const now = new Date();

  // const doc: Omit<ServiceDoc, "_id"> = {
  // const doc: OptionalUnlessRequiredId<ServiceDoc> = {
  //  _id: new ObjectId(),

  const doc: ServiceFields = {
    vendorId: vendor.id,
    serviceName: input.serviceName,
    category: input.category,
    description: input.description,
    price: input.price,
    priceType: input.priceType,
    location: input.location,
    images: input.images,

    status: "pending",
    isActive: true,

    rating: 0,
    reviewCount: 0,

    createdAt: now,
    updatedAt: now,
  };

  const { insertedId } = await cols.services.insertOne(doc);

  const service: ServiceDoc = {
    ...doc,
    _id: insertedId,
  };

  res.status(201).json(toService(service));

  //   res.status(201).json(
  //     toService({
  //       ...doc,
  //       _id: insertedId,
  //     }),
  //   );
};

/**
 * PATCH /services/:id
 *
 * Update service details.
 * Status and ownership cannot be changed here.
 */
export const updateService: RequestHandler = async (req, res) => {
  const vendor = getVendor(req);

  const input = updateServiceSchema.parse(req.body);

  const current = await loadOwnedService(
    getRouteId(req.params["id"]),
    vendor.id,
  );

  const set: Partial<ServiceDoc> = {
    updatedAt: new Date(),
  };

  const name = input.serviceName ?? input.name;

  if (name !== undefined) {
    set.serviceName = name;
  }

  if (input.category !== undefined) {
    set.category = input.category;
  }

  if (input.description !== undefined) {
    set.description = input.description;
  }

  if (input.price !== undefined) {
    set.price = input.price;
  }

  if (input.priceType !== undefined) {
    set.priceType = input.priceType;
  }

  if (input.location !== undefined) {
    set.location = input.location;
  }

  if (input.images !== undefined) {
    set.images = input.images;
  }

  const updated = await cols.services.findOneAndUpdate(
    {
      _id: current._id,
      vendorId: vendor.id,
    },
    {
      $set: set,
    },
    {
      returnDocument: "after",
    },
  );

  if (!updated) {
    throw new ApiError(404, "This service doesn't exist.", {
      code: "NOT_FOUND",
    });
  }

  res.json(toService(updated));
};

/**
 * PATCH /services/:id/availability
 *
 * Change whether a vendor's service is available.
 * Rejected services cannot be activated.
 * Activating a service counts toward the Free plan limit.
 */
export const updateServiceAvailability: RequestHandler = async (req, res) => {
  const vendor = getVendor(req);

  const { isActive } = availabilitySchema.parse(req.body);

  const current = await loadOwnedService(
    getRouteId(req.params["id"]),
    vendor.id,
  );

  if (current.status === "rejected" && isActive) {
    throw new ApiError(409, "Rejected services can't be made available.", {
      code: "REJECTED",
    });
  }

  if (isActive && !current.isActive) {
    await assertCanActivateService(
      vendor.id,
      isPremium(vendor.doc),
      current._id,
    );
  }

  await cols.services.updateOne(
    {
      _id: current._id,
      vendorId: vendor.id,
    },
    {
      $set: {
        isActive,
        updatedAt: new Date(),
      },
    },
  );

  res.json({
    id: String(current._id),
    isActive,
  });
};

/**
 * DELETE /services/:id
 *
 * Delete a service only when it has no pending or accepted bookings.
 */
export const deleteService: RequestHandler = async (req, res) => {
  const vendor = getVendor(req);

  const current = await loadOwnedService(
    getRouteId(req.params["id"]),
    vendor.id,
  );

  const activeBookings = await cols.bookings.countDocuments({
    serviceId: String(current._id),
    status: { $in: ["pending", "accepted"] },
  });

  if (activeBookings > 0) {
    throw new ApiError(
      409,
      "This service has active booking requests. Respond to them before deleting it.",
      { code: "HAS_ACTIVE_BOOKINGS" },
    );
  }

  await cols.services.deleteOne({
    _id: current._id,
    vendorId: vendor.id,
  });

  res.json({ success: true });
};

// ===================
// public: one service
// ===================

/**
 * GET /services/:id
 *
 * Return one publicly available service.
 * Invalid or unknown IDs return 404.
 * Unavailable services return 403.
 */
export const getService: RequestHandler = async (req, res) => {
  const serviceId = parseId(getRouteId(req.params["id"]), "service");

  const service = await cols.services.findOne({
    _id: serviceId,
  });

  if (!service) {
    throw new ApiError(404, "This service doesn't exist.", {
      code: "NOT_FOUND",
    });
  }

  const unavailable = () =>
    new ApiError(403, "This service is not available for booking right now.", {
      code: "UNAVAILABLE",
    });

  if (service.status !== "approved" || !service.isActive) {
    throw unavailable();
  }

  const vendor = await cols.users.findOne(userIdFilter(service.vendorId));

  if (!vendor || vendor.role !== "vendor" || vendor.isBlocked) {
    throw unavailable();
  }

  res.json(toService(service, toPublicVendor(vendor)));
};
