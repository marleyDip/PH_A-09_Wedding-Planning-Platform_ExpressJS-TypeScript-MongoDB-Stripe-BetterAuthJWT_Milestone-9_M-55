import { Router } from "express";

import {
  deleteServiceHandler,
  getAdminStatsHandler,
  getAllServicesHandler,
  getAllTransactionsHandler,
  getAllUsersHandler,
  updateServiceStatusHandler,
  updateUserBlockStatusHandler,
} from "../controllers/admin.controller.js";

import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

// Every admin route requires:
// 1. A verified token.
// 2. Database role === "admin".
// 3. An account that is not blocked.
router.use(authenticate, requireRole("admin"));

// ========
// OVERVIEW
// ========
router.get("/stats", getAdminStatsHandler);

// =====
// USERS
// =====
router.get("/users", getAllUsersHandler);

router.patch("/users/:id/block", updateUserBlockStatusHandler);

// ========
// SERVICES
// ========
router.get("/services", getAllServicesHandler);

router.patch("/services/:id/status", updateServiceStatusHandler);

router.delete("/services/:id", deleteServiceHandler);

// ============
// TRANSACTIONS
// ============
router.get("/transactions", getAllTransactionsHandler);

export default router;
