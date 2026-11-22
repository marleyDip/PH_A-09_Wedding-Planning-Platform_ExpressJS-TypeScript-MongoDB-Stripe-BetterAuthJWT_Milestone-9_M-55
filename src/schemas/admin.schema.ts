import { z } from "zod";

import { SERVICE_STATUSES } from "../config/constants.js";

// =====
// USERS
// =====
export const usersQuerySchema = z.object({
  role: z.enum(["customer", "vendor", "admin"]).optional(),
  search: z.string().trim().max(100).optional(),
});

export const blockUserSchema = z.object({
  blocked: z.boolean(),
});

// ========
// SERVICES
// ========
export const servicesQuerySchema = z.object({
  status: z.enum(SERVICE_STATUSES).optional(),
  category: z.string().trim().max(80).optional(),
  search: z.string().trim().max(100).optional(),
});

export const updateServiceStatusSchema = z.object({
  status: z.enum(SERVICE_STATUSES),
});

// ==============
// INFERRED TYPES
// ==============
export type UsersQuery = z.infer<typeof usersQuerySchema>;
export type BlockUserInput = z.infer<typeof blockUserSchema>;

export type ServicesQuery = z.infer<typeof servicesQuerySchema>;

export type UpdateServiceStatusInput = z.infer<
  typeof updateServiceStatusSchema
>;
