
import crypto      from "crypto";
import razorpay    from "../config/razorpay.js";
import { supabaseAdmin } from "../config/supabase.js";

export async function createRazorpayOrder(amount, currency, receipt) {
  const order = await razorpay.orders.create({
    amount:   Math.round(parseFloat(amount) * 100), // paise
    currency: currency || "INR",
    receipt:  receipt  || "rcpt_" + Date.now(),
  });
  return order;
}

export function verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const body      = razorpayOrderId + "|" + razorpayPaymentId;

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  return expected === razorpaySignature;
}

export async function savePaymentRecord(orderId, razorpayOrderId, razorpayPaymentId, amount) {
  // Try to insert payment record (table may not exist yet — non-critical)
  try {
    await supabaseAdmin.from("payments").insert({
      order_id:            orderId,
      razorpay_order_id:   razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      amount,
      status: "paid",
    });
  } catch (e) {
    console.warn("payments table insert failed:", e.message);
  }
}

export async function markOrderPaid(orderId, razorpayPaymentId) {
  const { error } = await supabaseAdmin
    .from("orders")
    .update({ payment_status: "paid", razorpay_payment_id: razorpayPaymentId })
    .eq("id", orderId);
  if (error) throw error;
}