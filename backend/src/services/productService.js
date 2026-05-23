// backend/src/services/productService.js
import { supabaseAdmin } from "../config/supabase.js";
import cloudinary from "../config/cloudinary.js";
import { broadcastProductUpdate } from "../server.js";

export async function getActiveProducts() {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    const err = new Error("Failed to fetch products: " + error.message);
    err.statusCode = 502;
    throw err;
  }
  return data || [];
}

export async function getAllProducts() {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getProductById(id) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createProduct(payload) {
  const sanitized = sanitize(payload);
  const { data, error } = await supabaseAdmin
    .from("products")
    .insert(sanitized)
    .select()
    .single();

  if (error) throw error;
  broadcastProductUpdate({ type: "product_added", product: data });
  return data;
}

export async function updateProduct(id, payload) {
  const sanitized = sanitize(payload);
  const { data, error } = await supabaseAdmin
    .from("products")
    .update(sanitized)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  broadcastProductUpdate({ type: "product_updated", product: data });
  return data;
}

export async function updateStock(id, stock) {
  if (typeof stock !== "number" || stock < 0) {
    const err = new Error("stock must be a non-negative integer");
    err.statusCode = 400;
    throw err;
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .update({ stock })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  broadcastProductUpdate({ type: "stock_updated", productId: id, stock });
  return data;
}

export async function deleteProduct(id) {
  const { error } = await supabaseAdmin
    .from("products")
    .update({ is_active: false })
    .eq("id", id);

  if (error) throw error;
  broadcastProductUpdate({ type: "product_removed", productId: id });
}

export async function uploadProductImage(productId, fileBuffer, mimeType) {
  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error("Cloudinary not configured. Check .env");
  }

  const base64  = fileBuffer.toString("base64");
  const dataUri = `data:${mimeType};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder:    "naturaheal/products",
    public_id: `product_${productId}`,
    overwrite: true,
  });

  if (!productId.startsWith("tmp_")) {
    const { error } = await supabaseAdmin
      .from("products")
      .update({ image_url: result.secure_url })
      .eq("id", productId);

    if (error) console.warn("Could not update product image_url:", error.message);
  }

  return result.secure_url;
}

export async function deleteProductImage(productId) {
  try {
    await cloudinary.uploader.destroy(`naturaheal/products/product_${productId}`);
  } catch {
    // Non-critical — image may not exist
  }
}

function sanitize(p) {
  const c = {};
  if (p.name           !== undefined) c.name           = String(p.name);
  if (p.category       !== undefined) c.category       = String(p.category);
  if (p.description    !== undefined) c.description    = p.description || null;
  if (p.price          !== undefined) c.price          = parseFloat(p.price);
  if (p.original_price !== undefined) c.original_price = p.original_price ? parseFloat(p.original_price) : null;
  if (p.stock          !== undefined) c.stock          = parseInt(p.stock, 10);
  if (p.badge          !== undefined) c.badge          = p.badge || null;
  if (p.badge_color    !== undefined) c.badge_color    = p.badge_color || null;
  if (p.rating         !== undefined) c.rating         = parseFloat(p.rating) || 4.5;
  if (p.review_count   !== undefined) c.review_count   = parseInt(p.review_count, 10) || 0;
  if (p.svg_key        !== undefined) c.svg_key        = String(p.svg_key);
  if (p.image_url      !== undefined) c.image_url      = p.image_url || null;
  if (p.is_active      !== undefined) c.is_active      = Boolean(p.is_active);
  return c;
}