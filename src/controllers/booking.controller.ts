import type { Request, RequestHandler } from "express";

import { cols } from "../config/db.js";
import {
  bookingDecisionSchema,
  checkBookingQuerySchema,
  createBookingSchema,
} from "../schemas/booking.schema.js";

import {
  cancelBooking,
  createBooking,
  hasActiveBooking,
  respondToBooking,
} from "../services/booking.service.js";

import { ApiError } from "../utils/ApiError.js";
import { parseId } from "../utils/ids.js";
import { servicesById, usersById } from "../utils/lookups.js";
import { toCustomerBooking, toVendorBooking } from "../utils/serializers.js";

// Get the authenticated user's ID.
function getUserId(req: Request): string {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(401, "Authentication required.", {
      code: "UNAUTHORIZED",
    });
  }

  return userId;
}

// POST /bookings
export const createBookingHandler: RequestHandler = async (req, res) => {
  const input = createBookingSchema.parse(req.body);
  const customerId = getUserId(req);

  const { booking, service, vendor } = await createBooking(input, customerId);

  res.status(201).json(toCustomerBooking(booking, service, vendor));

  //   res
  //     .status(201)
  //     .json(
  //       toCustomerBooking(
  //         booking,
  //         service as Parameters<typeof toCustomerBooking>[1],
  //         vendor as Parameters<typeof toCustomerBooking>[2],
  //       ),
  //     );
};

// GET /bookings/check
export const checkBooking: RequestHandler = async (req, res) => {
  const query = checkBookingQuerySchema.parse(req.query);
  const customerId = getUserId(req);

  const exists = await hasActiveBooking(
    query.serviceId,
    customerId,
    query.eventDate,
  );

  res.json({ exists });
};

// GET /bookings/mine
export const getMyBookings: RequestHandler = async (req, res) => {
  const customerId = getUserId(req);

  const rows = await cols.bookings
    .find({ customerId })
    .sort({ createdAt: -1 })
    .toArray();

  const [services, vendors] = await Promise.all([
    servicesById(rows.map((booking) => booking.serviceId)),
    usersById(rows.map((booking) => booking.vendorId)),
  ]);

  res.json(
    rows.map((booking) =>
      toCustomerBooking(
        booking,
        services.get(booking.serviceId),
        vendors.get(booking.vendorId),
      ),
    ),
  );
};

// PATCH /bookings/:id/cancel
export const cancelMyBooking: RequestHandler = async (req, res) => {
  const bookingId = parseId(req.params["id"], "booking");
  const customerId = getUserId(req);

  const updated = await cancelBooking(bookingId, customerId);

  res.json({
    id: String(updated._id),
    status: updated.status,
    cancelledAt: updated.cancelledAt?.toISOString(),
  });
};

// GET /bookings/vendor
export const getVendorBookings: RequestHandler = async (req, res) => {
  const vendorId = getUserId(req);

  const rows = await cols.bookings
    .find({ vendorId })
    .sort({ createdAt: -1 })
    .toArray();

  const [services, customers] = await Promise.all([
    servicesById(rows.map((booking) => booking.serviceId)),
    usersById(rows.map((booking) => booking.customerId)),
  ]);

  res.json(
    rows.map((booking) =>
      toVendorBooking(
        booking,
        services.get(booking.serviceId),
        customers.get(booking.customerId),
      ),
    ),
  );
};

// PATCH /bookings/:id/status
export const updateBookingStatus: RequestHandler = async (req, res) => {
  const { status } = bookingDecisionSchema.parse(req.body);

  const bookingId = parseId(req.params["id"], "booking");
  const vendorId = getUserId(req);

  const updated = await respondToBooking(bookingId, vendorId, status);

  res.json({
    id: String(updated._id),
    status: updated.status,
    respondedAt: updated.respondedAt?.toISOString(),
  });
};
