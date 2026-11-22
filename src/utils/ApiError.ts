/**
 *
 * Represents an application error with an HTTP status code.
 * Can be thrown anywhere and handled by the centralized error middleware.
 *
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(
    status: number,
    message: string,
    options?: {
      code?: string;
      details?: unknown;
      cause?: unknown;
    },
  ) {
    super(
      message,
      options?.cause !== undefined ? { cause: options.cause } : undefined,
    );

    this.name = "ApiError";
    this.status = status;

    if (options?.code !== undefined) {
      this.code = options.code;
    }

    if (options?.details !== undefined) {
      this.details = options.details;
    }

    // Maintain the correct prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** An error that maps to an HTTP status. Thrown anywhere, rendered by middleware/error.ts. */
/* export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(
    status: number,
    message: string,
    code?: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    if (code !== undefined) this.code = code;
    this.details = details;
  }
} */

/* How to use it

Previously, you would write:

  throw new ApiError(
    404,
    "Service not found",
    "SERVICE_NOT_FOUND"
  );


With the modern implementation:

  throw new ApiError(404, "Service not found", {
    code: "SERVICE_NOT_FOUND",
  });


With additional details:

  throw new ApiError(400, "Validation failed", {
    code: "VALIDATION_ERROR",
    details: {
      field: "email",
      message: "Invalid email address",
    },
  });


With an original error as the cause:
  
  try {
    await someDatabaseOperation();
  } catch (error) {
    throw new ApiError(500, "Database operation failed", {
      code: "DATABASE_ERROR",
      cause: error,
    });
  }


Important: Why use cause?
Suppose MongoDB throws an error.

You catch it and create an ApiError.
  
  - message: User-friendly application error.
  - code: Machine-readable application error.
  - details: Additional structured information.
  - cause: Original error for debugging and logging.

This preserves the original error without exposing internal database information to API clients.

*/
