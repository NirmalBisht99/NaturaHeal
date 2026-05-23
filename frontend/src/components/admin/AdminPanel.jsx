// Key changes:
//  - WebSocket: new orders appear instantly without refresh
//  - Validated name/city fields in product add/edit modal
//  - Admin WS connection uses role=admin

import { useCallback, useEffect, useState } from "react";
import { supabase, DEMO_MODE } from "../../lib/supabase.js";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  BADGE_COLORS, CAT_LIST, ADMIN_SIDEBAR, EMPTY_PRODUCT_FORM,
  fmtINR, STATUS_LABELS, STATUS_COLORS, STATUS_ICONS, ORDER_STATUSES,
  DEMO_ORDERS, API_BASE,
} from "../../lib/constants.js";
import { HerbImg, HERB_SVGS } from "../../lib/herbSvgs.jsx";
import { Spinner, StockPill, INPUT_STYLE } from "../ui/index.jsx";
import { useWebSocket } from "../../hooks/useWebSocket.js";
import ValidatedInput from "../ui/ValidatedInput.jsx";
import { rules } from "../../lib/validation.js";

function InventoryRow({ product: p, idx, onUpdate }) {
  const [val,   setVal]   = useState(String(p.stock));
  const [saved, setSaved] = useState(false);
  const [busy,  setBusy]  = useState(false);

  const doSave = async () => {
    const newStock = Math.max(0, parseInt(val) || 0);
    setBusy(true);
    await onUpdate(p.id, newStock);
    setSaved(true);
    setBusy(false);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <tr style={{ borderTop: idx > 0 ? "1px solid #F3F4F6" : "none" }}>
      <td style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
            <HerbImg svgKey={p.svg_key || "ashwagandha"} imageUrl={p.image_url} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</span>
        </div>
      </td>
      <td style={{ padding: "14px 16px", fontSize: 13, color: "#6B7280" }}>{p.category}</td>
      <td style={{ padding: "14px 16px", fontWeight: 800, fontSize: 18, color: p.stock === 0 ? "#EF4444" : p.stock < 10 ? "#F59E0B" : "#111827" }}>{p.stock}</td>
      <td style={{ padding: "14px 16px" }}><StockPill stock={p.stock} /></td>
      <td style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="number" min={0} value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSave()}
            style={{ width: 80, padding: "8px 10px", border: "1px solid #E5E7EB", borderRadius: 7, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
          <button onClick={doSave} disabled={busy}
            style={{ background: saved ? "#15803D" : "#111827", color: "#fff", border: "none", borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background .3s", minWidth: 80, opacity: busy ? 0.7 : 1 }}>
            {busy ? "…" : saved ? "✓ Saved" : "Update"}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function AdminPanel({ products, setProducts }) {
  const { user, getToken } = useAuth();
  const [tab,           setTab]           = useState("orders");
  const [orders,        setOrders]        = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [showModal,     setShowModal]     = useState(false);
  const [editId,        setEditId]        = useState(null);
  const [form,          setForm]          = useState(EMPTY_PRODUCT_FORM);
  const [formErrors,    setFormErrors]    = useState({});
  const [statusBusy,    setStatusBusy]    = useState({});
  const [search,        setSearch]        = useState("");
  const [imgFile,       setImgFile]       = useState(null);
  const [imgUploading,  setImgUploading]  = useState(false);
  const [adminNote,     setAdminNote]     = useState({});
  const [notification,  setNotification]  = useState(null);
  const [users,         setUsers]         = useState([]);

  const showNotif = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Real-time: receive new orders and product updates via WebSocket
  const handleWsMessage = useCallback((msg) => {
    if (msg.type === "new_order") {
      setOrders((prev) => [msg.order, ...prev]);
      showNotif(`🛒 New order from ${msg.customer}!`);
    } else if (msg.type === "order_update") {
      setOrders((prev) =>
        prev.map((o) => o.id === msg.orderId ? { ...o, status: msg.status } : o)
      );
    } else if (msg.type === "product_updated") {
      setProducts((prev) => prev.map((p) => p.id === msg.product.id ? msg.product : p));
    } else if (msg.type === "stock_updated") {
      setProducts((prev) =>
        prev.map((p) => p.id === msg.productId ? { ...p, stock: msg.stock } : p)
      );
    }
  }, [setProducts]);

  useWebSocket({ userId: user?.id || "admin", role: "admin", onMessage: handleWsMessage });

  const loadOrders = async () => {
    setLoadingOrders(true);
    if (DEMO_MODE) { setOrders(DEMO_ORDERS); setLoadingOrders(false); return; }

    try {
      const token = await getToken();
      const res   = await fetch(`${API_BASE}/api/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setOrders((data.orders || []).map((o) => ({
          ...o,
          items: o.order_items || o.items || [],
        })));
      } else {
        const errData = await res.json().catch(() => ({}));
        showNotif(errData.error || "Failed to load orders", "error");

        if (supabase) {
          const { data, error } = await supabase
            .from("orders")
            .select("*, order_items(id, product_name, product_svg_key, unit_price, quantity, image_url)")
            .order("created_at", { ascending: false });

          if (!error && data) {
            setOrders(data.map((o) => ({
              ...o,
              items:          o.order_items || [],
              customer_name:  o.shipping_name  || "N/A",
              customer_phone: o.shipping_phone || "—",
            })));
          }
        }
      }
    } catch (err) {
      showNotif("Failed to load orders: " + err.message, "error");
    }
    setLoadingOrders(false);
  };

  const loadUsers = async () => {
    if (DEMO_MODE) return;
    try {
      const token = await getToken();
      const res   = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {}
  };

  useEffect(() => {
    if (tab === "orders")   loadOrders();
    if (tab === "overview") { loadOrders(); loadUsers(); }
  }, [tab]);

  const updateStatus = async (orderId, newStatus) => {
    setStatusBusy((p) => ({ ...p, [orderId]: true }));
    try {
      if (!DEMO_MODE) {
        const token = await getToken();
        const res   = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body:    JSON.stringify({ status: newStatus, adminNote: adminNote[orderId] || "" }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          showNotif(err.error || "Status update failed", "error");
          return;
        }
      }
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
      showNotif(`Order → ${STATUS_LABELS[newStatus]} ✅`);
      setAdminNote((p) => ({ ...p, [orderId]: "" }));
    } catch (err) {
      showNotif("Network error — " + err.message, "error");
    } finally {
      setStatusBusy((p) => ({ ...p, [orderId]: false }));
    }
  };

  // Product modal helpers
  const openEdit = (p) => {
    setForm({
      name: p.name, category: p.category, price: p.price,
      original_price: p.original_price || "", stock: p.stock,
      badge: p.badge || "", description: p.description || "",
      svg_key: p.svg_key || "ashwagandha", rating: p.rating,
      review_count: p.review_count || 0, image_url: p.image_url || "",
    });
    setFormErrors({});
    setEditId(p.id); setImgFile(null); setShowModal(true);
  };

  const openAdd = () => {
    setForm(EMPTY_PRODUCT_FORM);
    setFormErrors({});
    setEditId(null); setImgFile(null); setShowModal(true);
  };

  // Validate product form
  const validateProductForm = () => {
    const errs = {
      name:  rules.name(form.name, "Medicine name"),
      price: rules.positiveNumber(form.price, "Price"),
      stock: rules.nonNegativeInt(form.stock, "Stock"),
    };
    setFormErrors(errs);
    return Object.values(errs).every((e) => !e);
  };

  const uploadImage = async (productId) => {
    if (!imgFile) return form.image_url || null;
    setImgUploading(true);
    try {
      const fd    = new FormData();
      fd.append("image", imgFile);
      const pid   = productId || `tmp_${Date.now()}`;
      const token = await getToken();
      const res   = await fetch(`${API_BASE}/api/products/${pid}/image`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
        body:    fd,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showNotif("Image upload failed: " + (errData.error || "Server error"), "error");
        return form.image_url || null;
      }
      const data = await res.json();
      return data.url || data.image_url || null;
    } catch (err) {
      return form.image_url || null;
    } finally {
      setImgUploading(false);
    }
  };

  const handleSave = async () => {
    if (!validateProductForm()) {
      showNotif("Please fix the form errors.", "error");
      return;
    }

    const badge    = form.badge || null;
    let   imageUrl = form.image_url || null;

    if (DEMO_MODE) {
      const payload = buildPayload(badge, imageUrl);
      if (editId) setProducts((p) => p.map((pr) => pr.id === editId ? { ...pr, ...payload } : pr));
      else        setProducts((p) => [...p, { ...payload, id: "LOCAL_" + Date.now() }]);
      setShowModal(false);
      showNotif(editId ? "Product updated!" : "Product added!");
      return;
    }

    const token = await getToken();

    if (editId) {
      if (imgFile) imageUrl = await uploadImage(editId);
      const payload = buildPayload(badge, imageUrl);
      const res  = await fetch(`${API_BASE}/api/products/${editId}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.product) {
        setProducts((p) => p.map((pr) => pr.id === editId ? data.product : pr));
        showNotif("Product updated!");
      } else {
        showNotif(data.error || "Failed to update product", "error");
        return;
      }
    } else {
      const payload = buildPayload(badge, null);
      const res  = await fetch(`${API_BASE}/api/products`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.product) {
        showNotif(data.error || "Failed to create product", "error");
        return;
      }
      const newProduct = data.product;

      if (imgFile) {
        imageUrl = await uploadImage(newProduct.id);
        if (imageUrl) {
          const imgRes = await fetch(`${API_BASE}/api/products/${newProduct.id}`, {
            method:  "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body:    JSON.stringify({ image_url: imageUrl }),
          });
          const imgData = await imgRes.json();
          setProducts((p) => [...p, imgData.product || { ...newProduct, image_url: imageUrl }]);
        } else {
          setProducts((p) => [...p, newProduct]);
        }
      } else {
        setProducts((p) => [...p, newProduct]);
      }
      showNotif("Product added!");
    }
    setShowModal(false);
  };

  const buildPayload = (badge, imageUrl) => ({
    name:           form.name,
    category:       form.category,
    price:          parseFloat(form.price),
    original_price: form.original_price ? parseFloat(form.original_price) : null,
    stock:          parseInt(form.stock, 10),
    badge,
    badge_color:    BADGE_COLORS[badge] || null,
    description:    form.description,
    svg_key:        form.svg_key,
    rating:         parseFloat(form.rating) || 4.5,
    review_count:   parseInt(form.review_count, 10) || 0,
    image_url:      imageUrl,
    is_active:      true,
  });

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    if (!DEMO_MODE) {
      const token = await getToken();
      await fetch(`${API_BASE}/api/products/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    }
    setProducts((p) => p.filter((pr) => pr.id !== id));
    showNotif("Product removed.");
  };

  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const totalVal   = products.reduce((s, p) => s + p.price * p.stock, 0);
  const totalRev   = orders.reduce((s, o) => o.status !== "cancelled" ? s + (o.total_amount || 0) : s, 0);

  const setFormField = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    // Clear error on edit
    if (formErrors[k]) setFormErrors((p) => ({ ...p, [k]: null }));
  };

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 64px)" }}>

      {/* Notification toast */}
      {notification && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 1000,
          background: notification.type === "error" ? "#EF4444" : "#15803D",
          color: "#fff", borderRadius: 12, padding: "12px 20px",
          fontSize: 14, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,.2)",
        }}>
          {notification.msg}
        </div>
      )}

      {/* Sidebar */}
      <div style={{ width: 220, background: "#0F172A", flexShrink: 0 }}>
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #1E293B" }}>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 12, letterSpacing: 1 }}>ADMIN PANEL</div>
          <div style={{ color: "#64748B", fontSize: 11, marginTop: 2 }}>NaturaHeal</div>
        </div>
        {ADMIN_SIDEBAR.map((item) => (
          <div key={item.id} onClick={() => setTab(item.id)}
            style={{
              padding: "12px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
              background: tab === item.id ? "#1E293B" : "transparent",
              borderLeft: `3px solid ${tab === item.id ? "#15803D" : "transparent"}`,
              marginTop: 2, transition: "background .2s",
            }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span style={{ color: tab === item.id ? "#fff" : "#94A3B8", fontWeight: tab === item.id ? 700 : 400, fontSize: 14 }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, background: "#F8FAFC", padding: 32, overflowY: "auto" }}>

        {/* ── ORDERS ── */}
        {tab === "orders" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>Orders Management</h1>
                <p style={{ color: "#6B7280", margin: "4px 0 0", fontSize: 14 }}>Real-time updates · SMS sent on every status change</p>
              </div>
              <button onClick={loadOrders} style={{ background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>↻ Refresh</button>
            </div>

            {loadingOrders ? <Spinner /> : (
              <div>
                {orders.length === 0 && (
                  <div style={{ textAlign: "center", padding: 60, color: "#9CA3AF" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                    <div style={{ fontWeight: 600 }}>No orders yet</div>
                  </div>
                )}
                {orders.map((order) => (
                  <div key={order.id} style={{ background: "#fff", borderRadius: 16, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,.06)", overflow: "hidden" }}>
                    <div style={{ padding: "16px 24px", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                        {[
                          ["ORDER",    order.id.substring(0, 12) + "…"],
                          ["CUSTOMER", order.customer_name || order.shipping_name || "N/A"],
                          ["PHONE",    order.customer_phone || order.shipping_phone || "—"],
                          ["CITY",     order.shipping_city || "—"],
                          ["PAYMENT",  (order.payment_method || "cod").toUpperCase()],
                          ["AMOUNT",   fmtINR(order.total_amount)],
                          ["DATE",     new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })],
                        ].map(([l, v]) => (
                          <div key={l}>
                            <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700 }}>{l}</div>
                            <div style={{ fontWeight: l === "AMOUNT" ? 800 : 600, color: l === "AMOUNT" ? "#15803D" : "#111827", fontSize: 13 }}>{v}</div>
                          </div>
                        ))}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_COLORS[order.status], background: STATUS_COLORS[order.status] + "18", padding: "4px 12px", borderRadius: 20 }}>
                        {STATUS_ICONS[order.status]} {STATUS_LABELS[order.status]}
                      </span>
                    </div>

                    {order.shipping_address && (
                      <div style={{ padding: "8px 24px", background: "#FAFAFA", fontSize: 12, color: "#6B7280", borderBottom: "1px solid #F3F4F6" }}>
                        📍 {order.shipping_address}{order.shipping_city ? ", " + order.shipping_city : ""}{order.shipping_state ? ", " + order.shipping_state : ""}
                      </div>
                    )}

                    <div style={{ padding: "10px 24px", display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {(order.items || []).map((item, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: "#F9FAFB", borderRadius: 8, padding: "6px 10px", fontSize: 12 }}>
                          <div style={{ width: 24, height: 24, borderRadius: 4, overflow: "hidden" }}>
                            <HerbImg svgKey={item.product_svg_key || "ashwagandha"} imageUrl={item.image_url} />
                          </div>
                          <span>{item.product_name}</span>
                          <span style={{ color: "#9CA3AF" }}>×{item.quantity}</span>
                          <span style={{ color: "#15803D", fontWeight: 700 }}>{fmtINR(item.unit_price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ padding: "10px 24px 16px", borderTop: "1px solid #F3F4F6" }}>
                      <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
                        <input
                          placeholder="Optional note to customer (sent with SMS)…"
                          value={adminNote[order.id] || ""}
                          onChange={(e) => setAdminNote((p) => ({ ...p, [order.id]: e.target.value }))}
                          style={{ flex: 1, padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit" }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginRight: 4 }}>Update status:</span>
                        {ORDER_STATUSES.filter((s) => s !== "cancelled").map((s) => (
                          <button key={s} onClick={() => updateStatus(order.id, s)}
                            disabled={order.status === s || statusBusy[order.id]}
                            style={{
                              background: order.status === s ? STATUS_COLORS[s] : "#F3F4F6",
                              color: order.status === s ? "#fff" : "#374151",
                              border: `2px solid ${order.status === s ? STATUS_COLORS[s] : "transparent"}`,
                              borderRadius: 8, padding: "7px 12px", fontWeight: 600, fontSize: 11,
                              cursor: order.status === s || statusBusy[order.id] ? "default" : "pointer",
                              opacity: statusBusy[order.id] ? 0.6 : 1,
                            }}>
                            {STATUS_ICONS[s]} {STATUS_LABELS[s]}
                          </button>
                        ))}
                        <button onClick={() => updateStatus(order.id, "cancelled")}
                          disabled={order.status === "cancelled" || statusBusy[order.id]}
                          style={{ background: order.status === "cancelled" ? "#EF4444" : "#FEF2F2", color: order.status === "cancelled" ? "#fff" : "#EF4444", border: "none", borderRadius: 8, padding: "7px 12px", fontWeight: 600, fontSize: 11, cursor: "pointer", opacity: statusBusy[order.id] ? 0.6 : 1 }}>
                          ❌ Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {tab === "products" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>Products</h1>
                <p style={{ color: "#6B7280", margin: "4px 0 0", fontSize: 14 }}>{products.length} medicines listed</p>
              </div>
              <button onClick={openAdd} style={{ background: "linear-gradient(135deg,#15803D,#166534)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>+ Add Medicine</button>
            </div>

            <div style={{ background: "#fff", borderRadius: 12, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, border: "1px solid #E5E7EB" }}>
              <span style={{ color: "#9CA3AF" }}>🔍</span>
              <input placeholder="Search medicines…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ border: "none", outline: "none", fontSize: 14, flex: 1, fontFamily: "inherit" }} />
            </div>

            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,.06)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC" }}>
                    {["Image", "Product", "Category", "Price", "Stock", "Status", "Actions"].map((h) => (
                      <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products
                    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()))
                    .map((p, i) => (
                      <tr key={p.id} style={{ borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ width: 52, height: 52, borderRadius: 10, overflow: "hidden", border: "1px solid #F3F4F6" }}>
                            <HerbImg svgKey={p.svg_key || "ashwagandha"} imageUrl={p.image_url} />
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                          {p.badge && <span style={{ fontSize: 10, background: (p.badge_color || "#888") + "22", color: p.badge_color || "#888", padding: "1px 8px", borderRadius: 10, fontWeight: 700 }}>{p.badge}</span>}
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 13, color: "#374151" }}>{p.category}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontWeight: 800, color: "#15803D" }}>{fmtINR(p.price)}</span>
                          {p.original_price && <div style={{ fontSize: 11, color: "#9CA3AF", textDecoration: "line-through" }}>{fmtINR(p.original_price)}</div>}
                        </td>
                        <td style={{ padding: "12px 14px", fontWeight: 800, fontSize: 16, color: p.stock === 0 ? "#EF4444" : p.stock < 10 ? "#F59E0B" : "#111827" }}>{p.stock}</td>
                        <td style={{ padding: "12px 14px" }}><StockPill stock={p.stock} /></td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => openEdit(p)} style={{ background: "#EFF6FF", color: "#2563EB", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✏ Edit</button>
                            <button onClick={() => handleDelete(p.id)} style={{ background: "#FEF2F2", color: "#EF4444", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── INVENTORY ── */}
        {tab === "inventory" && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px", fontFamily: "'Playfair Display', Georgia, serif" }}>Inventory</h1>
            <p style={{ color: "#6B7280", marginBottom: 24, fontSize: 14 }}>Update stock levels — decreases automatically on orders</p>
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,.06)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC" }}>
                    {["Product", "Category", "Current Stock", "Status", "Update"].map((h) => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <InventoryRow key={p.id} product={p} idx={i}
                      onUpdate={async (id, val) => {
                        if (!DEMO_MODE) {
                          const token = await getToken();
                          await fetch(`${API_BASE}/api/products/${id}/stock`, {
                            method:  "PATCH",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                            body:    JSON.stringify({ stock: val }),
                          });
                        }
                        setProducts((prev) => prev.map((pr) => pr.id === id ? { ...pr, stock: val } : pr));
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px", fontFamily: "'Playfair Display', Georgia, serif" }}>Store Overview</h1>
            <p style={{ color: "#6B7280", marginBottom: 24, fontSize: 14 }}>NaturaHeal — at a glance</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 24 }}>
              {[
                { icon: "🌿", label: "Total Products", value: products.length,                                            color: "#15803D", bg: "#DCFCE7" },
                { icon: "📦", label: "Total Units",    value: totalStock,                                                 color: "#2563EB", bg: "#DBEAFE" },
                { icon: "⚠️", label: "Low Stock",      value: products.filter((p) => p.stock > 0 && p.stock < 10).length, color: "#D97706", bg: "#FEF3C7" },
                { icon: "❌", label: "Out of Stock",   value: products.filter((p) => p.stock === 0).length,               color: "#DC2626", bg: "#FEE2E2" },
              ].map((c) => (
                <div key={c.label} style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
                  <div style={{ width: 44, height: 44, background: c.bg, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 12 }}>{c.icon}</div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: c.color }}>{c.value}</div>
                  <div style={{ color: "#6B7280", fontSize: 13 }}>{c.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
                <h3 style={{ fontWeight: 700, margin: "0 0 8px" }}>Inventory Value</h3>
                <div style={{ fontSize: 36, fontWeight: 900, color: "#15803D" }}>{fmtINR(totalVal)}</div>
                <div style={{ color: "#6B7280", fontSize: 13 }}>Total value of current stock</div>
              </div>
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
                <h3 style={{ fontWeight: 700, margin: "0 0 8px" }}>Total Revenue</h3>
                <div style={{ fontSize: 36, fontWeight: 900, color: "#2563EB" }}>{fmtINR(totalRev)}</div>
                <div style={{ color: "#6B7280", fontSize: 13 }}>From {orders.filter(o => o.status !== "cancelled").length} fulfilled orders</div>
              </div>
            </div>
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,.06)", marginTop: 18 }}>
              <h3 style={{ fontWeight: 700, margin: "0 0 16px" }}>Recent Orders</h3>
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{o.customer_name || o.shipping_name || "Customer"}</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>{o.shipping_city || ""} · {new Date(o.created_at).toLocaleDateString("en-IN")}</div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontWeight: 700, color: "#15803D" }}>{fmtINR(o.total_amount)}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[o.status], background: STATUS_COLORS[o.status] + "18", padding: "3px 10px", borderRadius: 20 }}>
                      {STATUS_ICONS[o.status]} {STATUS_LABELS[o.status]}
                    </span>
                  </div>
                </div>
              ))}
              {orders.length === 0 && <div style={{ color: "#9CA3AF", textAlign: "center", padding: 20 }}>No orders yet</div>}
            </div>
          </div>
        )}
      </div>

      {/* Product modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setShowModal(false)}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 32, width: 600, maxHeight: "92vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontWeight: 800, marginBottom: 24, fontFamily: "'Playfair Display', Georgia, serif" }}>{editId ? "✏ Edit Medicine" : "🌿 Add New Medicine"}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

              <div style={{ gridColumn: "1/-1" }}>
                <ValidatedInput
                  label="Medicine Name" required
                  placeholder="e.g. Ashwagandha Rasayana 30C"
                  value={form.name}
                  error={formErrors.name}
                  data-no-numbers="true"
                  onChange={(e) => setFormField("name", e.target.value)}
                />
              </div>

              {[
                ["Category *",
                  <select value={form.category} onChange={(e) => setFormField("category", e.target.value)} style={INPUT_STYLE}>
                    {CAT_LIST.map((c) => <option key={c}>{c}</option>)}
                  </select>
                ],
                ["Badge",
                  <select value={form.badge} onChange={(e) => setFormField("badge", e.target.value)} style={INPUT_STYLE}>
                    <option value="">— None —</option>
                    {Object.keys(BADGE_COLORS).map((b) => <option key={b}>{b}</option>)}
                  </select>
                ],
              ].map(([label, input]) => (
                <div key={label}><label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>{label}</label>{input}</div>
              ))}

              <ValidatedInput
                label="Price (₹)" required type="number"
                placeholder="649"
                value={form.price}
                error={formErrors.price}
                onChange={(e) => setFormField("price", e.target.value)}
              />

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Original Price (₹)</label>
                <input type="number" placeholder="899" value={form.original_price}
                  onChange={(e) => setFormField("original_price", e.target.value)} style={INPUT_STYLE} />
              </div>

              <ValidatedInput
                label="Stock" required type="number"
                placeholder="50"
                value={form.stock}
                error={formErrors.stock}
                onChange={(e) => setFormField("stock", e.target.value)}
              />

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Rating</label>
                <input type="number" step="0.1" min="1" max="5" placeholder="4.5"
                  value={form.rating} onChange={(e) => setFormField("rating", e.target.value)} style={INPUT_STYLE} />
              </div>

              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Product Image (Cloudinary)</label>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 72, height: 72, borderRadius: 10, overflow: "hidden", border: "1px solid #E5E7EB", flexShrink: 0 }}>
                    {imgFile
                      ? <img src={URL.createObjectURL(imgFile)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <HerbImg svgKey={form.svg_key} imageUrl={form.image_url} />
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <input type="file" accept="image/*" onChange={(e) => setImgFile(e.target.files[0] || null)} style={{ fontSize: 13, cursor: "pointer" }} />
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>JPEG/PNG/WebP · max 5 MB</div>
                    {form.image_url && !imgFile && <div style={{ fontSize: 11, color: "#15803D", marginTop: 2 }}>Current: Cloudinary image ✓</div>}
                  </div>
                </div>
              </div>

              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Herb Illustration (fallback SVG)</label>
                <select value={form.svg_key} onChange={(e) => setFormField("svg_key", e.target.value)} style={INPUT_STYLE}>
                  {Object.keys(HERB_SVGS).map((k) => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
                </select>
              </div>

              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Description</label>
                <textarea value={form.description} onChange={(e) => setFormField("description", e.target.value)} rows={3}
                  placeholder="Ayurvedic description…" style={{ ...INPUT_STYLE, resize: "vertical" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 10, padding: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSave} disabled={imgUploading}
                style={{ flex: 2, background: "linear-gradient(135deg,#15803D,#166534)", color: "#fff", border: "none", borderRadius: 10, padding: 13, fontWeight: 700, cursor: "pointer", opacity: imgUploading ? 0.7 : 1 }}>
                {imgUploading ? "Uploading image…" : editId ? "Save Changes" : "Add Medicine"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}