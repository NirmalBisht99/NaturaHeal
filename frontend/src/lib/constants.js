// src/lib/constants.js
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const fmtINR = (n) => "₹" + Number(n).toLocaleString("en-IN");

export const ORDER_STATUSES = [
  "placed", "confirmed", "packed", "in_transit",
  "out_for_delivery", "delivered", "cancelled",
];

export const STATUS_LABELS = {
  placed:           "Order Placed",
  confirmed:        "Confirmed",
  packed:           "Packed",
  in_transit:       "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered:        "Delivered",
  cancelled:        "Cancelled",
};

export const STATUS_COLORS = {
  placed:           "#F59E0B",
  confirmed:        "#8B5CF6",
  packed:           "#3B82F6",
  in_transit:       "#0EA5E9",
  out_for_delivery: "#F97316",
  delivered:        "#15803D",
  cancelled:        "#EF4444",
};

export const STATUS_ICONS = {
  placed:           "📦",
  confirmed:        "✅",
  packed:           "📫",
  in_transit:       "🚚",
  out_for_delivery: "🛵",
  delivered:        "🎉",
  cancelled:        "❌",
};

export const TRACKING_STEPS = ["placed", "in_transit", "out_for_delivery", "delivered"];

export const BADGE_COLORS = {
  "Best Seller": "#F59E0B",
  "Top Rated":   "#3B82F6",
  "Sale":        "#EF4444",
  "New":         "#10B981",
};

export const CAT_LIST = [
  "IMMUNITY", "STRESS & SLEEP", "DIGESTION",
  "SKIN CARE", "CHILDREN'S", "PAIN RELIEF",
];

export const CATEGORIES = [
  { name: "Immunity",       emoji: "🛡️", bg: "#DCFCE7", color: "#15803D" },
  { name: "Stress & Sleep", emoji: "🌙", bg: "#EDE9FE", color: "#7C3AED" },
  { name: "Digestion",      emoji: "🌿", bg: "#CCFBF1", color: "#0D9488" },
  { name: "Skin Care",      emoji: "✨", bg: "#FCE7F3", color: "#BE185D" },
  { name: "Children's",     emoji: "🧒", bg: "#FEF9C3", color: "#CA8A04" },
  { name: "Pain Relief",    emoji: "💊", bg: "#FEF3C7", color: "#D97706" },
];

export const ADMIN_SIDEBAR = [
  { id: "orders",    icon: "📋", label: "Orders"    },
  { id: "products",  icon: "🌿", label: "Products"  },
  { id: "inventory", icon: "📦", label: "Inventory" },
  { id: "overview",  icon: "📊", label: "Overview"  },
];

export const DEMO_PRODUCTS = [
  {
    id: "1", name: "Ashwagandha Rasayana 30C", category: "STRESS & SLEEP",
    description: "Withania somnifera root adaptogen. Reduces stress, boosts vitality and stamina.",
    price: 649, original_price: 899, stock: 45,
    badge: "Best Seller", badge_color: "#F59E0B",
    rating: 4.9, review_count: 1247, svg_key: "ashwagandha", image_url: null,
  },
  {
    id: "2", name: "Tulsi Immunity Drops 200C", category: "IMMUNITY",
    description: "Sacred Ocimum sanctum extract. Potent antimicrobial for respiratory wellness.",
    price: 549, original_price: null, stock: 30,
    badge: "Top Rated", badge_color: "#3B82F6",
    rating: 4.8, review_count: 892, svg_key: "tulsi", image_url: null,
  },
  {
    id: "3", name: "Neem Skin Purifier 30C", category: "SKIN CARE",
    description: "Azadirachta indica for acne, eczema and skin infections. Natural purifier.",
    price: 499, original_price: 699, stock: 12,
    badge: "Sale", badge_color: "#EF4444",
    rating: 4.7, review_count: 634, svg_key: "neem", image_url: null,
  },
  {
    id: "4", name: "Haritaki Digestive Tonic", category: "DIGESTION",
    description: "Terminalia chebula fruit. Cleanses digestive tract naturally.",
    price: 449, original_price: null, stock: 60,
    badge: "New", badge_color: "#10B981",
    rating: 4.7, review_count: 521, svg_key: "haritaki", image_url: null,
  },
  {
    id: "5", name: "Brahmi Medhya Syrup 30C", category: "CHILDREN'S",
    description: "Bacopa monnieri — brain tonic. Enhances memory and concentration.",
    price: 599, original_price: null, stock: 0,
    badge: null, badge_color: null,
    rating: 4.8, review_count: 403, svg_key: "brahmi", image_url: null,
  },
  {
    id: "6", name: "Amla Rasayana 200C", category: "IMMUNITY",
    description: "Phyllanthus emblica — richest natural Vitamin C. Immunity builder.",
    price: 399, original_price: null, stock: 22,
    badge: "Top Rated", badge_color: "#3B82F6",
    rating: 4.9, review_count: 1089, svg_key: "amla", image_url: null,
  },
  {
    id: "7", name: "Giloy Fever Guard 30C", category: "IMMUNITY",
    description: "Tinospora cordifolia — Guduchi. Anti-fever and anti-inflammatory.",
    price: 349, original_price: null, stock: 8,
    badge: "Best Seller", badge_color: "#F59E0B",
    rating: 4.8, review_count: 1563, svg_key: "giloy", image_url: null,
  },
  {
    id: "8", name: "Shatavari Women's Tonic", category: "PAIN RELIEF",
    description: "Asparagus racemosus. Hormonal balance and women's reproductive health.",
    price: 749, original_price: null, stock: 35,
    badge: null, badge_color: null,
    rating: 4.7, review_count: 728, svg_key: "shatavari", image_url: null,
  },
];

export const DEMO_ORDERS = [
  {
    id: "DEMO001", status: "delivered", total_amount: 1198, payment_method: "cod",
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    shipping_name: "Priya Sharma", shipping_city: "Mumbai",
    items: [
      { product_name: "Ashwagandha Rasayana 30C", product_svg_key: "ashwagandha", unit_price: 649, quantity: 1 },
      { product_name: "Giloy Fever Guard 30C",    product_svg_key: "giloy",        unit_price: 349, quantity: 1 },
    ],
  },
  {
    id: "DEMO002", status: "in_transit", total_amount: 549, payment_method: "razorpay",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    shipping_name: "Rajesh Kumar", shipping_city: "Delhi",
    items: [
      { product_name: "Tulsi Immunity Drops 200C", product_svg_key: "tulsi", unit_price: 549, quantity: 1 },
    ],
  },
  {
    id: "DEMO003", status: "placed", total_amount: 499, payment_method: "cod",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    shipping_name: "Anita Mehta", shipping_city: "Bengaluru",
    items: [
      { product_name: "Neem Skin Purifier 30C", product_svg_key: "neem", unit_price: 499, quantity: 1 },
    ],
  },
];

export const EMPTY_PRODUCT_FORM = {
  name: "", category: "IMMUNITY", price: "", original_price: "",
  stock: "", badge: "", description: "", svg_key: "ashwagandha",
  rating: "4.5", review_count: "0", image_url: "",
};