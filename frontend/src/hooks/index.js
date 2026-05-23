// src/hooks/index.js
import { useCallback, useEffect, useState } from "react";
import { supabase, DEMO_MODE } from "../lib/supabase.js";
import { DEMO_PRODUCTS, DEMO_ORDERS, API_BASE } from "../lib/constants.js";
import { useWebSocket } from "./useWebSocket.js";

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    if (DEMO_MODE) {
      setProducts(DEMO_PRODUCTS);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${API_BASE}/api/products`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn("API fetch failed, trying Supabase:", err.message);
    }

    // Fallback: direct Supabase
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (!error && data) {
          setProducts(data);
        } else {
          console.warn("Supabase fallback error:", error?.message);
          setProducts(DEMO_PRODUCTS); // Last resort: demo data
        }
      } catch (err) {
        console.warn("Supabase fallback failed:", err.message);
        setProducts(DEMO_PRODUCTS);
      }
    } else {
      // No Supabase configured either — use demo products so page is not blank
      setProducts(DEMO_PRODUCTS);
    }

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Real-time product updates via WebSocket
  const handleWsMessage = useCallback((msg) => {
    if (msg.type === "product_added") {
      setProducts((prev) => [msg.product, ...prev]);
    } else if (msg.type === "product_updated") {
      setProducts((prev) => prev.map((p) => p.id === msg.product.id ? msg.product : p));
    } else if (msg.type === "product_removed") {
      setProducts((prev) => prev.filter((p) => p.id !== msg.productId));
    } else if (msg.type === "stock_updated") {
      setProducts((prev) =>
        prev.map((p) => p.id === msg.productId ? { ...p, stock: msg.stock } : p)
      );
    }
  }, []);

  useWebSocket({ userId: "public", onMessage: handleWsMessage });

  return { products, setProducts, loading, reload: load };
}

export function useOrders(userId = null) {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (DEMO_MODE) {
      setOrders(DEMO_ORDERS);
      setLoading(false);
      return;
    }

    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);

    let query = supabase
      .from("orders")
      .select("*, order_items(id, product_name, product_svg_key, unit_price, quantity)")
      .order("created_at", { ascending: false });

    if (userId) query = query.eq("user_id", userId);

    const { data, error } = await query;
    if (!error && data) {
      setOrders(data.map((o) => ({ ...o, items: o.order_items || [] })));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (orderId, newStatus, adminNote = "") => {
    if (!DEMO_MODE && supabase) {
      await supabase.from("orders")
        .update({ status: newStatus, ...(adminNote ? { admin_note: adminNote } : {}) })
        .eq("id", orderId);
    }
    setOrders((prev) =>
      prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o)
    );
  };

  return { orders, setOrders, loading, reload: load, updateStatus };
}

export function useWishlist() {
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem("nh_wishlist") || "[]"); }
    catch { return []; }
  });

  const toggle = (id) => {
    setWishlist((prev) => {
      const next = prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id];
      localStorage.setItem("nh_wishlist", JSON.stringify(next));
      return next;
    });
  };

  return { wishlist, toggle };
}