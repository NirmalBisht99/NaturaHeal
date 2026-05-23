
import twilioClient from "../config/twilio.js";

const FROM_NUMBER       = process.env.TWILIO_PHONE_NUMBER;
const NOTIFICATION_PHONE = process.env.NOTIFICATION_PHONE || "+917579189494";

const STATUS_MESSAGES = {
  placed:           "Your NaturaHeal order #{id} has been placed! ✅ We'll confirm it soon.",
  confirmed:        "Great news! Your NaturaHeal order #{id} is confirmed and being prepared. 📦",
  packed:           "Your NaturaHeal order #{id} is packed and ready to ship. 📫",
  in_transit:       "Your NaturaHeal order #{id} is on its way! 🚚 Track via My Orders.",
  out_for_delivery: "Your NaturaHeal order #{id} is out for delivery today! 🛵 Be available.",
  delivered:        "Your NaturaHeal order #{id} has been delivered! 🎉 Thanks for shopping with us.",
  cancelled:        "Your NaturaHeal order #{id} has been cancelled. ❌ Contact us for queries.",
};

/**
 * Send an SMS about order status change.
 * Sends to: customer phone + admin notification number.
 */
export async function sendOrderStatusSMS(phone, customerName, orderId, status) {
  if (!FROM_NUMBER) {
    console.warn("TWILIO_PHONE_NUMBER not set — skipping SMS");
    return;
  }

  const template = STATUS_MESSAGES[status];
  if (!template) {
    console.warn("No SMS template for status: " + status);
    return;
  }

  const shortId = orderId.toString().slice(0, 8).toUpperCase();
  const msg     = "Hi " + customerName + "! " + template.replace("{id}", shortId);
  const adminMsg = "[NaturaHeal Admin] Order " + shortId + " → Status: " + status.toUpperCase() + " | Customer: " + customerName;

  const sends = [];

  // Send to customer if phone provided
  if (phone) {
    sends.push(
      twilioClient.messages.create({ body: msg, from: FROM_NUMBER, to: phone })
        .then(() => console.log("✅ SMS sent to customer: " + phone))
        .catch((err) => console.warn("⚠️  SMS to customer failed: " + err.message))
    );
  }

  // Always send to admin notification number
  sends.push(
    twilioClient.messages.create({ body: adminMsg, from: FROM_NUMBER, to: NOTIFICATION_PHONE })
      .then(() => console.log("✅ SMS sent to admin: " + NOTIFICATION_PHONE))
      .catch((err) => console.warn("⚠️  SMS to admin failed: " + err.message))
  );

  await Promise.allSettled(sends);
}

/**
 * Send OTP via Twilio Verify service (for phone login).
 */
export async function sendOTP(phone) {
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!serviceSid) throw new Error("TWILIO_VERIFY_SERVICE_SID not set");

  const verification = await twilioClient.verify.v2
    .services(serviceSid)
    .verifications.create({ to: phone, channel: "sms" });

  return verification.status;
}

/**
 * Verify OTP entered by user.
 */
export async function verifyOTP(phone, code) {
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!serviceSid) throw new Error("TWILIO_VERIFY_SERVICE_SID not set");

  const check = await twilioClient.verify.v2
    .services(serviceSid)
    .verificationChecks.create({ to: phone, code: code });

  return check.status === "approved";
}

/**
 * Send a generic SMS to a specific number (order placed confirmation for admin).
 */
export async function sendAdminNewOrderAlert(orderId, customerName, amount) {
  if (!FROM_NUMBER) return;

  const body = "[NaturaHeal] 🛒 New order received!\nOrder: " +
    orderId.toString().slice(0, 8).toUpperCase() +
    "\nCustomer: " + customerName +
    "\nAmount: ₹" + amount;

  await twilioClient.messages.create({
    body,
    from: FROM_NUMBER,
    to:   NOTIFICATION_PHONE,
  }).catch((err) => console.warn("Admin alert SMS failed: " + err.message));
}