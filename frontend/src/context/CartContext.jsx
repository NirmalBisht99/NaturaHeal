// src/context/CartContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const CartCtx = createContext(null);
export const useCart = () => useContext(CartCtx);

function loadCart() {
  try { return JSON.parse(localStorage.getItem("nh_cart") || "[]"); }
  catch { return []; }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem("nh_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) =>
    setCart((prev) => {
      const found = prev.find((i) => i.id === product.id);
      return found
        ? prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
        : [...prev, { ...product, qty: 1 }];
    });

  const removeFromCart = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const updateQty = (id, delta) =>
    setCart((prev) =>
      prev.map((i) => i.id === id ? { ...i, qty: i.qty + delta } : i)
          .filter((i) => i.qty > 0)
    );

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartCtx.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, cartCount, cartTotal }}>
      {children}
    </CartCtx.Provider>
  );
}