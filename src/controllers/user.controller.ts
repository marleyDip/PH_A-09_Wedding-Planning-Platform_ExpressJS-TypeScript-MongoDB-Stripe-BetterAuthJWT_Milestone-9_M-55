import type { RequestHandler } from "express";
import { ApiError } from "../utils/ApiError.js";
import { toAccount } from "../utils/serializers.js";

/** GET /users/me — Any authenticated user */
export const getMe: RequestHandler = (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required.", {
      code: "UNAUTHORIZED",
    });
  }

  res.json(toAccount(req.user.doc));
};
