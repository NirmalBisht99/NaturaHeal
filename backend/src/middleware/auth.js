
import { supabaseAdmin } from "../config/supabase.js";
import { verifyAdminToken } from "../utils/jwt.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing authentication token" });
    }

    const token = header.slice(7);

    // ── 1. Try our own admin JWT first ───────────────────────
    // Admin tokens are signed by us and contain { email, role: "admin" }
    try {
      const decoded = verifyAdminToken(token);
      if (decoded && decoded.role === "admin") {
        req.user = {
          id:        "admin",
          email:     decoded.email,
          phone:     process.env.NOTIFICATION_PHONE || "",
          role:      "admin",
          full_name: "Admin",
        };
        req.isAdmin = true;
        return next();
      }
    } catch {
      // Not a valid admin JWT — fall through to Supabase
    }

    // ── 2. Try Supabase user JWT ──────────────────────────────
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const supaUser = data.user;

    // Fetch role from profiles table
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role, full_name, phone")
      .eq("id", supaUser.id)
      .single();

    req.user = {
      id:        supaUser.id,
      email:     supaUser.email  || "",
      phone:     supaUser.phone  || profile?.phone || "",
      role:      profile?.role   || "user",
      full_name: profile?.full_name || "",
    };
    req.isAdmin = req.user.role === "admin";
    return next();

  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: " + err.message });
  }
}

// Use after requireAuth — rejects non-admins
export function requireAdmin(req, res, next) {
  if (!req.isAdmin) {
    return res.status(403).json({ error: "Forbidden: admin access required" });
  }
  next();
}