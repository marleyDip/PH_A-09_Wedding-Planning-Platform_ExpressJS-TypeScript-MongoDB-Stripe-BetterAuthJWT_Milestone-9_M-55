import { Router, type RequestHandler } from "express";
import { CATEGORIES, TESTIMONIALS } from "../config/content.js";

const router = Router();

/** GET /categories — Public */
const getCategories: RequestHandler = (_req, res) => {
  res.json(CATEGORIES);
};

/** GET /testimonials — Public */
const getTestimonials: RequestHandler = (_req, res) => {
  const approvedTestimonials = TESTIMONIALS.filter(
    (testimonial) => testimonial.status === "approved",
  );

  res.json(approvedTestimonials);
};

router.get("/categories", getCategories);
router.get("/testimonials", getTestimonials);

export default router;
