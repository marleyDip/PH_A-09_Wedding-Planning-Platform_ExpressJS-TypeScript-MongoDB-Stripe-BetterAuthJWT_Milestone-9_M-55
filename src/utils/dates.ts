import { env } from "../config/env.js";

/**
 * Returns today's date as YYYY-MM-DD
 * in the configured time zone (default: Asia/Dhaka).
 */
export function todayString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: env.APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Checks whether a string is a valid calendar date in YYYY-MM-DD format.
 * Rejects impossible dates such as 2026-02-31.
 */
export function isRealDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** Today's date as YYYY-MM-DD in the configured time zone (default Asia/Dhaka). */
// export function todayString(): string {
//   return new Intl.DateTimeFormat("en-CA", {
//     timeZone: env.APP_TIMEZONE,
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//   }).format(new Date());
// }

/** True for a real calendar date written as YYYY-MM-DD (rejects 2026-02-31). */
/* export function isRealDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;

  // const [y, m, d] = s.split("-").map(Number);
  // const dt = new Date(Date.UTC(y, m - 1, d));

  const y = Number(s.slice(0, 4));
  const m = Number(s.slice(5, 7));
  const d = Number(s.slice(8, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));

  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
} */
