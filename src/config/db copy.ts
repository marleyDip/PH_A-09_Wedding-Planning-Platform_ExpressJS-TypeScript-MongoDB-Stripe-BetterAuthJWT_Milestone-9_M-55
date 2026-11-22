import type { Filter } from "mongodb";
import { Collection, Db, MongoClient, ObjectId } from "mongodb";
import type { BookingStatus, ServiceStatus } from "./constants.js";
import { env } from "./env.js";

/* ------------------------------ document types ------------------------------ */

/** The Better Auth `user` collection (only the fields this API reads or writes). */
export interface UserDoc {
  _id: ObjectId;
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

/** `services` collection. Fields follow the assignment (vendorId, serviceName, ... status, createdAt). */
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

/** `bookings` collection. */
export interface BookingDoc {
  _id: ObjectId;
  serviceId: string;
  vendorId: string;
  customerId: string;
  eventDate: string; // YYYY-MM-DD
  eventLocation: string;
  message: string;
  status: BookingStatus;
  createdAt: Date;
  respondedAt?: Date;
  cancelledAt?: Date;
}

/** `transactions` collection. Written ONLY by the verified Stripe webhook. */
export interface TransactionDoc {
  _id: ObjectId;
  vendorId: string;
  plan: string;
  amount: number; // smallest currency unit (cents), the way Stripe reports it
  currency: string;
  stripeSessionId?: string;
  stripeInvoiceId?: string;
  stripeSubscriptionId?: string | null;
  status: string; // paid | pending | failed | expired
  createdAt: Date;
}

/* -------------------------------- connection -------------------------------- */

let client: MongoClient | null = null;
let db: Db | null = null;
let connecting: Promise<Db> | null = null;

async function createIndexes(database: Db) {
  const services = database.collection("services");
  const bookings = database.collection("bookings");
  const transactions = database.collection("transactions");

  await Promise.all([
    services.createIndex({ vendorId: 1, createdAt: -1 }),
    services.createIndex({ status: 1, isActive: 1, category: 1 }),
    bookings.createIndex({ customerId: 1, createdAt: -1 }),
    bookings.createIndex({ vendorId: 1, createdAt: -1 }),
    bookings.createIndex({ serviceId: 1, status: 1 }),
    transactions.createIndex({ vendorId: 1, createdAt: -1 }),
    // Stripe events can be delivered more than once: these make the webhook idempotent
    transactions.createIndex(
      { stripeSessionId: 1 },
      {
        unique: true,
        partialFilterExpression: { stripeSessionId: { $type: "string" } },
      },
    ),
    transactions.createIndex(
      { stripeInvoiceId: 1 },
      {
        unique: true,
        partialFilterExpression: { stripeInvoiceId: { $type: "string" } },
      },
    ),
  ]);

  // One active (pending / accepted) request per customer, service and event date, enforced by the database
  // so two simultaneous clicks can't both succeed. Needs MongoDB 6.0+ for $in in a partial index.
  try {
    await bookings.createIndex(
      { serviceId: 1, customerId: 1, eventDate: 1 },
      {
        unique: true,
        partialFilterExpression: { status: { $in: ["pending", "accepted"] } },
      },
    );
  } catch (e) {
    console.warn(
      "Could not create the duplicate-booking index (the app-level check still applies):",
      (e as Error).message,
    );
  }
}

export function connectDb(): Promise<Db> {
  if (db) return Promise.resolve(db);
  if (!connecting) {
    connecting = (async () => {
      client = new MongoClient(env.MONGODB_URI);
      await client.connect();
      const database = client.db(env.DB_NAME);
      await createIndexes(database);
      db = database;
      console.log(`MongoDB connected (${env.DB_NAME})`);
      return database;
    })().catch((e) => {
      connecting = null;
      throw e;
    });
  }
  return connecting;
}

export async function closeDb() {
  await client?.close();
  client = null;
  db = null;
  connecting = null;
}

function getDb(): Db {
  if (!db)
    throw new Error("Database is not connected yet. Call connectDb() first.");
  return db;
}

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

/* --------------------------------- helpers --------------------------------- */

/** Better Auth stores user ids as ObjectId; match the string form too so either storage works. */
export function userIdFilter(id: string): Filter<UserDoc> {
  const ids: (ObjectId | string)[] =
    ObjectId.isValid(id) && String(new ObjectId(id)) === id
      ? [new ObjectId(id), id]
      : [id];
  return { _id: { $in: ids } } as unknown as Filter<UserDoc>;
}

/** Ids of vendors whose services may be shown to customers (a vendor account that isn't blocked). */
export async function liveVendorIds(): Promise<string[]> {
  const rows = await cols.users
    .find(
      { role: "vendor", isBlocked: { $ne: true } },
      { projection: { _id: 1 } },
    )
    .toArray();
  return rows.map((u) => String(u._id));
}
