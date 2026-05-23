// src/pages/index.jsx
// Re-export all pages from their individual files.
// Import pages from here rather than from the files directly.

export { HomePage }     from "./HomePage.jsx";
export { ShopPage }     from "./ShopPage.jsx";
export { WishlistPage } from "./WishlistPage.jsx";
export { MyOrdersPage } from "./MyOrdersPage.jsx";

// CartPage, OrderSuccess, AboutPage, ContactPage all live in StaticPages.jsx
export {
  CartPage,
  OrderSuccess,
  AboutPage,
  ContactPage,
} from "./StaticPages.jsx";