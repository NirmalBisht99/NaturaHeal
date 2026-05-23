import { supabaseAdmin } from "../config/supabase.js";
import { sendOrderStatusSMS, sendAdminNewOrderAlert } from "./notificationService.js";
import { broadcastOrderUpdate, broadcastToAdmins } from "../server.js";

const VALID_STATUSES = [
  "placed", "confirmed", "packed", "in_transit",
  "out_for_delivery", "delivered", "cancelled",
];

// Get all orders with line items (admin)
export async function getAllOrders() {
  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(id, product_name, product_svg_key, unit_price, quantity, image_url)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!orders || orders.length === 0) return [];

  const userIds = [...new Set(orders.map((o) => o.user_id).filter(Boolean))];
  let profileMap = {};

  if (userIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone")
      .in("id", userIds);

    if (profiles) profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));
  }

  return orders.map((o) => {
    const profile = profileMap[o.user_id];
    return {
      ...o,
      items:          o.order_items || [],
      customer_name:  profile?.full_name  || o.shipping_name  || "N/A",
      customer_phone: profile?.phone      || o.shipping_phone || "—",
    };
  });
}

// Get orders for one user
export async function getUserOrders(userId) {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(id, product_name, product_svg_key, unit_price, quantity, image_url)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map((o) => ({ ...o, items: o.order_items || [] }));
}

// Get one order by ID
export async function getOrderById(orderId) {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(id, product_name, product_svg_key, unit_price, quantity, image_url)")
    .eq("id", orderId)
    .single();

  if (error) throw error;
  if (!data) return null;
  return { ...data, items: data.order_items || [] };
}

// Place a new order
export async function placeOrder(payload) {
  const { user_id, items, address, total_amount, payment_method } = payload;

  // Validate stock & decrement atomically
  for (const item of items) {
    const productId = item.product_id || item.id;
    const qty       = item.quantity   || item.qty || 1;

    const { data: product, error: fetchErr } = await supabaseAdmin
      .from("products")
      .select("id, name, stock")
      .eq("id", productId)
      .single();

    if (fetchErr || !product) {
      const err = new Error(`Product not found: ${productId}`);
      err.statusCode = 404;
      throw err;
    }

    if (product.stock < qty) {
      const err = new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}`);
      err.statusCode = 400;
      throw err;
    }

    const { error: stockErr } = await supabaseAdmin
      .from("products")
      .update({ stock: product.stock - qty })
      .eq("id", productId);

    if (stockErr) throw stockErr;
  }

  const orderInsert = {
    user_id,
    total_amount,
    payment_method,
    status:           "placed",
    payment_status:   payment_method === "cod" ? "pending_cod" : "pending",
    shipping_name:    address?.name    || "",
    shipping_phone:   address?.phone   || "",
    shipping_address: address?.address || "",
    shipping_city:    address?.city    || "",
    shipping_state:   address?.state   || "",
    shipping_pincode: address?.pincode || "",
  };

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert(orderInsert)
    .select()
    .single();

  if (orderError) throw orderError;

  const lineItems = items.map((item) => ({
    order_id:        order.id,
    product_id:      item.product_id || item.id,
    product_name:    item.product_name || item.name,
    product_svg_key: item.svg_key || item.product_svg_key || "ashwagandha",
    unit_price:      item.unit_price || item.price,
    quantity:        item.quantity   || item.qty,
    image_url:       item.image_url  || null,
  }));

  const { error: itemsError } = await supabaseAdmin
    .from("order_items")
    .insert(lineItems);

  if (itemsError) throw itemsError;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("phone, full_name")
    .eq("id", user_id)
    .single();

  const customerName  = profile?.full_name || address?.name || "Customer";
  const customerPhone = profile?.phone     || address?.phone || null;

  // Broadcast new order to admins via WebSocket
  broadcastToAdmins({
    type:     "new_order",
    order:    { ...order, items: lineItems },
    customer: customerName,
  });

  // Non-blocking notifications
  sendOrderStatusSMS(customerPhone, customerName, order.id, "placed").catch(
    (e) => console.warn("SMS failed:", e.message)
  );
  sendAdminNewOrderAlert(order.id, customerName, total_amount).catch(
    (e) => console.warn("Admin alert failed:", e.message)
  );

  return order;
}

// Update order status (admin)
export async function updateOrderStatus(orderId, status, adminNote) {
  if (!VALID_STATUSES.includes(status)) {
    const err = new Error("Invalid status: " + status + ". Must be one of: " + VALID_STATUSES.join(", "));
    err.statusCode = 400;
    throw err;
  }

  const updates = { status };
  if (adminNote !== undefined && adminNote !== "") updates.admin_note = adminNote;

  if (status === "cancelled") await restoreStockOnCancel(orderId);

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update(updates)
    .eq("id", orderId)
    .select("*, user_id, shipping_phone, shipping_name")
    .single();

  if (error) throw error;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("phone, full_name")
    .eq("id", data.user_id)
    .single();

  const phone = profile?.phone || data.shipping_phone || null;
  const name  = profile?.full_name || data.shipping_name || "Customer";

  // Broadcast to the customer + all admins via WebSocket
  broadcastOrderUpdate(data.user_id, {
    type:    "order_update",
    orderId,
    status,
    adminNote: adminNote || "",
    order:   data,
  });

  sendOrderStatusSMS(phone, name, orderId, status).catch(
    (e) => console.warn("SMS failed for order " + orderId + ":", e.message)
  );

  return data;
}

// Restore stock when order is cancelled
async function restoreStockOnCancel(orderId) {
  try {
    const { data: order } = await supabaseAdmin
      .from("orders").select("status").eq("id", orderId).single();

    if (order?.status === "cancelled") return;

    const { data: items } = await supabaseAdmin
      .from("order_items").select("product_id, quantity").eq("order_id", orderId);

    if (!items) return;

    for (const item of items) {
      const { data: product } = await supabaseAdmin
        .from("products").select("stock").eq("id", item.product_id).single();

      if (product) {
        await supabaseAdmin
          .from("products")
          .update({ stock: product.stock + item.quantity })
          .eq("id", item.product_id);
      }
    }
    console.log(`✅ Stock restored for cancelled order ${orderId}`);
  } catch (e) {
    console.warn("Stock restore failed for order " + orderId + ":", e.message);
  }
}