import { ObjectId } from "mongodb";
import { ApiError } from "./ApiError.js";

/**
 * Checks whether a value is a valid MongoDB ObjectId string.
 */
export function isObjectId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

/**
 * Parses a route or body ID into a MongoDB ObjectId.
 * Invalid IDs are treated as missing records (404).
 */
export function parseId(id: unknown, what = "record"): ObjectId {
  if (!isObjectId(id)) {
    throw new ApiError(404, `This ${what} doesn't exist.`, {
      code: "NOT_FOUND",
    });
  }

  return new ObjectId(id);
}

// export const isObjectId = (s: unknown): s is string =>
//   typeof s === "string" && /^[a-f\d]{24}$/i.test(s);

/** Parse a route / body id. An invalid id is treated like a missing record (404), never a 500. */
/* export function parseId(id: unknown, what = "record"): ObjectId {
  if (!isObjectId(id))
    throw new ApiError(404, `This ${what} doesn't exist.`, "NOT_FOUND");
  return new ObjectId(id);
} */
