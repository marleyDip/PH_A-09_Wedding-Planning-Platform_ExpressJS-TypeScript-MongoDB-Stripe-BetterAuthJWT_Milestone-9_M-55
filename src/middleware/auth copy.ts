import type { NextFunction, Request, RequestHandler, Response } from "express";
import { createRemoteJWKSet, errors, jwtVerify } from "jose";
import type { Role } from "../config/constants.js";
import type { UserDoc } from "../config/db.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { findUserById } from "../utils/lookups.js";
import { toRole } from "../utils/serializers.js";

export interface AuthUser {
  id: string;
  role: Role;
  name: string;
  email: string;
  doc: UserDoc;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Better Auth's jwt() plugin publishes its public keys at <BETTER_AUTH_URL>/api/auth/jwks and signs tokens
 * with issuer = audience = BETTER_AUTH_URL. jose caches the keys and re-fetches when a key id is unknown.
 */
const jwks = createRemoteJWKSet(
  new URL(`${env.BETTER_AUTH_URL}/api/auth/jwks`),
);

/**
 * Verifies the Bearer token (signature, issuer, audience, expiry), then loads the user FROM THE DATABASE.
 * The role and blocked flag always come from the database, never from the token or the request body, so a
 * block or role change applies immediately even while an old token is still valid.
 *
 *   401  missing, invalid or expired token, or the user no longer exists
 *   403  the account is blocked
 *   503  the auth server could not be reached to fetch the signing keys
 */
export const authenticate: RequestHandler = asyncHandler(
  async (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header || !/^Bearer\s+\S+$/i.test(header))
      throw new ApiError(401, "Authentication required.", { code: "NO_TOKEN" });
    const token = header.replace(/^Bearer\s+/i, "");

    let userId: string | undefined;
    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer: env.BETTER_AUTH_URL,
        audience: env.BETTER_AUTH_URL,
      });

      userId =
        typeof payload.sub === "string"
          ? payload.sub
          : typeof payload["id"] === "string"
            ? payload["id"]
            : undefined;
    } catch (e) {
      if (e instanceof errors.JWTExpired)
        throw new ApiError(
          401,
          "Your session has expired. Please sign in again.",
          { code: "TOKEN_EXPIRED" },
        );
      if (e instanceof errors.JOSEError)
        throw new ApiError(401, "Invalid authentication token.", {
          code: "INVALID_TOKEN",
        });
      console.error(
        "JWT verification failed (could not reach the auth server?):",
        (e as Error).message,
      );
      throw new ApiError(
        503,
        "Authentication service is unavailable. Please try again.",
        { code: "AUTH_UNAVAILABLE" },
      );
    }
    if (!userId)
      throw new ApiError(401, "Invalid authentication token.", {
        code: "INVALID_TOKEN",
      });

    const doc = await findUserById(userId);

    if (!doc)
      throw new ApiError(401, "This account no longer exists.", {
        code: "NO_USER",
      });
    if (doc.isBlocked)
      throw new ApiError(403, "Your account has been blocked.", {
        code: "ACCOUNT_BLOCKED",
      });

    req.user = {
      id: String(doc._id),
      role: toRole(doc.role),
      name: doc.name,
      email: doc.email,
      doc,
    };

    next();
  },
);

/** Role gate. Always put it AFTER `authenticate`. 403 when the caller's role isn't allowed. */
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user)
      return next(
        new ApiError(401, "Authentication required.", { code: "NO_TOKEN" }),
      );
    if (!roles.includes(req.user.role))
      return next(
        new ApiError(403, "You don't have permission to do that.", {
          code: "FORBIDDEN",
        }),
      );
    next();
  };
