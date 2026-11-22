import type { RequestHandler } from "express";

import {
  blockUserSchema,
  servicesQuerySchema,
  updateServiceStatusSchema,
  usersQuerySchema,
} from "../schemas/admin.schema.js";

import {
  deleteService,
  getAdminStats,
  getAllServices,
  getAllTransactions,
  getAllUsers,
  updateServiceStatus,
  updateUserBlockStatus,
} from "../services/admin.service.js";

import { getParam } from "../utils/params.js";

/* const getRouteParam = (value: string | string[] | undefined): string => {
  if (typeof value !== "string") {
    throw new Error("Invalid route parameter");
  }

  return value;
}; */

// ========
// OVERVIEW
// ========

// GET /admin/stats
export const getAdminStatsHandler: RequestHandler = async (_req, res) => {
  const stats = await getAdminStats();

  res.json(stats);
};

// =====
// USERS
// =====

// GET /admin/users?role=&search=
export const getAllUsersHandler: RequestHandler = async (req, res) => {
  const query = usersQuerySchema.parse({
    role: req.query["role"] || undefined,
    search: req.query["search"] || undefined,
  });

  const users = await getAllUsers(query);

  res.json(users);
};

// PATCH /admin/users/:id/block
export const updateUserBlockStatusHandler: RequestHandler = async (
  req,
  res,
) => {
  const { blocked } = blockUserSchema.parse(req.body);

  const result = await updateUserBlockStatus(
    // req.params["id"]!,
    // getRouteParam(req.params["id"])

    getParam(req, "id"),
    blocked,
    req.user!.id,
  );

  res.json(result);
};

// ========
// SERVICES
// ========

// GET /admin/services?status=&category=&search=
export const getAllServicesHandler: RequestHandler = async (req, res) => {
  const query = servicesQuerySchema.parse({
    status: req.query["status"] || undefined,
    category: req.query["category"] || undefined,
    search: req.query["search"] || undefined,
  });

  const services = await getAllServices(query);

  res.json(services);
};

// PATCH /admin/services/:id/status
export const updateServiceStatusHandler: RequestHandler = async (req, res) => {
  const { status } = updateServiceStatusSchema.parse(req.body);

  const result = await updateServiceStatus(
    // req.params["id"]!,
    // getRouteParam(req.params["id"]),

    getParam(req, "id"),
    status,
  );

  res.json(result);
};

// DELETE /admin/services/:id
export const deleteServiceHandler: RequestHandler = async (req, res) => {
  // const result = await deleteService(req.params["id"]!);
  // const result = await deleteService(getRouteParam(req.params["id"]));

  const result = await deleteService(getParam(req, "id"));

  res.json(result);
};

// ============
// TRANSACTIONS
// ============

// GET /admin/transactions
export const getAllTransactionsHandler: RequestHandler = async (_req, res) => {
  const transactions = await getAllTransactions();

  res.json(transactions);
};
