// backend/src/controllers/productController.js
import {
  getActiveProducts, getAllProducts, getProductById,
  createProduct, updateProduct, updateStock,
  deleteProduct, uploadProductImage, deleteProductImage,
} from "../services/productService.js";

export async function listProducts(req, res, next) {
  try {
    const products = await getActiveProducts();
    res.json({ success: true, products });
  } catch (err) {
    // Surface a clear error message — don't swallow it as generic 500
    const status = err.statusCode || 500;
    const msg    = err.message || "Failed to load products";
    console.error("[listProducts]", msg);
    res.status(status).json({ success: false, error: msg, products: [] });
  }
}

export async function listAllProducts(req, res, next) {
  try {
    const products = await getAllProducts();
    res.json({ success: true, products });
  } catch (err) { next(err); }
}

export async function getProduct(req, res, next) {
  try {
    const product = await getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ success: true, product });
  } catch (err) { next(err); }
}

export async function addProduct(req, res, next) {
  try {
    const { name, category, price, stock } = req.body;
    if (!name || !category || price === undefined || stock === undefined) {
      return res.status(400).json({ error: "name, category, price, and stock are required" });
    }
    const product = await createProduct(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) { next(err); }
}

export async function editProduct(req, res, next) {
  try {
    const product = await updateProduct(req.params.id, req.body);
    res.json({ success: true, product });
  } catch (err) { next(err); }
}

export async function patchStock(req, res, next) {
  try {
    const stock = parseInt(req.body.stock, 10);
    if (isNaN(stock) || stock < 0) {
      return res.status(400).json({ error: "stock must be a non-negative integer" });
    }
    const product = await updateStock(req.params.id, stock);
    res.json({ success: true, product });
  } catch (err) { next(err); }
}

export async function removeProduct(req, res, next) {
  try {
    await deleteProductImage(req.params.id);
    await deleteProduct(req.params.id);
    res.json({ success: true, message: "Product deactivated" });
  } catch (err) { next(err); }
}

export async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required (field name: image)" });
    }
    const productId = req.params.id || "tmp_" + Date.now();
    const imageUrl  = await uploadProductImage(productId, req.file.buffer, req.file.mimetype);
    res.json({ success: true, url: imageUrl, image_url: imageUrl });
  } catch (err) { next(err); }
}