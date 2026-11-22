import { ObjectId, type Filter } from "mongodb";

import {
  cols,
  userIdFilter,
  type ServiceFields,
  type UserDoc,
} from "../config/db.js";

import type {
  BlockUserInput,
  ServicesQuery,
  UpdateServiceStatusInput,
  UsersQuery,
} from "../schemas/admin.schema.js";

import { ApiError } from "../utils/ApiError.js";
import { isObjectId, parseId } from "../utils/ids.js";
import { usersById } from "../utils/lookups.js";
import { escapeRegex } from "../utils/query.js";

import {
  toAccount,
  toPublicVendor,
  toService,
  toTransaction,
} from "../utils/serializers.js";

// ================
// OVERVIEW / STATS
// ================
export async function getAdminStats() {
  const [
    totalUsers,
    vendors,
    customers,
    admins,
    totalServices,
    pendingServices,
    approvedServices,
    rejectedServices,
    totalTransactions,
    paidTransactions,
    revenue,
  ] = await Promise.all([
    cols.users.countDocuments({}),
    cols.users.countDocuments({ role: "vendor" }),
    cols.users.countDocuments({
      role: { $nin: ["vendor", "admin"] },
    }),
    cols.users.countDocuments({ role: "admin" }),

    cols.services.countDocuments({}),
    cols.services.countDocuments({ status: "pending" }),
    cols.services.countDocuments({ status: "approved" }),
    cols.services.countDocuments({ status: "rejected" }),

    cols.transactions.countDocuments({}),
    cols.transactions.countDocuments({ status: "paid" }),

    cols.transactions
      .aggregate<{
        _id: string;
        amount: number;
      }>([
        {
          $match: { status: "paid" },
        },
        {
          $group: {
            _id: "$currency",
            amount: { $sum: "$amount" },
          },
        },
      ])
      .toArray(),
  ]);

  return {
    totalUsers,
    vendors,
    customers,
    admins,
    totalServices,
    pendingServices,
    approvedServices,
    rejectedServices,
    totalTransactions,
    paidTransactions,
    revenue: revenue.map((item) => ({
      currency: item._id,
      amount: item.amount,
    })),
  };
}

// =====
// USERS
// =====
export async function getAllUsers(query: UsersQuery) {
  const filter: Filter<UserDoc> = {};

  if (query.role === "customer") {
    filter.role = {
      $nin: ["vendor", "admin"],
    };
  } else if (query.role) {
    filter.role = query.role;
  }

  if (query.search) {
    const regex = {
      $regex: escapeRegex(query.search),
      $options: "i",
    };

    filter.$or = [{ name: regex }, { email: regex }];
  }

  const rows = await cols.users.find(filter).sort({ createdAt: -1 }).toArray();

  return rows.map((user) => toAccount(user));
}

// ====================
// BLOCK / UNBLOCK USER
// ====================
export async function updateUserBlockStatus(
  id: string,
  blocked: BlockUserInput["blocked"],
  adminId: string,
) {
  if (!isObjectId(id)) {
    throw new ApiError(404, "This user doesn't exist.", {
      code: "NOT_FOUND",
    });
  }

  const target = await cols.users.findOne(userIdFilter(id));

  if (!target) {
    throw new ApiError(404, "This user doesn't exist.", {
      code: "NOT_FOUND",
    });
  }

  if (String(target._id) === adminId) {
    throw new ApiError(403, "You can't block your own account.", {
      code: "SELF_BLOCK",
    });
  }

  if (target.role === "admin") {
    throw new ApiError(403, "Admin accounts can't be blocked.", {
      code: "ADMIN_BLOCK",
    });
  }

  await cols.users.updateOne(
    { _id: target._id },
    {
      $set: {
        isBlocked: blocked,
        updatedAt: new Date(),
      },
    },
  );

  // Blocking a user immediately removes their sessions.
  if (blocked) {
    await cols.sessions.deleteMany({
      userId: {
        $in: [new ObjectId(id), id],
      },
    });
  }

  return {
    id,
    isBlocked: blocked,
  };
}

// ========
// SERVICES
// ========
export async function getAllServices(query: ServicesQuery) {
  const filter: Filter<ServiceFields> = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.search) {
    filter.serviceName = {
      $regex: escapeRegex(query.search),
      $options: "i",
    };
  }

  const rows = await cols.services
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();

  // Fetch all related vendors in one lookup.
  const vendors = await usersById(rows.map((service) => service.vendorId));

  return rows.map((service) => {
    const vendor = vendors.get(service.vendorId);

    return toService(service, vendor ? toPublicVendor(vendor) : null);
  });
}

// =====================
// UPDATE SERVICE STATUS
// =====================
export async function updateServiceStatus(
  id: string,
  status: UpdateServiceStatusInput["status"],
) {
  const _id = parseId(id, "service");
  const now = new Date();

  const updated = await cols.services.findOneAndUpdate(
    { _id },
    {
      $set: {
        status,
        reviewedAt: now,
        updatedAt: now,
      },
    },
    {
      returnDocument: "after",
    },
  );

  if (!updated) {
    throw new ApiError(404, "This service doesn't exist.", {
      code: "NOT_FOUND",
    });
  }

  return {
    id: String(_id),
    status,
  };
}

// ==============
// DELETE SERVICE
// ==============
export async function deleteService(id: string) {
  const _id = parseId(id, "service");

  const removed = await cols.services.findOneAndDelete({
    _id,
  });

  if (!removed) {
    throw new ApiError(404, "This service doesn't exist.", {
      code: "NOT_FOUND",
    });
  }

  // Cancel pending bookings related to the deleted service.
  // Accepted bookings remain as historical records.
  await cols.bookings.updateMany(
    {
      serviceId: String(_id),
      status: "pending",
    },
    {
      $set: {
        status: "cancelled",
        cancelledAt: new Date(),
      },
    },
  );

  return {
    success: true,
  };
}

// ============
// TRANSACTIONS
// ============
export async function getAllTransactions() {
  const rows = await cols.transactions
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  const vendors = await usersById(
    rows.map((transaction) => transaction.vendorId),
  );

  return rows.map((transaction) =>
    toTransaction(transaction, vendors.get(transaction.vendorId)),
  );
}
