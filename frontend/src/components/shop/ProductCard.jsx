// ─────────────────────────────────────────────────────────────
//  components/shop/ProductCard.jsx
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { HerbImg } from "../../lib/herbSvgs.jsx";
import { Stars } from "../ui/index.jsx";
import { fmtINR } from "../../lib/constants.js";

export default function ProductCard({ product, onAdd, wishlist = [], onWishlist }) {
  const p      = product;
  const wished = wishlist.includes(p.id);
  const oos    = p.stock === 0;
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    if (oos) return;
    onAdd(p);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div
      style={{
        background: "#fff", borderRadius: 18, overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,.07)",
        transition: "box-shadow .25s, transform .25s",
        display: "flex", flexDirection: "column",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,.13)";
        e.currentTarget.style.transform = "translateY(-5px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.07)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* ── Image area ── */}
      <div style={{ position: "relative", height: 200, overflow: "hidden", background: "#1a3a1a", flexShrink: 0 }}>
        <div style={{ width: "100%", height: "100%", filter: oos ? "grayscale(60%)" : "none", transition: "transform .3s" }}>
          <HerbImg svgKey={p.svg_key || p.svgKey} imageUrl={p.image_url || null} />
        </div>

        {p.badge && (
          <span style={{
            position: "absolute", top: 12, left: 12,
            background: p.badge_color || p.badgeColor || "#888",
            color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700,
            boxShadow: "0 2px 6px rgba(0,0,0,.2)",
          }}>
            {p.badge}
          </span>
        )}

        {oos && (
          <div style={{
            position: "absolute", inset: 0, background: "rgba(0,0,0,.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ background: "#EF4444", color: "#fff", fontWeight: 700, fontSize: 13, padding: "6px 16px", borderRadius: 20 }}>
              Out of Stock
            </span>
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onWishlist?.(p.id); }}
          style={{
            position: "absolute", top: 12, right: 12,
            background: "rgba(255,255,255,.92)", border: "none", borderRadius: "50%",
            width: 34, height: 34, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, boxShadow: "0 2px 6px rgba(0,0,0,.15)",
            transition: "transform .2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {wished ? "❤️" : "🤍"}
        </button>
      </div>

      {/* ── Info area ── */}
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#15803D", letterSpacing: 1, marginBottom: 4 }}>
          {p.category}
        </div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 6, lineHeight: 1.3 }}>
          {p.name}
        </div>
        <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 10, lineHeight: 1.5, flex: 1 }}>
          {(p.description || "").substring(0, 80)}{p.description?.length > 80 ? "…" : ""}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <Stars rating={p.rating || 4.5} />
          <span style={{ fontSize: 11, color: "#6B7280" }}>
            {p.rating} ({(p.review_count || 0).toLocaleString()})
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontWeight: 900, fontSize: 18, color: "#15803D" }}>
              {fmtINR(p.price)}
            </span>
            {p.original_price && (
              <span style={{ fontSize: 12, color: "#9CA3AF", textDecoration: "line-through", marginLeft: 6 }}>
                {fmtINR(p.original_price)}
              </span>
            )}
          </div>
          <button
            disabled={oos}
            onClick={handleAdd}
            style={{
              background: oos ? "#E5E7EB" : added ? "#166534" : "linear-gradient(135deg,#15803D,#166534)",
              color: oos ? "#9CA3AF" : "#fff",
              border: "none", borderRadius: 8, padding: "8px 14px",
              fontSize: 13, fontWeight: 600,
              cursor: oos ? "not-allowed" : "pointer",
              boxShadow: oos ? "none" : "0 2px 8px rgba(21,128,61,.35)",
              transition: "all .25s",
              minWidth: 80,
            }}
          >
            {added ? "✓ Added" : "🛒 Add"}
          </button>
        </div>
      </div>
    </div>
  );
}