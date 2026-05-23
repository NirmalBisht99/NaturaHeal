// src/pages/StaticPages.jsx
// ─────────────────────────────────────────────────────────────
//  Contains: CartPage, OrderSuccess, AboutPage, ContactPage
//  WishlistPage lives in WishlistPage.jsx
//  MyOrdersPage lives in MyOrdersPage.jsx
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { useAuth }   from "../context/AuthContext.jsx";
import { DEMO_MODE } from "../lib/supabase.js";
import { fmtINR, STATUS_COLORS, STATUS_ICONS, CATEGORIES } from "../lib/constants.js";
import { HerbImg }   from "../lib/herbSvgs.jsx";
import { QTY_BTN }   from "../components/ui/index.jsx";

// ── CartPage ──────────────────────────────────────────────────
export function CartPage({ cart, onRemove, onQty, onCheckout }) {
  const { user } = useAuth();
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = subtotal >= 499 ? 0 : 49;

  if (!cart.length) {
    return (
      <div style={{ padding: "80px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}>
          Your cart is empty
        </h2>
        <p style={{ color: "#9CA3AF", marginTop: 8 }}>
          Add some homeopathic medicines to get started!
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "clamp(20px,5vw,40px) clamp(16px,5vw,80px)" }}>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(20px,3vw,26px)", fontWeight: 800, marginBottom: 22 }}>
        Shopping Cart
      </h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr min(340px, 100%)", gap: 32, alignItems: "start" }}>
        {/* Items list */}
        <div>
          {cart.map((item) => (
            <div key={item.id} style={{ display: "flex", gap: 14, alignItems: "center", background: "#fff", borderRadius: 14, padding: 16, marginBottom: 10, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
              <div style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", flexShrink: 0, border: "1px solid #F3F4F6" }}>
                <HerbImg svgKey={item.svg_key || "ashwagandha"} imageUrl={item.image_url} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#15803D", marginBottom: 2 }}>{item.category}</div>
                <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                <div style={{ color: "#15803D", fontWeight: 800, fontSize: 15 }}>{fmtINR(item.price)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <button onClick={() => onQty(item.id, -1)} style={{ ...QTY_BTN, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}>{item.qty}</span>
                <button onClick={() => onQty(item.id,  1)} style={{ ...QTY_BTN, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
              </div>
              <button onClick={() => onRemove(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", fontSize: 18, flexShrink: 0 }}>✕</button>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,.08)", position: "sticky", top: 80 }}>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 800, marginBottom: 20 }}>
            Order Summary
          </h2>
          {cart.map((i) => (
            <div key={i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8, color: "#4B5563" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 8 }}>
                {i.name} ×{i.qty}
              </span>
              <span style={{ flexShrink: 0 }}>{fmtINR(i.price * i.qty)}</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid #E5E7EB", margin: "16px 0", paddingTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8, color: "#4B5563" }}>
              <span>Subtotal</span><span>{fmtINR(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
              <span style={{ color: "#4B5563" }}>Delivery</span>
              <span style={{ color: delivery === 0 ? "#15803D" : "#374151", fontWeight: delivery === 0 ? 700 : 400 }}>
                {delivery === 0 ? "FREE" : fmtINR(delivery)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 17, marginTop: 12 }}>
              <span>Total</span>
              <span style={{ color: "#15803D" }}>{fmtINR(subtotal + delivery)}</span>
            </div>
          </div>
          {subtotal < 499 && (
            <div style={{ background: "#FEF3C7", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#92400E", textAlign: "center", marginBottom: 14 }}>
              Add {fmtINR(499 - subtotal)} more for FREE delivery!
            </div>
          )}
          <button
            onClick={onCheckout}
            style={{ width: "100%", background: "linear-gradient(135deg,#15803D,#166534)", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 14px rgba(21,128,61,.4)" }}
          >
            {user || DEMO_MODE ? "Proceed to Checkout →" : "Sign In to Checkout →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── OrderSuccess ──────────────────────────────────────────────
export function OrderSuccess({ order, onContinue, onViewOrders }) {
  return (
    <div style={{ padding: "clamp(40px,8vw,80px) clamp(20px,5vw,40px)", textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900, fontSize: "clamp(24px,3vw,30px)", marginBottom: 10 }}>
        Order Placed!
      </h1>
      <p style={{ color: "#6B7280", fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
        Thank you! Your medicines will be delivered soon. You'll receive SMS updates at each step.
      </p>
      <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 16, padding: 22, marginBottom: 28 }}>
        <div style={{ fontSize: 12, color: "#15803D", fontWeight: 700, marginBottom: 6 }}>ORDER ID</div>
        <div style={{ fontWeight: 800, fontSize: 15, wordBreak: "break-all", color: "#111827" }}>{order?.id}</div>
        <div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 18 }}>{STATUS_ICONS.placed}</span>
          <span style={{ fontWeight: 700, color: STATUS_COLORS.placed }}>Order Placed</span>
        </div>
        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 8 }}>
          📱 SMS sent to your registered number
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={onViewOrders} style={{ background: "#15803D", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 700, cursor: "pointer" }}>
          Track My Order
        </button>
        <button onClick={onContinue} style={{ background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 700, cursor: "pointer" }}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
}

// ── AboutPage ─────────────────────────────────────────────────
export function AboutPage() {
  return (
    <div>
      <div style={{ background: "linear-gradient(135deg,#0d2b0d,#1a4a1a)", padding: "clamp(40px,8vw,80px) clamp(20px,5vw,80px) 60px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 14 }}>🌿</div>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, color: "#fff", margin: "0 0 14px" }}>
          About NaturaHeal
        </h1>
        <p style={{ color: "#86EFAC", fontSize: 16, maxWidth: 600, margin: "0 auto", lineHeight: 1.7 }}>
          Bridging 5000 years of Ayurvedic wisdom with modern homeopathic science.
        </p>
      </div>

      <div style={{ padding: "clamp(30px,5vw,60px) clamp(20px,5vw,80px)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(22px,3vw,30px)", fontWeight: 800, marginBottom: 16 }}>
            Our Story
          </h2>
          <p style={{ color: "#4B5563", lineHeight: 1.9, marginBottom: 14 }}>
            Founded with a deep conviction that nature holds the key to healing, NaturaHeal offers a curated selection of premium homeopathic medicines. Every product is carefully sourced from sustainable farms and prepared to the highest standards.
          </p>
          <p style={{ color: "#4B5563", lineHeight: 1.9 }}>
            Each remedy carries GMP certification and is tested to Pharmacopoeia standards. We are committed to transparency, quality, and your well-being.
          </p>
        </div>
        <div style={{ borderRadius: 20, overflow: "hidden", height: 320 }}>
          <img
            src="https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=600&auto=format&fit=crop&q=80"
            alt="Natural herbs"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      </div>

      <div style={{ background: "#F9FAFB", padding: "44px clamp(20px,5vw,80px)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 22, textAlign: "center" }}>
        {[["500+", "Products"], ["50K+", "Customers"], ["15+", "Years"], ["GMP", "Certified"]].map(([v, l]) => (
          <div key={l} style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 900, color: "#15803D" }}>{v}</div>
            <div style={{ color: "#6B7280", fontWeight: 600, fontSize: 14, marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 700px) {
          .about-story-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ── ContactPage ───────────────────────────────────────────────
export function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);

  return (
    <div style={{ padding: "clamp(30px,5vw,60px) clamp(20px,5vw,80px)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "start" }}>
      {/* Contact info */}
      <div>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(26px,3vw,38px)", fontWeight: 900, marginBottom: 14 }}>
          Get in Touch
        </h1>
        <p style={{ color: "#6B7280", marginBottom: 32, lineHeight: 1.7 }}>
          Questions about our homeopathic medicines? Our team is here to help.
        </p>
        {[
          ["📧", "Email",    "namaste@naturaheal.in"],
          ["📞", "Phone",    "+91 7579189494"],
          ["💬", "WhatsApp", "+91 7579189494"],
          ["⏰", "Hours",    "Mon–Sat 9AM–7PM IST"],
        ].map(([icon, label, val]) => (
          <div key={label} style={{ display: "flex", gap: 14, marginBottom: 22 }}>
            <div style={{ width: 44, height: 44, background: "#DCFCE7", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
              {icon}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>
              <div style={{ color: "#6B7280", fontSize: 13, marginTop: 2 }}>{val}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Contact form */}
      <div style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 4px 16px rgba(0,0,0,.08)" }}>
        {sent ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>✅</div>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}>
              Message Sent!
            </h3>
            <p style={{ color: "#6B7280", marginTop: 8 }}>We'll get back to you within 24 hours.</p>
          </div>
        ) : (
          <>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 800, marginBottom: 22 }}>
              Send a Message
            </h2>
            {[
              ["Name",  "name",  "Your name",          "text"],
              ["Email", "email", "your@email.com",      "email"],
              ["Phone", "phone", "+91 XXXXX XXXXX",     "tel"],
            ].map(([l, k, ph, t]) => (
              <div key={k} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>{l}</label>
                <input
                  type={t}
                  placeholder={ph}
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  style={{ width: "100%", padding: "11px 14px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>
            ))}
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Message</label>
              <textarea
                placeholder="How can we help?"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={4}
                style={{ width: "100%", padding: "11px 14px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" }}
              />
            </div>
            <button
              onClick={() => { if (form.name && form.email) setSent(true); }}
              style={{ width: "100%", background: "linear-gradient(135deg,#15803D,#166534)", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 12px rgba(21,128,61,.35)" }}
            >
              Send Message
            </button>
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 700px) {
          .contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}