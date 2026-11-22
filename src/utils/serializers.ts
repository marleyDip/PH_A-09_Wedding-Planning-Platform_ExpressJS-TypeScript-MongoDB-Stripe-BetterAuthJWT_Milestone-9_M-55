import type { ObjectId } from "mongodb";
import type { Role } from "../config/constants.js";
import type {
  BookingDoc,
  ServiceDoc,
  TransactionDoc,
  UserDoc,
} from "../config/db.js";
import { isPremium } from "./premium.js";

// Convert MongoDB IDs into strings for API responses.
const id = (value: ObjectId | string): string => String(value);

/**
 * Convert a date into an ISO string.
 * Returns null for missing or invalid dates.
 */
const iso = (value: Date | string | null | undefined): string | null => {
  if (value == null) return null;

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
};

/**
 * Normalize a database role for API responses.
 */
export const toRole = (role: unknown): Role => {
  if (role === "admin" || role === "vendor" || role === "customer") {
    return role;
  }

  return "customer";
};

/* vendors */
export interface PublicVendor {
  id: string;
  name: string;
  businessName: string;
  image: string | null;
  subscriptionPlan: "free" | "premium";
}

/** What any visitor may see about a vendor. No email or phone. */
export const toPublicVendor = (u: UserDoc): PublicVendor => ({
  id: id(u._id),
  name: u.name,
  businessName: u.businessName || u.name,
  image: u.image ?? null,
  subscriptionPlan: isPremium(u) ? "premium" : "free",
});

/* services */
export function toService(s: ServiceDoc, vendor?: PublicVendor | null) {
  return {
    id: id(s._id),
    vendorId: s.vendorId,
    name: s.serviceName,
    serviceName: s.serviceName,
    category: s.category,
    description: s.description,
    price: s.price,
    priceType: s.priceType,
    location: s.location,
    image: s.images[0] ?? "",
    images: s.images,
    status: s.status,
    isActive: s.isActive,
    rating: s.rating ?? 0,
    reviewCount: s.reviewCount ?? 0,
    createdAt: iso(s.createdAt),
    updatedAt: iso(s.updatedAt),
    vendor: vendor ?? null,
  };
}

/* bookings */
const bookingBase = (b: BookingDoc) => ({
  id: id(b._id),
  serviceId: b.serviceId,
  vendorId: b.vendorId,
  customerId: b.customerId,
  eventDate: b.eventDate,
  eventLocation: b.eventLocation,
  message: b.message,
  status: b.status,
  createdAt: iso(b.createdAt),
  respondedAt: iso(b.respondedAt),
  cancelledAt: iso(b.cancelledAt),
});

/** A customer's own booking, with the service and the vendor's public details. */
export function toCustomerBooking(
  b: BookingDoc,
  service: ServiceDoc | undefined,
  vendor: UserDoc | undefined,
) {
  return {
    ...bookingBase(b),

    service: service
      ? {
          id: id(service._id),
          name: service.serviceName,
          image: service.images[0] ?? "",
          category: service.category,
          location: service.location,
          price: service.price,
          priceType: service.priceType,
        }
      : null,

    vendor: vendor
      ? {
          id: id(vendor._id),
          name: vendor.name,
          businessName: vendor.businessName || vendor.name,
          image: vendor.image ?? null,
        }
      : null,
  };
}

/** A vendor's incoming request, with the service and the customer's contact details. */
export function toVendorBooking(
  b: BookingDoc,
  service: ServiceDoc | undefined,
  customer: UserDoc | undefined,
) {
  return {
    ...bookingBase(b),

    service: service
      ? {
          id: id(service._id),
          name: service.serviceName,
          image: service.images[0] ?? "",
          category: service.category,
          price: service.price,
          priceType: service.priceType,
        }
      : null,

    customer: customer
      ? {
          id: id(customer._id),
          name: customer.name,
          email: customer.email,
          image: customer.image ?? null,
          phone: customer.phone ?? null,
        }
      : null,
  };
}

/* users */

/** Full account details. Only the account owner and admins ever receive this. */
export const toAccount = (u: UserDoc) => ({
  id: id(u._id),
  name: u.name,
  email: u.email,
  image: u.image ?? null,
  role: toRole(u.role),
  isBlocked: !!u.isBlocked,
  businessName: u.businessName ?? null,
  phone: u.phone ?? null,
  address: u.address ?? null,
  subscriptionPlan: u.subscriptionPlan ?? "free",
  subscriptionExpiresAt: iso(u.subscriptionExpiresAt),
  isPremium: isPremium(u),
  createdAt: iso(u.createdAt),
});

/* const premium = isPremium(u);

return {
  // Other account fields...
  subscriptionPlan: premium ? "premium" : "free",
  subscriptionExpiresAt: iso(u.subscriptionExpiresAt),
  isPremium: premium,
};
*/

/* transactions */
export function toTransaction(t: TransactionDoc, vendor?: UserDoc | null) {
  return {
    id: id(t._id),
    vendorId: t.vendorId,
    plan: t.plan,
    amount: t.amount,
    currency: t.currency,
    stripeSessionId: t.stripeSessionId ?? "",
    stripeInvoiceId: t.stripeInvoiceId ?? null,
    stripeSubscriptionId: t.stripeSubscriptionId ?? null,
    status: t.status,
    createdAt: iso(t.createdAt),
    vendor: vendor
      ? {
          id: id(vendor._id),
          name: vendor.name,
          businessName: vendor.businessName ?? null,
          email: vendor.email,
          image: vendor.image ?? null,
        }
      : null,
  };
}
