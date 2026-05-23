// src/components/layout/Navbar.jsx
import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { DEMO_MODE } from "../../lib/supabase.js";
import { AvatarCircle, NotificationBadge } from "../ui/index.jsx";

export default function Navbar({ cartCount, wishlistCount = 0, page, setPage }) {
  const { user, profile, isAdmin, signOut } = useAuth();
  const [dd,         setDd]       = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const name = profile?.full_name || user?.email?.split("@")[0] || "";

  const navLinks = [
    { id: "home",    label: "Home"    },
    { id: "shop",    label: "Shop"    },
    { id: "about",   label: "About"   },
    { id: "contact", label: "Contact" },
  ];

  const go = (id) => {
    setPage(id);
    setMobileOpen(false);
    setDd(false);
  };

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(255,255,255,0.97)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid #F3F4F6",
      boxShadow: "0 1px 8px rgba(0,0,0,.06)",
    }}>
      {/* Main row */}
      <div style={{
        display: "flex", alignItems: "center",
        padding: "0 clamp(16px, 4vw, 40px)",
        height: 64, gap: 20,
      }}>
        {/* Brand */}
        <div
          onClick={() => go("home")}
          style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flexShrink: 0 }}
        >
          <img
            src="/logo.png"
            alt="NaturaHeal"
            style={{ height: 40, width: 40, objectFit: "contain" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextSibling.style.display = "flex";
            }}
          />
          {/* Fallback emoji logo */}
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "linear-gradient(135deg,#15803D,#166534)",
            display: "none", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(21,128,61,.3)",
          }}>
            <span style={{ fontSize: 18 }}>🌿</span>
          </div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 800, fontSize: 16, color: "#111827", lineHeight: 1 }}>NaturaHeal</div>
            <div style={{ fontSize: 8, color: "#6B7280", letterSpacing: 2, fontWeight: 600, textTransform: "uppercase" }}>HOMEOPATHIC</div>
          </div>
        </div>

        {/* Desktop nav links */}
        <div style={{ display: "flex", gap: 4, flex: 1, justifyContent: "center", "@media(maxWidth:768px)": { display: "none" } }} className="desktop-nav">
          {navLinks.map((link) => (
            <span
              key={link.id}
              onClick={() => go(link.id)}
              style={{
                cursor: "pointer", fontWeight: 500, fontSize: 14,
                color:      page === link.id ? "#15803D" : "#374151",
                padding:    "6px 14px", borderRadius: 8,
                background: page === link.id ? "#F0FDF4" : "transparent",
                transition: "all .2s", userSelect: "none",
              }}
            >
              {link.label}
            </span>
          ))}
          {isAdmin && (
            <span
              onClick={() => go("admin")}
              style={{
                cursor: "pointer", fontWeight: 600, fontSize: 14,
                color:      page === "admin" ? "#7C3AED" : "#6B7280",
                padding:    "6px 14px", borderRadius: 8,
                background: page === "admin" ? "#F5F3FF" : "transparent",
                transition: "all .2s",
              }}
            >
              ⚙ Admin
            </span>
          )}
        </div>

        {/* Right icons */}
        <div style={{ display: "flex", gap: 4, alignItems: "center", marginLeft: "auto" }}>
          {/* Wishlist */}
          <button
            onClick={() => go("wishlist")}
            title="Wishlist"
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, position: "relative", padding: "4px 8px", borderRadius: 8 }}
          >
            🤍
            {wishlistCount > 0 && <NotificationBadge count={wishlistCount} />}
          </button>

          {/* Cart */}
          <button
            onClick={() => go("cart")}
            title="Cart"
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, position: "relative", padding: "4px 8px", borderRadius: 8 }}
          >
            🛒
            {cartCount > 0 && <NotificationBadge count={cartCount} />}
          </button>

          {/* User dropdown / sign-in */}
          {(user || DEMO_MODE) ? (
            <div style={{ position: "relative" }}>
              <div
                onClick={() => setDd(!dd)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  cursor: "pointer", padding: "5px 10px", borderRadius: 20,
                  background: "#F3F4F6", border: "1px solid #E5E7EB",
                }}
              >
                <AvatarCircle name={name} size={26} />
                <span style={{ fontWeight: 600, fontSize: 13, display: "none" }} className="user-name">
                  {(name || "User").split(" ")[0]}
                </span>
                <span style={{ fontSize: 10, color: "#9CA3AF" }}>▾</span>
              </div>

              {dd && (
                <div
                  onMouseLeave={() => setDd(false)}
                  style={{
                    position: "absolute", right: 0, top: "calc(100% + 8px)",
                    background: "#fff", borderRadius: 14,
                    boxShadow: "0 8px 32px rgba(0,0,0,.14)",
                    minWidth: 200, overflow: "hidden", zIndex: 300,
                    border: "1px solid #F3F4F6",
                    animation: "slideDown .2s ease",
                  }}
                >
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6", background: "#F9FAFB" }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>{user?.email || "demo@naturaheal.com"}</div>
                    {isAdmin && (
                      <span style={{ fontSize: 10, background: "#7C3AED", color: "#fff", padding: "2px 8px", borderRadius: 10, fontWeight: 700, display: "inline-block", marginTop: 4 }}>
                        ADMIN
                      </span>
                    )}
                  </div>
                  {[
                    { icon: "📋", label: "My Orders",   action: () => go("orders") },
                    { icon: "🤍", label: "Wishlist",     action: () => go("wishlist") },
                    ...(isAdmin ? [{ icon: "⚙", label: "Admin Panel", action: () => go("admin") }] : []),
                  ].map(({ icon, label, action }) => (
                    <div
                      key={label}
                      onClick={action}
                      style={{ padding: "10px 16px", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      {icon} {label}
                    </div>
                  ))}
                  <div style={{ height: 1, background: "#F3F4F6" }} />
                  <div
                    onClick={async () => { await signOut(); setDd(false); go("home"); }}
                    style={{ padding: "10px 16px", fontSize: 14, cursor: "pointer", color: "#EF4444", display: "flex", alignItems: "center", gap: 8 }}
                  >
                    🚪 Sign Out
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => go("auth")}
              style={{
                background: "linear-gradient(135deg,#15803D,#166534)",
                color: "#fff", border: "none", borderRadius: 8,
                padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer",
                boxShadow: "0 2px 8px rgba(21,128,61,.3)",
              }}
            >
              Sign In
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="mobile-menu-btn"
            style={{
              display: "none",
              background: "none", border: "none", cursor: "pointer",
              fontSize: 22, padding: "4px 6px", color: "#374151",
            }}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          background: "#fff", borderTop: "1px solid #F3F4F6",
          padding: "12px 20px 20px",
        }}>
          {navLinks.map((link) => (
            <div
              key={link.id}
              onClick={() => go(link.id)}
              style={{
                padding: "12px 0", fontWeight: page === link.id ? 700 : 500,
                color: page === link.id ? "#15803D" : "#374151",
                borderBottom: "1px solid #F9FAFB", cursor: "pointer", fontSize: 15,
              }}
            >
              {link.label}
            </div>
          ))}
          {isAdmin && (
            <div
              onClick={() => go("admin")}
              style={{ padding: "12px 0", fontWeight: 600, color: "#7C3AED", cursor: "pointer", fontSize: 15 }}
            >
              ⚙ Admin Panel
            </div>
          )}
          {(user || DEMO_MODE) && (
            <div
              onClick={() => go("orders")}
              style={{ padding: "12px 0", color: "#374151", cursor: "pointer", fontSize: 15, borderBottom: "1px solid #F9FAFB" }}
            >
              📋 My Orders
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .user-name { display: none !important; }
        }
        @media (min-width: 769px) {
          .desktop-nav { display: flex !important; }
          .user-name { display: inline !important; }
        }
      `}</style>
    </nav>
  );
}