import { Router } from "express";

import {
  createCheckoutSessionHandler,
  getMyPayments,
} from "../controllers/payment.controller.js";

import { authenticate, requireRole } from "../middleware/auth.js";
import { checkoutLimiter } from "../middleware/rateLimit.js";

const router = Router();

// POST /payments/create-checkout-session
router.post(
  "/create-checkout-session",
  authenticate,
  requireRole("vendor"),
  checkoutLimiter,
  createCheckoutSessionHandler,
);

// GET /payments/mine
router.get("/mine", authenticate, requireRole("vendor"), getMyPayments);

export default router;
