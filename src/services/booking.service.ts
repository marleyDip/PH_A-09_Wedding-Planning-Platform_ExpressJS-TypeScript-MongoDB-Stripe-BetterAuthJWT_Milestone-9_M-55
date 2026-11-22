import { MongoServerError, ObjectId } from "mongodb";

import {
  cols,
  userIdFilter,
  type BookingDoc,
  type BookingFields,
  type ServiceDoc,
  type UserDoc,
} from "../config/db.js";

import type { CreateBookingInput } from "../schemas/booking.schema.js";

import { ApiError } from "../utils/ApiError.js";
import { parseId } from "../utils/ids.js";

// Consistent duplicate-booking error.
function duplicateBookingError(): ApiError {
  return new ApiError(
    409,
    "You already have an active request for this service on that date.",
    { code: "DUPLICATE_BOOKING" },
  );
}

// Check whether the customer already has an active booking.
export async function hasActiveBooking(
  serviceId: string,
  customerId: string,
  eventDate: string,
): Promise<boolean> {
  const existing = await cols.bookings.findOne({
    serviceId,
    customerId,
    eventDate,
    status: { $in: ["pending", "accepted"] },
  });

  return Boolean(existing);
}

// Create a new booking.
// export async function createBooking(
//   input: CreateBookingInput,
//   customerId: string,
// ): Promise<{
//   booking: BookingDoc;
//   service: NonNullable<Awaited<ReturnType<typeof cols.services.findOne>>>;
//   vendor: NonNullable<Awaited<ReturnType<typeof cols.users.findOne>>>;
// }> {

export async function createBooking(
  input: CreateBookingInput,
  customerId: string,
): Promise<{
  booking: BookingDoc;
  service: ServiceDoc;
  vendor: UserDoc;
}> {
  // 1. Find the requested service.
  const service = await cols.services.findOne({
    _id: parseId(input.serviceId, "service"),
  });

  if (!service) {
    throw new ApiError(404, "This service doesn't exist.", {
      code: "NOT_FOUND",
    });
  }

  // 2. Check service availability.
  const unavailable = () =>
    new ApiError(403, "This service is not available for booking right now.", {
      code: "UNAVAILABLE",
    });

  if (service.status !== "approved" || !service.isActive) {
    throw unavailable();
  }

  // 3. Find the service owner.
  const vendor = await cols.users.findOne(userIdFilter(service.vendorId));

  if (!vendor || vendor.role !== "vendor" || vendor.isBlocked) {
    throw unavailable();
  }

  // 4. Prevent vendors from booking their own services.
  if (service.vendorId === customerId) {
    throw new ApiError(403, "You can't book your own service.", {
      code: "OWN_SERVICE",
    });
  }

  // 5. Check for an existing active booking.
  const exists = await hasActiveBooking(
    input.serviceId,
    customerId,
    input.eventDate,
  );

  if (exists) {
    throw duplicateBookingError();
  }

  // 6. Prepare the booking document.
  const doc: BookingFields = {
    serviceId: input.serviceId,
    vendorId: service.vendorId,
    customerId,
    eventDate: input.eventDate,
    eventLocation: input.eventLocation,
    message: input.message,
    status: "pending",
    createdAt: new Date(),
  };

  // 7. Insert booking.
  try {
    const { insertedId } = await cols.bookings.insertOne(doc);

    const booking: BookingDoc = {
      ...doc,
      _id: insertedId,
    };

    return { booking, service, vendor };
  } catch (error) {
    // The unique MongoDB index is the final protection
    // against simultaneous duplicate requests.
    if (error instanceof MongoServerError && error.code === 11000) {
      throw duplicateBookingError();
    }

    throw error;
  }
}

// Cancel a customer's pending booking.
export async function cancelBooking(
  bookingId: ObjectId,
  customerId: string,
): Promise<BookingDoc> {
  const cancelledAt = new Date();

  // Atomic update: only the owner can cancel a pending booking.
  const updated = await cols.bookings.findOneAndUpdate(
    {
      _id: bookingId,
      customerId,
      status: "pending",
    },
    {
      $set: {
        status: "cancelled",
        cancelledAt,
      },
    },
    {
      returnDocument: "after",
    },
  );

  if (updated) {
    return updated;
  }

  // Determine why the update didn't match.
  const existing = await cols.bookings.findOne(
    { _id: bookingId },
    { projection: { customerId: 1, status: 1 } },
  );

  if (!existing) {
    throw new ApiError(404, "This booking doesn't exist.", {
      code: "NOT_FOUND",
    });
  }

  if (existing.customerId !== customerId) {
    throw new ApiError(403, "This booking isn't yours.", {
      code: "NOT_OWNER",
    });
  }

  throw new ApiError(409, `This request is already ${existing.status}.`, {
    code: "NOT_PENDING",
  });
}

// Vendor accepts or rejects a pending booking.
export async function respondToBooking(
  bookingId: ObjectId,
  vendorId: string,
  status: "accepted" | "rejected",
): Promise<BookingDoc> {
  const respondedAt = new Date();

  // Atomic update: only the owning vendor can respond
  // while the booking is still pending.
  const updated = await cols.bookings.findOneAndUpdate(
    {
      _id: bookingId,
      vendorId,
      status: "pending",
    },
    {
      $set: {
        status,
        respondedAt,
      },
    },
    {
      returnDocument: "after",
    },
  );

  if (updated) {
    return updated;
  }

  // Determine why the update didn't match.
  const existing = await cols.bookings.findOne(
    { _id: bookingId },
    { projection: { vendorId: 1, status: 1 } },
  );

  if (!existing) {
    throw new ApiError(404, "This request doesn't exist.", {
      code: "NOT_FOUND",
    });
  }

  if (existing.vendorId !== vendorId) {
    throw new ApiError(403, "This request belongs to another vendor.", {
      code: "NOT_OWNER",
    });
  }

  throw new ApiError(409, `This request is already ${existing.status}.`, {
    code: "NOT_PENDING",
  });
}
