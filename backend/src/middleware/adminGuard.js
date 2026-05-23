// backend/src/middleware/adminGuard.js
//
// Guards admin-only routes.
// Verifies the JWT we issued at login — no Supabase involved.

import { verifyAdminToken } from "../utils/jwt.js";

export function verifyAdminJWT(req, res, next) {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Admin token missing" });
  }

  const token = header.slice(7);

  try {
    const decoded = verifyAdminToken(token);

    if (!decoded || decoded.role !== "admin") {
      return res.status(403).json({ error: "Not an admin token" });
    }

    req.admin   = decoded;
    req.user    = { id: "admin", email: decoded.email, role: "admin", full_name: "Admin" };
    req.isAdmin = true;
    next();

  } catch (err) {
    return res.status(401).json({ error: "Admin token invalid or expired. Please log in again." });
  }
}