import type { RequestHandler } from "express";

/**
 * Wraps an Express request handler.
 * Express 5 automatically forwards rejected promises from async route handlers
 * to the centralized error-handling middleware.
 */
export const asyncHandler = (handler: RequestHandler): RequestHandler =>
  handler;

/* Recommended approach — Express 5
I recommend removing asyncHandler and using native async handlers.
import type { RequestHandler } from "express";

  export const getServices: RequestHandler = async (req, res) => {
    const services = await serviceCollection.find().toArray();

    res.status(200).json({
      success: true,
      data: services,
    });
  };

If an error occurs, Express 5 automatically forwards it to your centralized error middleware.

This works because Express 5 already handles asynchronous errors.

=> Usage
import { asyncHandler } from "../utils/asyncHandler.js";

  export const getServices = asyncHandler(async (req, res) => {
    const services = await serviceCollection.find().toArray();

    res.status(200).json({
      success: true,
      data: services,
    });
  });


*/

// import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * custom asyncHandler for normal async routes
 *
 * Lets route handlers be `async` and forwards any thrown error to the error middleware.
 *
 */

/* export const asyncHandler =
  (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
  ): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  }; */
