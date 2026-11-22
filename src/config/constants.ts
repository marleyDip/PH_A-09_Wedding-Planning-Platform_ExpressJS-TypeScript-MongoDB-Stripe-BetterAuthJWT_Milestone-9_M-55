import { CATEGORIES } from "./content.js";

/** Free vendors can have at most this many active services. Premium vendors have no limit. */
export const FREE_LIMIT = 3;

export const ROLES = ["customer", "vendor", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const SERVICE_STATUSES = ["pending", "approved", "rejected"] as const;
export type ServiceStatus = (typeof SERVICE_STATUSES)[number];

export const BOOKING_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "cancelled",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PRICE_TYPES = [
  "per event",
  "per day",
  "per person",
  "per package",
] as const;

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name) as [
  string,
  ...string[],
];
