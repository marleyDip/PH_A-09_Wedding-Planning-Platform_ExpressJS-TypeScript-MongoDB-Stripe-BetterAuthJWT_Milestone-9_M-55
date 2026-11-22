import { Router } from "express";
import {
  getCategories,
  getTestimonials,
} from "../controllers/content.controller.js";

const router = Router();

router.get("/categories", getCategories);
router.get("/testimonials", getTestimonials);

export default router;
