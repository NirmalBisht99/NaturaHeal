// backend/src/server.js
import "dotenv/config";
import http    from "http";
import express from "express";
import cors    from "cors";
import { WebSocketServer } from "ws";

import authRoutes    from "./routes/authRoutes.js";
import orderRoutes   from "./routes/orderRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import adminRoutes   from "./routes/adminRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import chatRoutes    from "./routes/chatRoutes.js";
import { requestLogger, errorHandler, notFound } from "./middleware/errorHandler.js";
import { testSupabaseConnection } from "./config/supabase.js";

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 4000;

// ── WebSocket server ──────────────────────────────────────────
export const wss = new WebSocketServer({ server, path: "/ws" });

// Track connected clients: ws → { userId, isAdmin }
const clients = new Map();

wss.on("connection", (ws, req) => {
  const url     = new URL(req.url, "http://localhost");
  const userId  = url.searchParams.get("userId") || "anonymous";
  const isAdmin = url.searchParams.get("role") === "admin";

  clients.set(ws, { userId, isAdmin });
  console.log(`🔌 WS connected: ${userId} (admin: ${isAdmin})`);

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`🔌 WS disconnected: ${userId}`);
  });

  ws.on("error", (err) => console.warn("WS error:", err.message));

  ws.send(JSON.stringify({ type: "connected", userId }));
});

function safeSend(ws, payload) {
  if (ws.readyState === WebSocket.OPEN) {
    try { ws.send(JSON.stringify(payload)); } catch {}
  }
}

// Broadcast to a specific user + all admins
export function broadcastOrderUpdate(userId, payload) {
  for (const [ws, meta] of clients) {
    if (meta.userId === userId || meta.isAdmin) safeSend(ws, payload);
  }
}

// Broadcast to all admins only
export function broadcastToAdmins(payload) {
  for (const [ws, meta] of clients) {
    if (meta.isAdmin) safeSend(ws, payload);
  }
}

// Broadcast product changes to everyone
export function broadcastProductUpdate(payload) {
  for (const [ws] of clients) safeSend(ws, payload);
}

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://127.0.0.1:5173",
];

if (process.env.CLIENT_URL) allowedOrigins.push(process.env.CLIENT_URL);

app.use(cors({
  origin(origin, cb) {
    // Allow requests with no origin (curl, mobile apps)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // Allow any HTTPS origin in production (Render, Vercel, Netlify, etc.)
    if (process.env.NODE_ENV === "production" && origin.startsWith("https://")) {
      return cb(null, true);
    }
    console.warn("CORS blocked:", origin);
    return cb(new Error("CORS blocked: " + origin));
  },
  credentials:          true,
  methods:              ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders:       ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
}));

app.options("*", cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check
app.get("/health", (_req, res) =>
  res.json({
    status:  "ok",
    service: "NaturaHeal API",
    ts:      new Date().toISOString(),
  })
);

// API routes
app.use("/api/auth",     authRoutes);
app.use("/api/orders",   orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin",    adminRoutes);
app.use("/api/payment",  paymentRoutes);
app.use("/api/chat",     chatRoutes);

app.use(notFound);
app.use(errorHandler);

// Start server, then test Supabase (non-blocking)
server.listen(PORT, () => {
  console.log("\n  ╔══════════════════════════════════════════╗");
  console.log(`  ║  🌿 NaturaHeal API + WS on :${PORT}         ║`);
  console.log(`  ║  Env: ${(process.env.NODE_ENV || "development").padEnd(35)}║`);
  console.log("  ╚══════════════════════════════════════════╝\n");

  testSupabaseConnection().catch(() => {});
});

export default app;