import { ObjectId, type Filter } from "mongodb";
import {
  cols,
  userIdFilter,
  type ServiceDoc,
  type UserDoc,
} from "../config/db.js";
import { isObjectId } from "./ids.js";

/**
 * Load several users in one query.
 * Returns a Map keyed by the string representation of _id.
 */
export async function usersById(ids: string[]): Promise<Map<string, UserDoc>> {
  const unique = [...new Set(ids)].filter(Boolean);

  if (!unique.length) return new Map();

  const objectIds = unique.filter(isObjectId);

  const asIds: (ObjectId | string)[] = unique.flatMap((id) =>
    isObjectId(id) ? [new ObjectId(id), id] : [id],
  );

  const filter: Filter<UserDoc> = {
    _id: { $in: asIds },
  };

  const rows = await cols.users.find(filter).toArray();

  return new Map(rows.map((user) => [String(user._id), user]));
}

/**
 * Load several services in one query.
 * Returns a Map keyed by the string representation of _id.
 */
export async function servicesById(
  ids: string[],
): Promise<Map<string, ServiceDoc>> {
  const unique = [...new Set(ids)].filter(isObjectId);

  if (!unique.length) return new Map();

  const objectIds = unique.map((id) => new ObjectId(id));

  const rows = await cols.services.find({ _id: { $in: objectIds } }).toArray();

  return new Map(rows.map((service) => [String(service._id), service]));
}

/**
 * Find one user by ID.
 */
export const findUserById = (id: string) =>
  cols.users.findOne(userIdFilter(id));

/** Load several users in one query. Returns a Map keyed by the id string. */
/* export async function usersById(ids: string[]): Promise<Map<string, UserDoc>> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (!unique.length) return new Map();
  const asIds: (ObjectId | string)[] = unique.flatMap((i) =>
    isObjectId(i) ? [new ObjectId(i), i] : [i],
  );
  const rows = await cols.users
    .find({ _id: { $in: asIds } } as unknown as Parameters<
      typeof cols.users.find
    >[0])
    .toArray();
  return new Map(rows.map((u) => [String(u._id), u]));
} */

/** Load several services in one query. Returns a Map keyed by the id string. */
/* export async function servicesById(
  ids: string[],
): Promise<Map<string, ServiceDoc>> {
  const unique = [...new Set(ids)].filter(isObjectId);
  if (!unique.length) return new Map();
  const rows = await cols.services
    .find({ _id: { $in: unique.map((i) => new ObjectId(i)) } })
    .toArray();
  return new Map(rows.map((s) => [String(s._id), s]));
}

export const findUserById = (id: string) =>
  cols.users.findOne(userIdFilter(id));
 */
