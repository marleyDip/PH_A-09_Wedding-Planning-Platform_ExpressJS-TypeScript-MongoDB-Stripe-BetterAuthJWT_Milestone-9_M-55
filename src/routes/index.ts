import { Router } from "express";
import adminRoutes from "./admin.routes.js";
import bookingsRoutes from "./bookings.routes.js";
import contentRoutes from "./content.routes.js";
import paymentsRoutes from "./payments.routes.js";
import servicesRoutes from "./services.routes.js";
import usersRoutes from "./users.routes.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ name: "WedPlan API", status: "ok" });
});

router.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// GET /categories, /testimonials   (public)
router.use(contentRoutes);

// public reads & vendor management
router.use("/services", servicesRoutes);

// customer & vendor
router.use("/bookings", bookingsRoutes);

// vendor checkout (the webhook is mounted in app.ts)
router.use("/payments", paymentsRoutes);

// GET /users/me
router.use("/users", usersRoutes);

// admin only
router.use("/admin", adminRoutes);

export default router;
