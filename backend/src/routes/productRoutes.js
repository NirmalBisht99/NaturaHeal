
import { Router }       from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import {
  listProducts, listAllProducts, getProduct,
  addProduct, editProduct, patchStock,
  removeProduct, uploadImage,
} from "../controllers/productController.js";

const router = Router();

// ── Public ──────────────────────────────────────────────────
router.get("/",    listProducts);
router.get("/all", requireAuth, requireAdmin, listAllProducts);  // MUST be before /:id
router.get("/:id", getProduct);

// ── Admin-only ───────────────────────────────────────────────
router.post("/",                requireAuth, requireAdmin, addProduct);
router.put("/:id",              requireAuth, requireAdmin, editProduct);
router.patch("/:id/stock",      requireAuth, requireAdmin, patchStock);
router.delete("/:id",           requireAuth, requireAdmin, removeProduct);

// Image upload — supports both product-specific and temp uploads
// POST /api/products/:id/image   (productId can be "tmp_<timestamp>")
router.post("/:id/image", requireAuth, requireAdmin, upload.single("image"), uploadImage);

// Legacy flat upload endpoint (kept for compatibility)
router.post("/upload-image", requireAuth, requireAdmin, upload.single("image"), (req, res, next) => {
  req.params.id = "tmp_" + Date.now();
  uploadImage(req, res, next);
});

export default router;