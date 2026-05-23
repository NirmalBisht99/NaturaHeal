// backend/src/routes/orderRoutes.js
import { Router }        from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { listOrders, listMyOrders, getOrder, createOrder, patchOrderStatus } from "../controllers/orderController.js";

const router = Router();
router.use(requireAuth);

// User routes
router.get("/mine", listMyOrders);
router.post("/",    createOrder);
router.get("/:id",  getOrder);

// Admin routes
router.get("/",                        requireAdmin, listOrders);
router.patch("/:id/status",            requireAdmin, patchOrderStatus);

// Legacy notify endpoint (used by some frontend versions)
router.post("/:id/notify", requireAdmin, patchOrderStatus);

export default router;