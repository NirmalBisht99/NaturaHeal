import { useState } from "react";
import { useAuth }  from "../../context/AuthContext.jsx";
import { DEMO_MODE } from "../../lib/supabase.js";
import { fmtINR, API_BASE } from "../../lib/constants.js";
import { HerbImg }  from "../../lib/herbSvgs.jsx";
import { rules, buildErrors, isValid } from "../../lib/validation.js";
import ValidatedInput from "../ui/ValidatedInput.jsx";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const EMPTY_ADDR = { name: "", phone: "", address: "", city: "", state: "", pincode: "" };

export default function CheckoutPage({ cart, onSuccess, onBack }) {
  const { user, profile, getToken } = useAuth();
  const [step,    setStep]    = useState(1);
  const [payment, setPayment] = useState("cod");
  const [addr,    setAddr]    = useState({
    ...EMPTY_ADDR,
    name:  profile?.full_name || "",
    phone: profile?.phone     || "",
  });
  const [touched,  setTouched]  = useState({});
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const set = (k, v) => {
    setAddr((p) => ({ ...p, [k]: v }));
    setTouched((p) => ({ ...p, [k]: true }));
  };

  const subtotal   = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery   = subtotal >= 499 ? 0 : 49;
  const grandTotal = subtotal + delivery;

  // Build live error map for all address fields
  const fieldErrors = {
    name:    rules.name(addr.name),
    phone:   rules.phone(addr.phone),
    address: rules.address(addr.address),
    city:    rules.cityOrState(addr.city, "City"),
    state:   rules.cityOrState(addr.state, "State"),
    pincode: rules.pincode(addr.pincode),
  };

  // Only show error after user has touched the field
  const shown = (field) => touched[field] ? fieldErrors[field] : null;

  const validateAndNext = () => {
    // Mark all touched so all errors become visible
    setTouched({ name: true, phone: true, address: true, city: true, state: true, pincode: true });
    if (!isValid(fieldErrors)) {
      setError("Please fix the errors above before continuing.");
      return;
    }
    setError("");
    setStep(2);
  };

  const buildOrderPayload = (paymentStatus = "pending_cod", razorpayPaymentId = null) => ({
    items: cart.map((i) => ({
      product_id:   i.id,
      product_name: i.name,
      svg_key:      i.svg_key || "ashwagandha",
      unit_price:   i.price,
      quantity:     i.qty,
      image_url:    i.image_url || null,
    })),
    address: addr,
    total_amount:   grandTotal,
    payment_method: payment,
    payment_status: paymentStatus,
    ...(razorpayPaymentId ? { razorpay_payment_id: razorpayPaymentId } : {}),
  });

  const saveOrderViaAPI = async (paymentStatus = "pending_cod", razorpayPaymentId = null) => {
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 800));
      const demoOrder = {
        id: "DEMO_" + Date.now(), status: "placed",
        total_amount: grandTotal, created_at: new Date().toISOString(), items: cart,
      };
      onSuccess(demoOrder);
      return demoOrder;
    }

    const token = await getToken();
    if (!token) throw new Error("Not authenticated. Please sign in again.");

    const res = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(buildOrderPayload(paymentStatus, razorpayPaymentId)),
    });

    let data;
    try { data = await res.json(); }
    catch { throw new Error("Server returned an invalid response."); }

    if (!res.ok) throw new Error(data?.error || `Order failed (${res.status}).`);
    return data.order;
  };

  const placeOrderCOD = async () => {
    setError(""); setLoading(true);
    try {
      const order = await saveOrderViaAPI("pending_cod");
      onSuccess(order);
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const placeOrderRazorpay = async () => {
    setError(""); setLoading(true);
    try {
      if (DEMO_MODE) {
        await new Promise((r) => setTimeout(r, 600));
        onSuccess({ id: "DEMO_PAY_" + Date.now(), status: "placed", total_amount: grandTotal, created_at: new Date().toISOString(), items: cart });
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError("Could not load payment gateway. Check your internet connection.");
        return;
      }

      const token = await getToken();
      if (!token) throw new Error("Not authenticated. Please sign in again.");

      const createRes = await fetch(`${API_BASE}/api/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: grandTotal }),
      });

      let rzpData;
      try { rzpData = await createRes.json(); }
      catch { throw new Error("Could not initiate payment."); }

      if (!createRes.ok) throw new Error(rzpData?.error || "Could not initiate payment");

      const { order: rzpOrder, key_id } = rzpData;

      const order = await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key:         key_id || import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount:      rzpOrder.amount,
          currency:    "INR",
          name:        "NaturaHeal",
          description: "Ayurvedic Homeopathic Medicines",
          order_id:    rzpOrder.id,
          prefill:     { name: addr.name, contact: addr.phone, email: user?.email || "" },
          theme:       { color: "#15803D" },
          handler: async (response) => {
            try {
              const verifyRes = await fetch(`${API_BASE}/api/payment/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  razorpay_order_id:   response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature:  response.razorpay_signature,
                  amount: grandTotal,
                }),
              });
              if (!verifyRes.ok) throw new Error("Payment verification failed");
              const placedOrder = await saveOrderViaAPI("paid", response.razorpay_payment_id);
              resolve(placedOrder);
            } catch (err) { reject(err); }
          },
          modal: { ondismiss: () => reject(new Error("Payment was cancelled.")) },
        });
        rzp.on("payment.failed", (r) =>
          reject(new Error(r.error?.description || "Payment failed."))
        );
        rzp.open();
      });

      onSuccess(order);
    } catch (e) {
      if (e.message !== "Payment was cancelled.") {
        setError(e.message || "Payment failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px 60px", display: "grid", gridTemplateColumns: "1fr 360px", gap: 40, minHeight: "60vh" }}>

      {/* Left: steps */}
      <div>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", fontSize: 14, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
          ← Back to Cart
        </button>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          {[["1", "Delivery"], ["2", "Payment"]].map(([n, l], i) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", fontWeight: 700, fontSize: 14,
                background: step >= parseInt(n) ? "#15803D" : "#E5E7EB",
                color:      step >= parseInt(n) ? "#fff" : "#9CA3AF",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{n}</div>
              <span style={{ fontWeight: 600, fontSize: 14, color: step >= parseInt(n) ? "#111827" : "#9CA3AF" }}>{l}</span>
              {i === 0 && <div style={{ width: 40, height: 2, background: step >= 2 ? "#15803D" : "#E5E7EB", marginLeft: 4 }} />}
            </div>
          ))}
        </div>

        {/* Step 1: Address */}
        {step === 1 && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20, fontFamily: "'Playfair Display', Georgia, serif" }}>Delivery Details</h1>
            <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

                <ValidatedInput
                  label="Full Name" required
                  placeholder="Your full name"
                  value={addr.name}
                  error={shown("name")}
                  data-no-numbers="true"
                  onChange={(e) => set("name", e.target.value)}
                  style={{ gridColumn: "1/-1" }}
                />

                <ValidatedInput
                  label="Phone" required type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  value={addr.phone}
                  error={shown("phone")}
                  onChange={(e) => set("phone", e.target.value)}
                  hint="10-digit Indian mobile number"
                />

                <div /> {/* spacer to keep phone on left */}

                <ValidatedInput
                  label="Full Address" required
                  placeholder="House/Flat, Street…"
                  value={addr.address}
                  error={shown("address")}
                  onChange={(e) => set("address", e.target.value)}
                  style={{ gridColumn: "1/-1" }}
                />

                <ValidatedInput
                  label="City" required
                  placeholder="City"
                  value={addr.city}
                  error={shown("city")}
                  data-no-numbers="true"
                  onChange={(e) => set("city", e.target.value)}
                />

                <ValidatedInput
                  label="State"
                  placeholder="State"
                  value={addr.state}
                  error={shown("state")}
                  data-no-numbers="true"
                  onChange={(e) => set("state", e.target.value)}
                />

                <ValidatedInput
                  label="Pincode" required
                  placeholder="6-digit pincode"
                  value={addr.pincode}
                  error={shown("pincode")}
                  maxLength={6}
                  onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))}
                />

              </div>

              {error && (
                <div style={{ background: "#FEF2F2", color: "#DC2626", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginTop: 16 }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={validateAndNext}
                style={{ marginTop: 24, background: "linear-gradient(135deg,#15803D,#166534)", color: "#fff", border: "none", borderRadius: 10, padding: "13px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 14px rgba(21,128,61,.4)" }}>
                Continue to Payment →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20, fontFamily: "'Playfair Display', Georgia, serif" }}>Payment Method</h1>
            <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>

              <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "12px 16px", marginBottom: 24, fontSize: 13 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>📍 Delivering to:</div>
                <div style={{ color: "#4B5563" }}>{addr.name} · {addr.phone}</div>
                <div style={{ color: "#6B7280" }}>{addr.address}, {addr.city}, {addr.state} — {addr.pincode}</div>
                <button onClick={() => { setStep(1); setError(""); }} style={{ background: "none", border: "none", color: "#15803D", fontSize: 12, cursor: "pointer", fontWeight: 600, marginTop: 4, padding: 0 }}>Edit</button>
              </div>

              {[
                { id: "cod",      icon: "💵", label: "Cash on Delivery",       sub: "Pay when your order arrives" },
                { id: "razorpay", icon: "💳", label: "Pay Online (Razorpay)",  sub: "UPI · Cards · Net Banking · Wallets" },
              ].map((opt) => (
                <div key={opt.id} onClick={() => setPayment(opt.id)}
                  style={{
                    border: `2px solid ${payment === opt.id ? "#15803D" : "#E5E7EB"}`,
                    borderRadius: 12, padding: "16px 18px", marginBottom: 12,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
                    background: payment === opt.id ? "#F0FDF4" : "#fff", transition: "all .2s",
                  }}>
                  <span style={{ fontSize: 26 }}>{opt.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>{opt.sub}</div>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${payment === opt.id ? "#15803D" : "#D1D5DB"}`, background: payment === opt.id ? "#15803D" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {payment === opt.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                </div>
              ))}

              {error && (
                <div style={{ background: "#FEF2F2", color: "#DC2626", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={payment === "cod" ? placeOrderCOD : placeOrderRazorpay}
                disabled={loading}
                style={{ width: "100%", background: "linear-gradient(135deg,#15803D,#166534)", color: "#fff", border: "none", borderRadius: 12, padding: 15, fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, boxShadow: "0 4px 14px rgba(21,128,61,.4)", marginTop: 4 }}>
                {loading
                  ? (payment === "cod" ? "Placing Order…" : "Opening Payment…")
                  : payment === "cod"
                    ? `💵 Place Order (COD) — ${fmtINR(grandTotal)}`
                    : `💳 Pay ${fmtINR(grandTotal)} via Razorpay`}
              </button>
              <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "#9CA3AF" }}>
                🛡️ Secured with 256-bit SSL
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: Order summary */}
      <div>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,.08)", position: "sticky", top: 80 }}>
          <h2 style={{ fontWeight: 800, marginBottom: 18, fontFamily: "'Playfair Display', Georgia, serif" }}>Order Summary</h2>
          <div style={{ maxHeight: 280, overflowY: "auto", paddingRight: 4 }}>
            {cart.map((i) => (
              <div key={i.id} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: "1px solid #F3F4F6" }}>
                  <HerbImg svgKey={i.svg_key} imageUrl={i.image_url} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.name}</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>Qty: {i.qty}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#15803D", flexShrink: 0 }}>{fmtINR(i.price * i.qty)}</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #E5E7EB", margin: "16px 0", paddingTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8, color: "#4B5563" }}><span>Subtotal</span><span>{fmtINR(subtotal)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
              <span style={{ color: "#4B5563" }}>Delivery</span>
              <span style={{ color: delivery === 0 ? "#15803D" : "#374151", fontWeight: delivery === 0 ? 700 : 400 }}>{delivery === 0 ? "FREE" : fmtINR(delivery)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 17, marginTop: 12 }}>
              <span>Total</span>
              <span style={{ color: "#15803D" }}>{fmtINR(grandTotal)}</span>
            </div>
          </div>
          {subtotal < 499 && (
            <div style={{ background: "#FEF3C7", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#92400E", textAlign: "center" }}>
              Add {fmtINR(499 - subtotal)} more for FREE delivery!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}