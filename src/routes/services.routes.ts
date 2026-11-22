import { Router } from "express";

import {
  createService,
  deleteService,
  getMyService,
  getMyServices,
  getService,
  getServiceStats,
  getServices,
  updateService,
  updateServiceAvailability,
} from "../controllers/service.controller.js";

import { authenticate, requireRole } from "../middleware/auth.js";

import { writeLimiter } from "../middleware/rateLimit.js";

const router = Router();

/* public */

// GET /services
router.get("/", getServices);

// GET /services/stats
router.get("/stats", getServiceStats);

/* vendor: own */

// GET /services/mine
router.get("/mine", authenticate, requireRole("vendor"), getMyServices);

// GET /services/mine/:id
router.get("/mine/:id", authenticate, requireRole("vendor"), getMyService);

// POST /services
router.post(
  "/",
  authenticate,
  requireRole("vendor"),
  writeLimiter,
  createService,
);

// PATCH /services/:id
router.patch(
  "/:id",
  authenticate,
  requireRole("vendor"),
  writeLimiter,
  updateService,
);

// PATCH /services/:id/availability
router.patch(
  "/:id/availability",
  authenticate,
  requireRole("vendor"),
  writeLimiter,
  updateServiceAvailability,
);

// DELETE /services/:id
router.delete(
  "/:id",
  authenticate,
  requireRole("vendor"),
  writeLimiter,
  deleteService,
);

/* public: one service */

// Keep this route last.
router.get("/:id", getService);

export default router;
