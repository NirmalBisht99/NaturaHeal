
import { Router }         from "express";
import { verifyAdminJWT } from "../middleware/adminGuard.js";
import { adminLogin, getDashboard, listUsers } from "../controllers/adminController.js";
import { listOrders, patchOrderStatus }  from "../controllers/orderController.js";
import { listAllProducts } from "../controllers/productController.js";

const router = Router();

// POST /api/admin/login
router.post("/login", adminLogin);

// All below require admin JWT
router.use(verifyAdminJWT);

router.get("/dashboard", getDashboard);
router.get("/users",     listUsers);
router.get("/orders",    listOrders);
router.get("/products",  listAllProducts);

// Allow admin to update order status via admin route too
router.patch("/orders/:id/status", patchOrderStatus);

export default router;