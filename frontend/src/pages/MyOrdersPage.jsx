import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase, DEMO_MODE } from "../lib/supabase.js";
import {
  fmtINR, STATUS_COLORS, STATUS_ICONS, STATUS_LABELS,
  TRACKING_STEPS, DEMO_ORDERS, API_BASE,
} from "../lib/constants.js";
import { HerbImg } from "../lib/herbSvgs.jsx";
import { Spinner } from "../components/ui/index.jsx";
import { useWebSocket } from "../hooks/useWebSocket.js";

export function MyOrdersPage() {
  const { user, profile, getToken } = useAuth();
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [error,    setError]    = useState("");
  const [toast,    setToast]    = useState(null);

  // Show a toast when an order status updates in real time
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // Real-time WebSocket handler
  const handleWsMessage = useCallback((msg) => {
    if (msg.type === "order_update") {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === msg.orderId
            ? { ...o, status: msg.status, admin_note: msg.adminNote || o.admin_note }
            : o
        )
      );
      showToast(`Order update: ${STATUS_LABELS[msg.status] || msg.status}`);
    }
  }, []);

  useWebSocket({
    userId:    user?.id || "anonymous",
    role:      profile?.role,
    onMessage: handleWsMessage,
  });

  const loadOrders = useCallback(async () => {
    if (DEMO_MODE) { setOrders(DEMO_ORDERS); setLoading(false); return; }
    if (!user) { setLoading(false); return; }

    setLoading(true);
    setError("");

    try {
      const token = await getToken();

      if (token) {
        const res = await fetch(`${API_BASE}/api/orders/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setOrders((data.orders || []).map((o) => ({ ...o, items: o.order_items || o.items || [] })));
          setLoading(false);
          return;
        }
      }

      // Fallback: direct Supabase
      if (supabase && user?.id) {
        const { data, error: qErr } = await supabase
          .from("orders")
          .select("*, order_items(id, product_name, product_svg_key, unit_price, quantity, image_url)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!qErr && data) {
          setOrders(data.map((o) => ({ ...o, items: o.order_items || [] })));
        } else if (qErr) {
          setError("Could not load orders. " + qErr.message);
        }
      }
    } catch (err) {
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, getToken]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const stepIndex = (status) => TRACKING_STEPS.indexOf(status);

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: "40px 80px", minHeight: "60vh" }}>

      {/* Real-time toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 1000,
          background: "#15803D", color: "#fff", borderRadius: 12,
          padding: "12px 20px", fontSize: 14, fontWeight: 600,
          boxShadow: "0 4px 20px rgba(0,0,0,.2)",
          animation: "slideDown .3s ease",
        }}>
          🔔 {toast}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 800 }}>My Orders</h1>
        <button onClick={loadOrders} style={{ background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 8, padding: "7px 14px", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>↻ Refresh</button>
      </div>
      <p style={{ color: "#6B7280", marginBottom: 28 }}>Track your deliveries in real time</p>

      {error && (
        <div style={{ background: "#FEF2F2", color: "#DC2626", borderRadius: 10, padding: "12px 16px", fontSize: 13, marginBottom: 20, border: "1px solid #FECACA" }}>
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📦</div>
          <h2 style={{ fontWeight: 700 }}>No orders yet</h2>
          <p style={{ color: "#9CA3AF" }}>Your order history will appear here.</p>
        </div>
      )}

      {orders.map((order) => (
        <div key={order.id} style={{ background: "#fff", borderRadius: 16, marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,.06)", overflow: "hidden" }}>
          <div
            style={{ padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", borderBottom: expanded === order.id ? "1px solid #F3F4F6" : "none" }}
            onClick={() => setExpanded(expanded === order.id ? null : order.id)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              {[
                ["ORDER ID", order.id.substring(0, 14) + "…"],
                ["DATE",     new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })],
                ["PAYMENT",  (order.payment_method || "cod").toUpperCase()],
                ["TOTAL",    fmtINR(order.total_amount)],
              ].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, marginBottom: 2 }}>{l}</div>
                  <div style={{ fontWeight: l === "TOTAL" ? 800 : 700, fontSize: l === "TOTAL" ? 15 : 13, color: l === "TOTAL" ? "#15803D" : "#111827" }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_COLORS[order.status] || "#374151", background: (STATUS_COLORS[order.status] || "#374151") + "18", padding: "5px 12px", borderRadius: 20 }}>
                {STATUS_ICONS[order.status]} {STATUS_LABELS[order.status]}
              </span>
              <span style={{ color: "#9CA3AF", transition: "transform .2s", transform: expanded === order.id ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
            </div>
          </div>

          {expanded === order.id && (
            <div style={{ padding: "20px 24px" }}>
              {/* Tracking progress */}
              {order.status !== "cancelled" && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {TRACKING_STEPS.map((s, i) => {
                      const done   = stepIndex(order.status) >= i;
                      const active = order.status === s;
                      return (
                        <div key={s} style={{ display: "flex", alignItems: "center", flex: i < TRACKING_STEPS.length - 1 ? 1 : "none" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{
                              width: 38, height: 38, borderRadius: "50%",
                              background: done ? "#15803D" : "#E5E7EB",
                              color: done ? "#fff" : "#9CA3AF",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 16, fontWeight: 700,
                              boxShadow: active ? "0 0 0 4px rgba(21,128,61,.2)" : "none",
                              transition: "all .3s",
                            }}>
                              {done ? (active ? STATUS_ICONS[s] : "✓") : "○"}
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 600, color: done ? "#15803D" : "#9CA3AF", marginTop: 6, whiteSpace: "nowrap", textAlign: "center" }}>
                              {STATUS_LABELS[s]}
                            </div>
                          </div>
                          {i < TRACKING_STEPS.length - 1 && (
                            <div style={{ flex: 1, height: 3, background: stepIndex(order.status) > i ? "#15803D" : "#E5E7EB", margin: "0 6px", marginBottom: 22, borderRadius: 2, transition: "background .3s" }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Items */}
              <div style={{ display: "grid", gap: 8 }}>
                {(order.items || []).map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 14px", background: "#F9FAFB", borderRadius: 10 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: "1px solid #F3F4F6" }}>
                      <HerbImg svgKey={item.product_svg_key || "ashwagandha"} imageUrl={item.image_url} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{item.product_name}</div>
                      <div style={{ fontSize: 12, color: "#6B7280" }}>Qty: {item.quantity}</div>
                    </div>
                    <div style={{ fontWeight: 800, color: "#15803D" }}>{fmtINR(item.unit_price * item.quantity)}</div>
                  </div>
                ))}
              </div>

              {(order.shipping_name || order.shipping_address) && (
                <div style={{ marginTop: 14, background: "#F9FAFB", borderRadius: 10, padding: "10px 14px", fontSize: 13 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>📍 Delivery address:</div>
                  <div style={{ color: "#4B5563" }}>{order.shipping_name} · {order.shipping_phone}</div>
                  <div style={{ color: "#6B7280" }}>{order.shipping_address}{order.shipping_city ? ", " + order.shipping_city : ""}{order.shipping_state ? ", " + order.shipping_state : ""}{order.shipping_pincode ? " — " + order.shipping_pincode : ""}</div>
                </div>
              )}

              {order.admin_note && (
                <div style={{ marginTop: 14, background: "#EFF6FF", borderRadius: 10, padding: "10px 14px", fontSize: 13, border: "1px solid #BFDBFE" }}>
                  📝 <strong>Update from NaturaHeal:</strong> {order.admin_note}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}