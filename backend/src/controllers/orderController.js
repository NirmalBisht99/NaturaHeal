import {
  getAllOrders, getUserOrders, getOrderById,
  placeOrder, updateOrderStatus,
} from "../services/orderService.js";
import { validateFields } from "../middleware/validate.js";

export async function listOrders(req, res, next) {
  try {
    const orders = await getAllOrders();
    res.json({ success: true, orders });
  } catch (err) { next(err); }
}

export async function listMyOrders(req, res, next) {
  try {
    const orders = await getUserOrders(req.user.id);
    res.json({ success: true, orders });
  } catch (err) { next(err); }
}

export async function getOrder(req, res, next) {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (!req.isAdmin && order.user_id !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json({ success: true, order });
  } catch (err) { next(err); }
}

export async function createOrder(req, res, next) {
  try {
    const { items, address, total_amount, payment_method } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items array is required" });
    }
    if (!address) return res.status(400).json({ error: "address is required" });
    if (!total_amount) return res.status(400).json({ error: "total_amount is required" });
    if (!["cod", "razorpay"].includes(payment_method)) {
      return res.status(400).json({ error: "payment_method must be cod or razorpay" });
    }

    // Validate address fields
    const addressErrors = [];

    if (!address.name || String(address.name).trim() === "") {
      addressErrors.push("address.name is required");
    } else if (/\d/.test(address.name)) {
      addressErrors.push("address.name must not contain numbers");
    } else if (!/^[a-zA-Z\s.\-']+$/.test(String(address.name).trim())) {
      addressErrors.push("address.name must contain only letters");
    }

    if (!address.phone) {
      addressErrors.push("address.phone is required");
    } else {
      const digits = String(address.phone).replace(/[\s\-\+]/g, "");
      if (!/^[6-9]\d{9}$/.test(digits) && !/^91[6-9]\d{9}$/.test(digits)) {
        addressErrors.push("address.phone must be a valid Indian phone number");
      }
    }

    if (!address.pincode) {
      addressErrors.push("address.pincode is required");
    } else if (!/^\d{6}$/.test(String(address.pincode))) {
      addressErrors.push("address.pincode must be 6 digits");
    }

    if (!address.address || String(address.address).trim() === "") {
      addressErrors.push("address.address is required");
    }

    if (!address.city || String(address.city).trim() === "") {
      addressErrors.push("address.city is required");
    } else if (/^\d+$/.test(String(address.city).trim())) {
      addressErrors.push("address.city must not be purely numeric");
    }

    if (addressErrors.length > 0) {
      return res.status(400).json({ error: addressErrors.join("; ") });
    }

    const order = await placeOrder({
      user_id: req.user.id,
      items,
      address,
      total_amount,
      payment_method,
    });

    res.status(201).json({ success: true, order });
  } catch (err) { next(err); }
}

export async function patchOrderStatus(req, res, next) {
  try {
    const { status, adminNote } = req.body;
    if (!status) return res.status(400).json({ error: "status is required" });

    const order = await updateOrderStatus(req.params.id, status, adminNote);
    res.json({ success: true, message: "Order status updated to " + status, order });
  } catch (err) { next(err); }
}