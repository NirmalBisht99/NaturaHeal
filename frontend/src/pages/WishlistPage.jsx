// src/pages/WishlistPage.jsx
import ProductCard from "../components/shop/ProductCard.jsx";

export function WishlistPage({ products, wishlist, onAdd, onWishlist }) {
  const wished = products.filter((p) => wishlist.includes(p.id));

  return (
    <div style={{ padding: "clamp(20px,5vw,40px) clamp(16px,5vw,80px)", minHeight: "60vh" }}>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(22px,3vw,28px)", fontWeight: 800, marginBottom: 4 }}>
        My Wishlist
      </h1>
      <p style={{ color: "#6B7280", marginBottom: 28 }}>{wished.length} saved items</p>

      {wished.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 56, marginBottom: 14 }}>🤍</div>
          <h3 style={{ fontWeight: 700 }}>No saved items yet</h3>
          <p style={{ color: "#9CA3AF" }}>Tap the heart on any product to save it here.</p>
        </div>
      ) : (
        <div className="grid-4">
          {wished.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={onAdd} wishlist={wishlist} onWishlist={onWishlist} />
          ))}
        </div>
      )}
    </div>
  );
}