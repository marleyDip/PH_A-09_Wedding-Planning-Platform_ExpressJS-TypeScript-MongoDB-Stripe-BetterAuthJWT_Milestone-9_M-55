import { Router } from "express";

import {
  cancelMyBooking,
  checkBooking,
  createBookingHandler,
  getMyBookings,
  getVendorBookings,
  updateBookingStatus,
} from "../controllers/booking.controller.js";

import { authenticate, requireRole } from "../middleware/auth.js";
import { writeLimiter } from "../middleware/rateLimit.js";

const router = Router();

// Customer or vendor: submit a booking.
router.post(
  "/",
  authenticate,
  requireRole("customer", "vendor"),
  writeLimiter,
  createBookingHandler,
);

// Customer or vendor: check their own active booking.
router.get(
  "/check",
  authenticate,
  requireRole("customer", "vendor"),
  checkBooking,
);

// Customer or vendor: list bookings they submitted.
router.get(
  "/mine",
  authenticate,
  requireRole("customer", "vendor"),
  getMyBookings,
);

// Customer: cancel their own pending booking.
router.patch(
  "/:id/cancel",
  authenticate,
  requireRole("customer", "vendor"),
  writeLimiter,
  cancelMyBooking,
);

// Vendor: list bookings received for their services.
router.get("/vendor", authenticate, requireRole("vendor"), getVendorBookings);

// Vendor: accept or reject a pending booking.
router.patch(
  "/:id/status",
  authenticate,
  requireRole("vendor"),
  writeLimiter,
  updateBookingStatus,
);

export default router;
