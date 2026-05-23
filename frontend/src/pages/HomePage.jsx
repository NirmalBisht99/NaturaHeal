// src/pages/HomePage.jsx
import { useState } from "react";
import { CATEGORIES, fmtINR } from "../lib/constants.js";
import { SectionTitle } from "../components/ui/index.jsx";
import ProductCard from "../components/shop/ProductCard.jsx";

export function HomePage({ products, onAdd, wishlist, onWishlist, setPage }) {
  const [email,      setEmail]      = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <div>
      {/* ── Hero ── */}
      <section
        className="hero-section"
        style={{
          background: "linear-gradient(135deg,#F0FDF4 0%,#DCFCE7 50%,#BBF7D0 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "clamp(24px, 5vw, 70px)",
          padding: "clamp(40px,8vw,80px) clamp(20px,5vw,80px)",
          minHeight: 520,
        }}
      >
        {/* Left: text */}
        <div style={{ flex: "1 1 0", maxWidth: 540, minWidth: 0 }}>
          <div className="fade-up" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#fff", borderRadius: 24, padding: "7px 16px", marginBottom: 26, border: "1px solid #86EFAC", boxShadow: "0 2px 8px rgba(21,128,61,.1)" }}>
            <span style={{ fontSize: 15 }}>✦</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#15803D" }}>100% Natural & Safe</span>
          </div>
          <h1 className="fade-up" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, lineHeight: 1.12, margin: "0 0 20px", color: "#111827", animationDelay: ".05s" }}>
            Heal Naturally with{" "}
            <span style={{ color: "#15803D" }}>Homeopathic</span>{" "}
            Medicine
          </h1>
          <p className="fade-up" style={{ color: "#4B5563", fontSize: 16, lineHeight: 1.7, marginBottom: 32, animationDelay: ".1s" }}>
            Discover our curated collection of premium homeopathic remedies. Trusted by thousands for natural healing, backed by centuries of tradition.
          </p>
          <div className="fade-up hero-btns" style={{ display: "flex", gap: 14, marginBottom: 40, flexWrap: "wrap", animationDelay: ".15s" }}>
            <button
              onClick={() => setPage("shop")}
              style={{ background: "linear-gradient(135deg,#15803D,#166534)", color: "#fff", border: "none", borderRadius: 10, padding: "14px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 16px rgba(21,128,61,.4)", display: "flex", alignItems: "center", gap: 8 }}
            >
              Shop Now ›
            </button>
            <button
              onClick={() => setPage("about")}
              style={{ background: "transparent", color: "#15803D", border: "2px solid #15803D", borderRadius: 10, padding: "14px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
            >
              Learn More
            </button>
          </div>
          <div className="fade-up hero-stats" style={{ display: "flex", gap: 40, flexWrap: "wrap", animationDelay: ".2s" }}>
            {[["500+", "Products"], ["50K+", "Happy Customers"], ["15+", "Years Experience"]].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 900, color: "#111827" }}>{v}</div>
                <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: image — hidden on mobile via CSS */}
        <div
          className="fade-in hero-image-wrap"
          style={{ flex: "1 1 0", maxWidth: 520, minWidth: 0, position: "relative" }}
        >
          <div style={{ borderRadius: 24, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,.18)", height: 420 }}>
            <img
              src="https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&auto=format&fit=crop&q=80"
              alt="Homeopathic medicines"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div style={{ position: "absolute", top: 20, right: -16, background: "#fff", borderRadius: 14, padding: "10px 16px", boxShadow: "0 4px 20px rgba(0,0,0,.12)", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20, background: "#FEF3C7", borderRadius: 8, padding: 6 }}>🏆</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Award Winning</div>
              <div style={{ fontSize: 11, color: "#6B7280" }}>Best 2024</div>
            </div>
          </div>
          <div style={{ position: "absolute", bottom: 20, left: -16, background: "#fff", borderRadius: 14, padding: "10px 16px", boxShadow: "0 4px 20px rgba(0,0,0,.12)", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20, background: "#DCFCE7", borderRadius: 8, padding: 6 }}>🛡️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>GMP Certified</div>
              <div style={{ fontSize: 11, color: "#6B7280" }}>Quality assured</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section style={{ background: "#fff", borderBottom: "1px solid #F3F4F6" }}>
        <div className="trust-bar">
          {[
            ["🚚", "Free Shipping",  "On orders over ₹499"],
            ["🛡️", "100% Authentic", "Verified & certified"],
            ["🌿", "All Natural",     "No synthetic additives"],
            ["⭐", "Expert Curated",  "By certified homeopaths"],
          ].map(([icon, title, sub]) => (
            <div key={title} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
              <div style={{ width: 42, height: 42, background: "#DCFCE7", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{title}</div>
                <div style={{ fontSize: 11, color: "#6B7280" }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Shop by Concern ── */}
      <section style={{ background: "#F9FAFB", padding: "clamp(32px,6vw,64px) clamp(20px,5vw,80px)" }}>
        <SectionTitle title="Shop by Concern" subtitle="Find the right remedy for your specific needs" />
        <div className="grid-6 stagger">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              className="fade-up"
              onClick={() => setPage("shop")}
              style={{ background: cat.bg, borderRadius: 16, padding: "28px 12px 20px", textAlign: "center", cursor: "pointer", transition: "transform .2s, box-shadow .2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>{cat.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 12, color: "#111827" }}>{cat.name}</div>
              <div style={{ fontSize: 18, color: cat.color, marginTop: 6 }}>›</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Remedies ── */}
      <section style={{ background: "#fff", padding: "clamp(32px,6vw,64px) clamp(20px,5vw,80px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(22px,3vw,32px)", fontWeight: 800, margin: 0 }}>Featured Remedies</h2>
            <p style={{ color: "#6B7280", fontSize: 14, margin: "8px 0 0" }}>Our most popular homeopathic products</p>
          </div>
          <span onClick={() => setPage("shop")} style={{ color: "#15803D", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
            View All ›
          </span>
        </div>

        {products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#9CA3AF" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
            <div style={{ fontWeight: 600 }}>Products loading…</div>
          </div>
        ) : (
          <div className="grid-4">
            {products.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} onAdd={onAdd} wishlist={wishlist} onWishlist={onWishlist} />
            ))}
          </div>
        )}
      </section>

      {/* ── Testimonials ── */}
      <section style={{ background: "#F9FAFB", padding: "clamp(32px,6vw,64px) clamp(20px,5vw,80px)" }}>
        <SectionTitle title="What Our Customers Say" subtitle="Thousands of happy and healthy customers worldwide" />
        <div className="grid-3">
          {[
            { name: "Priya S.",  text: "NaturaHeal has completely transformed my approach to health. The Ashwagandha Rasayana worked wonders for my stress!", stars: 5 },
            { name: "Rajesh K.", text: "Amazing quality products. The Tulsi Immunity Drops were a lifesaver during the winter months.", stars: 5 },
            { name: "Anita M.",  text: "I've been using the Giloy Fever Guard for a month and my immunity has never been stronger.", stars: 5 },
          ].map((t) => (
            <div key={t.name} style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
              <div style={{ display: "flex", gap: 2, marginBottom: 14 }}>
                {[...Array(t.stars)].map((_, i) => <span key={i} style={{ color: "#F59E0B", fontSize: 18 }}>★</span>)}
              </div>
              <p style={{ color: "#374151", fontSize: 14, lineHeight: 1.7, marginBottom: 16, fontStyle: "italic" }}>"{t.text}"</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#15803D,#166534)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>{t.name[0]}</div>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section style={{ background: "linear-gradient(135deg,#15803D,#166534)", padding: "clamp(32px,6vw,64px) clamp(20px,5vw,80px)", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#fff", fontSize: "clamp(22px,3vw,32px)", fontWeight: 800, margin: "0 0 10px" }}>Stay Updated with Natural Health Tips</h2>
        <p style={{ color: "#BBF7D0", fontSize: 15, marginBottom: 32 }}>Subscribe for expert homeopathic advice, exclusive offers, and wellness articles.</p>
        {subscribed ? (
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>✅ Subscribed successfully!</div>
        ) : (
          <div style={{ display: "flex", maxWidth: 480, margin: "0 auto", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,.2)" }}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={{ flex: 1, padding: "14px 20px", border: "none", outline: "none", fontSize: 14, fontFamily: "inherit", background: "rgba(255,255,255,.15)", color: "#fff", minWidth: 0 }}
            />
            <button
              onClick={() => email && setSubscribed(true)}
              style={{ background: "#fff", color: "#15803D", border: "none", padding: "14px 24px", fontWeight: 700, cursor: "pointer", fontSize: 14, flexShrink: 0 }}
            >
              Subscribe
            </button>
          </div>
        )}
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#111827", padding: "clamp(32px,5vw,52px) clamp(20px,5vw,80px) 28px" }}>
        <div className="footer-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <img src="/logo.png" alt="NaturaHeal" style={{ height: 36, width: 36, objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#fff", fontWeight: 800, fontSize: 16 }}>NaturaHeal</span>
            </div>
            <p style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.7 }}>Your trusted source for premium homeopathic medicines and natural remedies.</p>
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, marginBottom: 16, fontSize: 13 }}>Quick Links</div>
            {["Home", "Shop", "About", "Contact"].map((l) => (
              <div key={l} onClick={() => setPage(l.toLowerCase())} style={{ marginBottom: 10, fontSize: 13, color: "#9CA3AF", cursor: "pointer" }}>{l}</div>
            ))}
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, marginBottom: 16, fontSize: 13 }}>Categories</div>
            {CATEGORIES.map((c) => (
              <div key={c.name} style={{ marginBottom: 10, fontSize: 13, color: "#9CA3AF" }}>{c.name}</div>
            ))}
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, marginBottom: 16, fontSize: 13 }}>Support</div>
            {["FAQ", "Shipping Policy", "Return Policy", "Privacy Policy"].map((l) => (
              <div key={l} style={{ marginBottom: 10, fontSize: 13, color: "#9CA3AF", cursor: "pointer" }}>{l}</div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: "1px solid #1F2937", paddingTop: 22, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 12, color: "#6B7280" }}>© 2026 NaturaHeal. All rights reserved.</div>
          <div style={{ fontSize: 11, color: "#6B7280" }}>⚠️ Not intended to diagnose, treat, cure, or prevent any disease.</div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 860px) {
          .hero-image-wrap { display: none !important; }
        }
      `}</style>
    </div>
  );
}