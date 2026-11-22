import { MongoClient, ObjectId } from "mongodb";

import type { Collection, Db, Filter, IndexDescription } from "mongodb";

import type { BookingStatus, ServiceStatus } from "./constants.js";

import { env } from "./env.js";

/* Document types */
export interface UserDoc {
  _id: ObjectId | string;
  name: string;
  email: string;
  image?: string | null;
  role?: string;
  isBlocked?: boolean;
  businessName?: string | null;
  phone?: string | null;
  address?: string | null;
  subscriptionPlan?: string | null;
  subscriptionExpiresAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ServiceDoc {
  _id: ObjectId;
  vendorId: string;
  serviceName: string;
  category: string;
  description: string;
  price: number;
  priceType: string;
  location: string;
  images: string[];
  status: ServiceStatus;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
}

export interface BookingDoc {
  _id: ObjectId;
  serviceId: string;
  vendorId: string;
  customerId: string;
  eventDate: string;
  eventLocation: string;
  message: string;
  status: BookingStatus;
  createdAt: Date;
  respondedAt?: Date;
  cancelledAt?: Date;
}

export interface TransactionDoc {
  _id: ObjectId;
  vendorId: string;
  plan: string;
  amount: number;
  currency: string;
  stripeSessionId?: string;
  stripeInvoiceId?: string;
  stripeSubscriptionId?: string | null;
  status: "paid" | "pending" | "failed" | "expired"; // string
  createdAt: Date;
}

/**
 * Creates all required indexes.
 * Indexes are grouped by collection to minimize database commands.
 */
async function createIndexes(database: Db): Promise<void> {
  const services = database.collection("services");
  const bookings = database.collection("bookings");
  const transactions = database.collection("transactions");

  const serviceIndexes: IndexDescription[] = [
    {
      key: { vendorId: 1, createdAt: -1 },
      name: "vendor_createdAt",
    },
    {
      key: { status: 1, isActive: 1, category: 1 },
      name: "status_active_category",
    },
  ];

  const bookingIndexes: IndexDescription[] = [
    {
      key: { customerId: 1, createdAt: -1 },
      name: "customer_createdAt",
    },
    {
      key: { vendorId: 1, createdAt: -1 },
      name: "vendor_createdAt",
    },
    {
      key: { serviceId: 1, status: 1 },
      name: "service_status",
    },
    {
      key: { serviceId: 1, customerId: 1, eventDate: 1 },
      name: "unique_active_booking",
      unique: true,
      partialFilterExpression: {
        status: { $in: ["pending", "accepted"] },
      },
    },
  ];

  const transactionIndexes: IndexDescription[] = [
    {
      key: { vendorId: 1, createdAt: -1 },
      name: "vendor_createdAt",
    },
    {
      key: { stripeSessionId: 1 },
      name: "unique_stripe_session",
      unique: true,
      partialFilterExpression: {
        stripeSessionId: { $type: "string" },
      },
    },
    {
      key: { stripeInvoiceId: 1 },
      name: "unique_stripe_invoice",
      unique: true,
      partialFilterExpression: {
        stripeInvoiceId: { $type: "string" },
      },
    },
  ];

  // Create indexes concurrently, with one batch per collection.
  await Promise.all([
    services.createIndexes(serviceIndexes),
    bookings.createIndexes(bookingIndexes),
    transactions.createIndexes(transactionIndexes),
  ]);

  console.log("MongoDB indexes initialized successfully.");
}

/* ================================
   DATABASE CONNECTION
================================ */
let client: MongoClient | null = null;
let db: Db | null = null;
let connecting: Promise<Db> | null = null;

/**
 * Establishes a single shared MongoDB connection.
 * Concurrent calls reuse the same connection attempt.
 */
export async function connectDb(): Promise<Db> {
  if (db) return db;
  if (connecting) return connecting;

  const attempt = (async (): Promise<Db> => {
    const mongoClient = new MongoClient(env.MONGODB_URI, {
      appName: "WedPlan API",
    });

    try {
      await mongoClient.connect();

      const database = mongoClient.db(env.DB_NAME);

      // Initialize indexes before making the database available.
      await createIndexes(database);

      client = mongoClient;
      db = database;

      console.log(`MongoDB connected (${env.DB_NAME})`);

      return database;
    } catch (error) {
      // Prevent connection leaks when initialization fails.
      await mongoClient.close().catch(() => undefined);

      throw error;
    }
  })();

  connecting = attempt;

  try {
    return await attempt;
  } finally {
    if (connecting === attempt) {
      connecting = null;
    }
  }
}

/**
 * Gracefully closes the MongoDB connection.
 */
export async function closeDb(): Promise<void> {
  // Wait for an ongoing connection attempt to finish.
  const pending = connecting;

  if (pending) {
    await pending.catch(() => undefined);
  }

  const currentClient = client;

  // Clear references before closing.
  client = null;
  db = null;
  connecting = null;

  await currentClient?.close();

  console.log("MongoDB connection closed.");
}

/**
 * Returns the active database instance.
 */
function getDb(): Db {
  if (!db) {
    throw new Error("MongoDB is not connected. Call connectDb() first.");
  }

  return db;
}

/* ================================
   COLLECTIONS
================================ */
export const cols = {
  get users(): Collection<UserDoc> {
    return getDb().collection<UserDoc>(env.USERS_COLLECTION);
  },

  get sessions(): Collection {
    return getDb().collection(env.SESSIONS_COLLECTION);
  },

  get services(): Collection<ServiceDoc> {
    return getDb().collection<ServiceDoc>("services");
  },

  get bookings(): Collection<BookingDoc> {
    return getDb().collection<BookingDoc>("bookings");
  },

  get transactions(): Collection<TransactionDoc> {
    return getDb().collection<TransactionDoc>("transactions");
  },
};

/**
 * Matches user IDs stored as either MongoDB ObjectId or string.
 */
export function userIdFilter(id: string): Filter<UserDoc> {
  const ids: UserDoc["_id"][] = [id];

  if (/^[a-f\d]{24}$/i.test(id)) {
    ids.push(new ObjectId(id));
  }

  return {
    _id: { $in: ids },
  };
}

/* const user = await cols.users.findOne(
  userIdFilter("674abc123456789012345678")
);
*/

/**
 * Returns IDs of active, unblocked vendor accounts.
 */
export async function liveVendorIds(): Promise<string[]> {
  const vendors = await cols.users
    .find(
      {
        role: "vendor",
        isBlocked: { $ne: true },
      },
      {
        projection: { _id: 1 },
      },
    )
    .toArray();

  return vendors.map(({ _id }) => String(_id));
}
