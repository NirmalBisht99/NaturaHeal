// src/pages/ShopPage.jsx
import { useState } from "react";
import { CATEGORIES } from "../lib/constants.js";
import ProductCard from "../components/shop/ProductCard.jsx";

export function ShopPage({ products, onAdd, wishlist, onWishlist }) {
  const [filter, setFilter] = useState("All");
  const [sort,   setSort]   = useState("default");
  const [search, setSearch] = useState("");

  let filtered = filter === "All"
    ? products
    : products.filter((p) => p.category.toLowerCase().includes(filter.toLowerCase()));

  if (search) {
    filtered = filtered.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (sort === "price_asc")  filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sort === "price_desc") filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sort === "rating")     filtered = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));

  return (
    <div style={{ padding: "clamp(20px,5vw,40px) clamp(16px,5vw,80px)", minHeight: "60vh" }}>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(22px,3vw,30px)", fontWeight: 800, marginBottom: 4 }}>
        Shop All Remedies
      </h1>
      <p style={{ color: "#6B7280", marginBottom: 28 }}>{products.length} medicines available</p>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 200, background: "#fff", borderRadius: 10, border: "1px solid #E5E7EB", padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#9CA3AF" }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search medicines…"
            style={{ border: "none", outline: "none", fontSize: 14, fontFamily: "inherit", flex: 1, minWidth: 0 }}
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ padding: "9px 14px", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "inherit", background: "#fff" }}
        >
          <option value="default">Sort: Default</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        {["All", ...CATEGORIES.map((c) => c.name)].map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            style={{
              padding: "7px 14px", borderRadius: 20,
              border: filter === c ? "none" : "1px solid #E5E7EB",
              background: filter === c ? "#15803D" : "#fff",
              color: filter === c ? "#fff" : "#374151",
              fontWeight: 600, fontSize: 12, cursor: "pointer",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9CA3AF" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <div style={{ fontWeight: 600 }}>No products found</div>
        </div>
      ) : (
        <div className="grid-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={onAdd} wishlist={wishlist} onWishlist={onWishlist} />
          ))}
        </div>
      )}
    </div>
  );
}