import { z } from "zod";
import { isRealDate, todayString } from "../utils/dates.js";
import { isObjectId } from "../utils/ids.js";

// Event date must be valid and cannot be in the past.
const eventDate = z
  .string()
  .trim()
  .refine(isRealDate, "Enter a valid event date (YYYY-MM-DD).")
  .refine(
    (date) => date >= todayString(),
    "The event date can't be in the past.",
  );

// POST /bookings
export const createBookingSchema = z.object({
  serviceId: z.string().refine(isObjectId, "Invalid service."),
  eventDate,
  eventLocation: z.string().trim().min(3, "Enter the event location.").max(160),
  message: z
    .string()
    .trim()
    .max(1000, "Message is too long (1000 characters max).")
    .default(""),
});

// GET /bookings/check
export const checkBookingQuerySchema = z.object({
  serviceId: z.string().refine(isObjectId, "Invalid service."),
  eventDate: z
    .string()
    .trim()
    .refine(isRealDate, "Enter a valid event date (YYYY-MM-DD)."),
});

// PATCH /bookings/:id/status
export const bookingDecisionSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
});

// Inferred TypeScript types
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CheckBookingQuery = z.infer<typeof checkBookingQuerySchema>;
export type BookingDecision = z.infer<typeof bookingDecisionSchema>;
