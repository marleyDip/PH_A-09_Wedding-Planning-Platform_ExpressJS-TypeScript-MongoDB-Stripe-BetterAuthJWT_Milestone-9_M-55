import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Handles requests that don't match any registered route.
 */
export const notFound: RequestHandler = (req, _res, next) => {
  next(
    new ApiError(
      404,
      `Route not found: ${req.method} ${req.originalUrl.split("?")[0]}`,
      { code: "ROUTE_NOT_FOUND" },
    ),
  );
};

/**
 * Centralized error handler.
 *
 * Response format:
 * { message, code?, errors? }
 */
export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req,
  res,
  next,
) => {
  // Let Express handle errors when headers have already been sent.
  if (res.headersSent) {
    return next(err);
  }

  // Application errors.
  if (err instanceof ApiError) {
    res.status(err.status).json({
      message: err.message,
      ...(err.code !== undefined ? { code: err.code } : {}),
      ...(err.details !== undefined ? { errors: err.details } : {}),
    });
    return;
  }

  // Zod validation errors.
  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    res.status(422).json({
      message: errors[0]?.message ?? "Validation failed.",
      code: "VALIDATION_FAILED",
      errors,
    });
    return;
  }

  // Safely inspect properties on unknown errors.
  const error =
    typeof err === "object" && err !== null
      ? (err as { code?: unknown; type?: unknown })
      : undefined;

  // MongoDB duplicate key error.
  if (error?.code === 11000) {
    res.status(409).json({
      message: "This record already exists.",
      code: "DUPLICATE",
    });
    return;
  }

  // Express body-parser errors.
  if (error?.type === "entity.parse.failed") {
    res.status(400).json({
      message: "Malformed JSON body.",
      code: "BAD_JSON",
    });
    return;
  }

  if (error?.type === "entity.too.large") {
    res.status(413).json({
      message: "Request body is too large.",
      code: "TOO_LARGE",
    });
    return;
  }

  // Unexpected server errors.
  console.error("Unhandled error:", err);

  res.status(500).json({
    message: env.isProd
      ? "Something went wrong on our side."
      : err instanceof Error
        ? err.message
        : "Internal server error.",
    code: "INTERNAL",
  });
};

/* export const notFound: RequestHandler = (req, _res, next) => {
  next(
    new ApiError(
      404,
      `Route not found: ${req.method} ${req.originalUrl.split("?")[0]}`,
      { code: "ROUTE_NOT_FOUND" },
    ),
  );
}; */

/** One place that turns any error into `{ message, code?, errors? }` with the right status code. */
/* export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (res.headersSent) return;

  if (err instanceof ApiError) {
    res.status(err.status).json({
      message: err.message,
      code: err.code,
      ...(err.details ? { errors: err.details } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    const errors = err.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    }));
    res.status(422).json({
      message: errors[0]?.message ?? "Validation failed.",
      code: "VALIDATION_FAILED",
      errors,
    });
    return;
  }

  // duplicate key from a unique index (for example, a duplicate active booking)
  if ((err as { code?: number })?.code === 11000) {
    res
      .status(409)
      .json({ message: "This record already exists.", code: "DUPLICATE" });
    return;
  }

  const type = (err as { type?: string })?.type;
  if (type === "entity.parse.failed") {
    res.status(400).json({ message: "Malformed JSON body.", code: "BAD_JSON" });
    return;
  }
  if (type === "entity.too.large") {
    res
      .status(413)
      .json({ message: "Request body is too large.", code: "TOO_LARGE" });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    message: env.isProd
      ? "Something went wrong on our side."
      : ((err as Error)?.message ?? "Internal server error."),
    code: "INTERNAL",
  });
}; */
