// src/App.jsx
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { CartProvider, useCart }  from "./context/CartContext.jsx";
import { useProducts, useWishlist } from "./hooks/index.js";
import { DEMO_MODE } from "./lib/supabase.js";

import Navbar       from "./components/layout/Navbar.jsx";
import AuthPage     from "./components/auth/AuthPage.jsx";
import AdminPanel   from "./components/admin/AdminPanel.jsx";
import CheckoutPage from "./components/shop/CheckoutPage.jsx";
import Chatbot      from "./components/chat/Chatbot.jsx";
import { Spinner, DemoBanner } from "./components/ui/index.jsx";

import { MyOrdersPage } from "./pages/MyOrdersPage.jsx";

import {
  HomePage,
  ShopPage,
  CartPage,
  OrderSuccess,
  AboutPage,
  ContactPage,
  WishlistPage,
} from "./pages/index.jsx";

function AppContent() {
  const { user, isAdmin, loading } = useAuth();
  const { cart, addToCart, removeFromCart, updateQty, clearCart, cartCount } = useCart();
  const { products, setProducts, loading: productsLoading } = useProducts();
  const { wishlist, toggle: toggleWishlist } = useWishlist();

  const [page,           setPage]           = useState("home");
  const [completedOrder, setCompletedOrder] = useState(null);
  // Safety: if auth loading takes > 4s, unblock the UI anyway
  const [authTimedOut,   setAuthTimedOut]   = useState(false);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setAuthTimedOut(true), 4000);
    return () => clearTimeout(t);
  }, [loading]);

  const isLoading = loading && !authTimedOut;

  if (isLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F0FDF4" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
        <Spinner />
        <div style={{ marginTop: 12, color: "#6B7280", fontSize: 14 }}>Loading NaturaHeal…</div>
      </div>
    </div>
  );

  if (page === "auth") {
    return <AuthPage onSuccess={() => setPage("home")} />;
  }

  const handleCheckout = () => {
    if (!user && !DEMO_MODE) { setPage("auth"); return; }
    setPage("checkout");
  };

  if (page === "checkout") return (
    <>
      <DemoBanner demoMode={DEMO_MODE} />
      <Navbar cartCount={cartCount} wishlistCount={wishlist.length} page={page} setPage={setPage} />
      <CheckoutPage
        cart={cart}
        onBack={() => setPage("cart")}
        onSuccess={(order) => { setCompletedOrder(order); clearCart(); setPage("order-success"); }}
      />
      <Chatbot />
    </>
  );

  if (page === "order-success" && completedOrder) return (
    <>
      <DemoBanner demoMode={DEMO_MODE} />
      <Navbar cartCount={0} wishlistCount={wishlist.length} page={page} setPage={setPage} />
      <OrderSuccess
        order={completedOrder}
        onContinue={() => setPage("home")}
        onViewOrders={() => setPage("orders")}
      />
      <Chatbot />
    </>
  );

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", background: "#FAFAFA", minHeight: "100vh" }}>
      <DemoBanner demoMode={DEMO_MODE} />
      <Navbar cartCount={cartCount} wishlistCount={wishlist.length} page={page} setPage={setPage} />

      {page === "home"     && <HomePage    products={products} onAdd={addToCart} wishlist={wishlist} onWishlist={toggleWishlist} setPage={setPage} />}
      {page === "shop"     && <ShopPage    products={products} onAdd={addToCart} wishlist={wishlist} onWishlist={toggleWishlist} />}
      {page === "cart"     && <CartPage    cart={cart} onRemove={removeFromCart} onQty={updateQty} onCheckout={handleCheckout} />}
      {page === "wishlist" && <WishlistPage products={products} wishlist={wishlist} onAdd={addToCart} onWishlist={toggleWishlist} />}
      {page === "about"    && <AboutPage />}
      {page === "contact"  && <ContactPage />}
      {page === "orders"   && <MyOrdersPage />}

      {page === "admin" && isAdmin  && <AdminPanel products={products} setProducts={setProducts} />}
      {page === "admin" && !isAdmin && (
        <div style={{ textAlign: "center", padding: 80 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
          <h2>Access Denied</h2>
          <p style={{ color: "#6B7280" }}>Admin privileges required.</p>
          <button onClick={() => setPage("auth")} style={{ marginTop: 16, background: "#15803D", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>
            Sign In as Admin
          </button>
        </div>
      )}

      {page !== "admin" && <Chatbot />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}