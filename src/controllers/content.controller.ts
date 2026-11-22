import type { RequestHandler } from "express";
import { CATEGORIES, TESTIMONIALS } from "../config/content.js";

/** GET /categories — Public */
export const getCategories: RequestHandler = (_req, res) => {
  res.json(CATEGORIES);
};

/** GET /testimonials — Public */
export const getTestimonials: RequestHandler = (_req, res) => {
  const approvedTestimonials = TESTIMONIALS.filter(
    (testimonial) => testimonial.status === "approved",
  );

  res.json(approvedTestimonials);
};
