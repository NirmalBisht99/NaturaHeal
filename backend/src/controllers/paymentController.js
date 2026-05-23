
import {
  createRazorpayOrder, verifyPaymentSignature,
  savePaymentRecord, markOrderPaid,
} from "../services/paymentService.js";

// POST /api/payment/create-order
export async function createPaymentOrder(req, res, next) {
  try {
    const { amount, orderId } = req.body;
    if (!amount) return res.status(400).json({ error: "amount is required" });

    const razorpayOrder = await createRazorpayOrder(amount, "INR", orderId || "rcpt_" + Date.now());

    res.json({
      success:           true,
      order:             razorpayOrder,
      razorpay_order_id: razorpayOrder.id,
      amount:            razorpayOrder.amount,
      currency:          razorpayOrder.currency,
      key_id:            process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) { next(err); }
}

// POST /api/payment/verify
export async function verifyPayment(req, res, next) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
      amount,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Razorpay payment details are required" });
    }

    const isValid = verifyPaymentSignature(
      razorpay_order_id, razorpay_payment_id, razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({ error: "Payment signature verification failed" });
    }

    if (orderId) {
      await savePaymentRecord(orderId, razorpay_order_id, razorpay_payment_id, amount);
      await markOrderPaid(orderId, razorpay_payment_id);
    }

    res.json({ success: true, message: "Payment verified and order updated" });
  } catch (err) { next(err); }
}