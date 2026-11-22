import type { Request } from "express";

import { ApiError } from "./ApiError.js";

export function getParam(req: Request, name: string): string {
  const value = req.params[name];

  if (typeof value !== "string") {
    throw new ApiError(400, `Invalid route parameter: ${name}`, {
      code: "INVALID_PARAM",
    });
  }

  return value;
}
