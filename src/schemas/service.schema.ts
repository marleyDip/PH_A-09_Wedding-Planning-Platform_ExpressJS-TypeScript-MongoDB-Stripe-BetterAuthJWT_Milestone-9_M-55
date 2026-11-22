import { z } from "zod";

import { CATEGORY_NAMES, PRICE_TYPES } from "../config/constants.js";

import { blankToUndefined } from "../utils/query.js";

// images
const imageUrl = z
  .string()
  .trim()
  .max(500)
  .pipe(
    z.url({
      protocol: /^https$/,
      error: "Each image must be a valid HTTPS URL.",
    }),
  );

// create / update
const baseFields = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Service name must be at least 3 characters.")
    .max(100)
    .optional(),

  serviceName: z
    .string()
    .trim()
    .min(3, "Service name must be at least 3 characters.")
    .max(100)
    .optional(),

  category: z.enum(CATEGORY_NAMES, {
    error: "Choose a valid category.",
  }),

  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters.")
    .max(2000),

  price: z.coerce
    .number({ error: "Price must be a number." })
    .positive("Price must be greater than 0.")
    .max(100_000_000),

  priceType: z.enum(PRICE_TYPES).default("per event"),

  location: z.string().trim().min(2, "Location is required.").max(80),

  images: z
    .array(imageUrl)
    .min(1, "Add at least one image.")
    .max(4, "You can add up to 4 images."),
});

export const createServiceSchema = baseFields
  .refine((value) => Boolean(value.serviceName ?? value.name), {
    message: "Service name is required.",
    path: ["name"],
  })
  .transform(({ name, serviceName, ...rest }) => ({
    ...rest,
    serviceName: serviceName ?? name ?? "",
  }));

export const updateServiceSchema = baseFields
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Nothing to update.",
  });

// queries
const numberQuery = z.preprocess(
  blankToUndefined,
  z.coerce.number().min(0).optional(),
);

export const serviceListQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),

  category: z.string().trim().max(80).optional(),

  location: z.string().trim().max(80).optional(),

  minPrice: numberQuery,

  maxPrice: numberQuery,

  sort: z
    .enum(["rating", "newest", "price_asc", "price_desc"])
    .default("rating"),

  limit: z.coerce.number().int().min(1).max(500).default(200),

  page: z.coerce.number().int().min(1).default(1),
});

// availability
export const availabilitySchema = z.object({
  isActive: z.boolean(),
});

// types
export type CreateServiceInput = z.output<typeof createServiceSchema>;

export type UpdateServiceInput = z.output<typeof updateServiceSchema>;

export type ServiceListQuery = z.output<typeof serviceListQuerySchema>;
