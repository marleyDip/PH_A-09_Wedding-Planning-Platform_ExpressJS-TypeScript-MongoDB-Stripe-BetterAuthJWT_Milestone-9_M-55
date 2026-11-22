import type { Request, RequestHandler } from "express";

import {
  createCheckoutSession,
  getVendorPaymentHistory,
} from "../services/payment.service.js";

import { ApiError } from "../utils/ApiError.js";
import { isPremium } from "../utils/premium.js";

// Get the authenticated vendor.
function getVendor(req: Request) {
  const vendor = req.user;

  if (!vendor || vendor.role !== "vendor") {
    throw new ApiError(401, "Authentication required.", {
      code: "UNAUTHORIZED",
    });
  }

  return vendor;
}

// POST /payments/create-checkout-session
export const createCheckoutSessionHandler: RequestHandler = async (
  req,
  res,
) => {
  const vendor = getVendor(req);

  // Prevent an already-premium vendor from purchasing again.
  if (isPremium(vendor.doc)) {
    throw new ApiError(409, "You already have an active Premium plan.", {
      code: "ALREADY_PREMIUM",
    });
  }

  const url = await createCheckoutSession(vendor.id, vendor.email);

  res.json({ url });
};

// GET /payments/mine
export const getMyPayments: RequestHandler = async (req, res) => {
  const vendor = getVendor(req);

  const transactions = await getVendorPaymentHistory(vendor.id);

  res.json(transactions);
};
