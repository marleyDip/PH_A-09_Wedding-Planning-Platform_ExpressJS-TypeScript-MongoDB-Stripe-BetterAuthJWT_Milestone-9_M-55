/**
 * Converts empty or whitespace-only strings to undefined.
 * Useful for query parameters and environment variables.
 */
export const blankToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

/**
 * Escapes special regex characters in user-provided text.
 * Prevents user input from changing the intended regex pattern.
 */
export const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Treat an empty string from a query string or .env file as "not provided". */
// export const blank = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

/** Escape user text before it is used inside a MongoDB $regex. */
// export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
