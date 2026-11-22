import type { RequestHandler } from "express";
import { createRemoteJWKSet, errors, jwtVerify } from "jose";
import type { Role } from "../config/constants.js";
import type { UserDoc } from "../config/db.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { findUserById } from "../utils/lookups.js";

export interface AuthUser {
  id: string;
  role: Role;
  name: string;
  email: string;
  doc: UserDoc;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Better Auth JWT public signing keys.
 *
 * jose caches the keys and refreshes them when necessary.
 */
const jwks = createRemoteJWKSet(
  new URL(`${env.BETTER_AUTH_URL.replace(/\/+$/, "")}/api/auth/jwks`),
  {
    timeoutDuration: 5_000,
  },
);

/**
 * Explicitly validate roles from the database.
 * Never silently convert an unknown role into a customer role.
 */
const isRole = (value: unknown): value is Role =>
  value === "admin" || value === "vendor" || value === "customer";

/**
 * Verify Bearer JWT, load the user from MongoDB,
 * and attach the authenticated user to the request.
 */
export const authenticate: RequestHandler = async (req, _res, next) => {
  const authorization = req.headers.authorization;

  const match = /^Bearer\s+(\S+)$/i.exec(authorization ?? "");

  if (!match) {
    throw new ApiError(401, "Authentication required.", {
      code: "NO_TOKEN",
    });
  }

  // const token = req.headers.authorization?.split(" ")[1];
  // const token = authorization.slice(7).trim();

  // Safe to use the extracted token now
  const token = match[1];

  if (!token) {
    throw new ApiError(401, "Authentication required.", {
      code: "NO_TOKEN",
    });
  }

  let userId: string | undefined;

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: env.BETTER_AUTH_URL,
      audience: env.BETTER_AUTH_URL,

      // Better Auth's default JWT signing algorithm.
      // Change this if your Better Auth configuration uses another algorithm.
      algorithms: ["EdDSA"],
    });

    // userId =
    //   typeof payload.sub === "string" && payload.sub.length > 0
    //     ? payload.sub
    //     : typeof payload.id === "string" && payload.id.length > 0
    //       ? payload.id
    //       : undefined;

    userId =
      typeof payload.sub === "string" && payload.sub.length > 0
        ? payload.sub
        : typeof payload["id"] === "string" && payload["id"].length > 0
          ? payload["id"]
          : undefined;
  } catch (error) {
    if (error instanceof errors.JWTExpired) {
      throw new ApiError(
        401,
        "Your session has expired. Please sign in again.",
        { code: "TOKEN_EXPIRED" },
      );
    }

    // Remote JWKS infrastructure or configuration failures.
    if (
      error instanceof errors.JWKSTimeout ||
      error instanceof errors.JWKSInvalid ||
      error instanceof TypeError
    ) {
      console.error("JWKS verification unavailable:", error);

      throw new ApiError(
        503,
        "Authentication service is unavailable. Please try again.",
        { code: "AUTH_UNAVAILABLE" },
      );
    }

    // Invalid JWT, signature, issuer, audience, or claims.
    if (error instanceof errors.JOSEError) {
      throw new ApiError(401, "Invalid authentication token.", {
        code: "INVALID_TOKEN",
      });
    }

    // Unexpected programming or runtime error.
    throw error;
  }

  if (!userId) {
    throw new ApiError(401, "Invalid authentication token.", {
      code: "INVALID_TOKEN",
    });
  }

  // Always load current account information from MongoDB.
  const doc = await findUserById(userId);

  if (!doc) {
    throw new ApiError(401, "This account no longer exists.", {
      code: "NO_USER",
    });
  }

  if (doc.isBlocked) {
    throw new ApiError(403, "Your account has been blocked.", {
      code: "ACCOUNT_BLOCKED",
    });
  }

  if (!isRole(doc.role)) {
    console.error("Invalid role found for user:", String(doc._id));

    throw new ApiError(403, "Your account has an invalid role.", {
      code: "INVALID_ROLE",
    });
  }

  req.user = {
    id: String(doc._id),
    role: doc.role,
    name: doc.name,
    email: doc.email,
    doc,
  };

  next();
};

/**
 * Role-based access control.
 * Always use after authenticate.
 */
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      return next(
        new ApiError(401, "Authentication required.", {
          code: "NO_TOKEN",
        }),
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, "You don't have permission to do that.", {
          code: "FORBIDDEN",
        }),
      );
    }

    next();
  };

/* This error comes from your TypeScript setting:

  "noPropertyAccessFromIndexSignature": true

In jose, payload.id is not a declared property of the JWT JWTPayload interface. Additional custom claims are accessed through its index signature.

  typeof payload.id === "string" && payload.id.length > 0
    ? payload.id
    : undefined;

To:
  typeof payload["id"] === "string" && payload["id"].length > 0
    ? payload["id"]
    : undefined;

Complete corrected code
userId =
  typeof payload.sub === "string" && payload.sub.length > 0
    ? payload.sub
    : typeof payload["id"] === "string" && payload["id"].length > 0
      ? payload["id"]
      : undefined;


Why?
Access	         Meaning
payload.sub	    Standard JWT claim declared in the type
payload["id"]	  Custom JWT claim accessed through the index signature

My recommendation: Keep noPropertyAccessFromIndexSignature: true. It's a useful strict TypeScript setting, and bracket notation is the correct solution here.

You don't need a type assertion or a change to your JWTPayload type.
*/

/*
// Any authenticated user
router.get("/profile", authenticate, getProfile);

// Only vendors
router.post(
  "/services",
  authenticate,
  requireRole("vendor"),
  createService,
);

// Vendors and admins
router.delete(
  "/services/:id",
  authenticate,
  requireRole("vendor", "admin"),
  deleteService,
);

// Admin only
router.get(
  "/admin/users",
  authenticate,
  requireRole("admin"),
  getUsers,
);


*/

/* This JavaScript code extracts a Bearer token (typically a JWT or API key) from an incoming HTTP request's Authorization header.

1. Grabbing the Header

  const authorization = req.headers.authorization;

=> req.headers.authorization: Looks at the incoming HTTP request (req) and retrieves the value of the Authorization header (e.g., "Bearer eyJhbGciOiJIUzI1Ni..."). If the header wasn't sent, authorization will be undefined.


2. Matching and Extracting the Token

  const match = /^Bearer\s+(\S+)$/i.exec(authorization ?? "");

=> authorization ?? "": Uses the nullish coalescing operator (??). If authorization is undefined or null, it safely falls back to an empty string ("") so the code doesn't crash when trying to run a regex on it.

=> /^Bearer\s+(\S+)$/i: A regular expression (regex) used to validate the format and capture the token:

    • ^: Asserts the string must start right here (no leading characters).
    • Bearer: Matches the literal word "Bearer".
    
    • \s+: Matches one or more whitespace characters (spaces or tabs) separating the word "Bearer" from the token.
    • (\S+): The parentheses create a capture group. \S+ matches one or more non-whitespace characters—this is your actual token.
    
    • $: Asserts the string must end right here (ensuring there are no extra trailing spaces or words).
    • i: Makes the match case-insensitive (so "bearer <token>" and "BEARER <token>" work just as well as "Bearer <token>").
    
    • .exec(...): Executes the regex search against the header string.

What match Returns

  • If valid (e.g., "Bearer abc123xyz"): match becomes an array where match[0] is the full string ("Bearer abc123xyz") and match[1] is the captured token ("abc123xyz").

  • If invalid or missing (e.g., "Basic abc123", "Bearer ", or no header at all): match evaluates to null.

*/
