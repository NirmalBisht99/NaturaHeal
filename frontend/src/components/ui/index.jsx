// src/components/ui/index.jsx
export const INPUT_STYLE = {
  width: "100%", padding: "11px 14px",
  border: "1px solid #E5E7EB", borderRadius: 8,
  fontSize: 14, outline: "none",
  boxSizing: "border-box", fontFamily: "inherit",
  background: "#fff", transition: "border-color .2s",
};

export const QTY_BTN = {
  width: 32, height: 32, background: "#F3F4F6",
  border: "1px solid #E5E7EB", borderRadius: 8,
  cursor: "pointer", fontSize: 16, fontWeight: 700,
  display: "flex", alignItems: "center", justifyContent: "center",
  flexShrink: 0,
};

export function Spinner({ size = 36 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{
        width: size, height: size,
        border: "3px solid #E5E7EB", borderTopColor: "#15803D",
        borderRadius: "50%", animation: "spin 0.7s linear infinite",
      }} />
    </div>
  );
}

export function Stars({ rating, size = 14 }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[...Array(5)].map((_, i) => (
        <span key={i} style={{
          fontSize: size,
          color: i < full ? "#F59E0B" : (i === full && half) ? "#F59E0B" : "#D1D5DB",
          opacity: i === full && half ? 0.6 : 1,
        }}>★</span>
      ))}
    </span>
  );
}

export function AvatarCircle({ name = "?", size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg,#15803D,#166534)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
    }}>
      {(name || "?")[0].toUpperCase()}
    </div>
  );
}

export function NotificationBadge({ count }) {
  if (!count) return null;
  return (
    <span style={{
      position: "absolute", top: -6, right: -6,
      background: "#EF4444", color: "#fff",
      borderRadius: "50%", minWidth: 18, height: 18,
      fontSize: 10, fontWeight: 700,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 3px",
    }}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function StockPill({ stock }) {
  const color = stock === 0 ? "#EF4444" : stock < 10 ? "#F59E0B" : "#15803D";
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, color,
      background: color + "18", padding: "2px 8px", borderRadius: 20,
    }}>
      {stock === 0 ? "Out of Stock" : stock < 10 ? `Low (${stock})` : "In Stock"}
    </span>
  );
}

export function DemoBanner({ demoMode }) {
  if (!demoMode) return null;
  return (
    <div style={{
      background: "#FEF3C7", borderBottom: "2px solid #F59E0B",
      padding: "10px 20px", textAlign: "center", fontSize: 13,
    }}>
      ⚠️ <strong>Demo Mode</strong> — No Supabase credentials found.{" "}
      Admin: <code>admin@naturaheal.com</code> · User: <code>user@naturaheal.com</code> — any password.
    </div>
  );
}

export function GreenButton({ onClick, disabled, loading, children, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled || loading}
      style={{
        background: "linear-gradient(135deg,#15803D,#166534)",
        color: "#fff", border: "none", borderRadius: 12,
        padding: "14px 24px", fontWeight: 700, fontSize: 15,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        boxShadow: "0 4px 14px rgba(21,128,61,.4)",
        opacity: disabled || loading ? 0.7 : 1,
        fontFamily: "inherit", transition: "opacity .2s",
        ...style,
      }}>
      {loading ? "Please wait…" : children}
    </button>
  );
}

export function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div style={{
      background: "#FEF2F2", color: "#DC2626",
      borderRadius: 10, padding: "10px 14px",
      fontSize: 13, marginBottom: 16,
      display: "flex", alignItems: "center", gap: 8,
      border: "1px solid #FECACA",
    }}>
      ⚠️ {message}
    </div>
  );
}

export function SectionTitle({ title, subtitle }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 36 }}>
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 34, fontWeight: 800, color: "#111827", margin: "0 0 10px" }}>{title}</h2>
      {subtitle && <p style={{ color: "#6B7280", fontSize: 15 }}>{subtitle}</p>}
    </div>
  );
}

export function Modal({ show, onClose, children, width = 580 }) {
  if (!show) return null;
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: 20, padding: 32, width, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}