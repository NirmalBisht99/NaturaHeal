
import { signAdminToken } from "../utils/jwt.js";
import { supabaseAdmin }  from "../config/supabase.js";

// POST /api/admin/login
export async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const adminEmail    = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return res.status(500).json({
        error: "Admin credentials not configured on server. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env",
      });
    }

    // Plain string comparison — no Supabase, no bcrypt
    if (email.trim() !== adminEmail.trim() || password !== adminPassword) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    // Sign a JWT valid for 8 hours
    const token = signAdminToken({ email: adminEmail, role: "admin" });

    console.log(`✅ Admin logged in: ${adminEmail}`);

    res.json({
      success: true,
      token,
      admin: { email: adminEmail, role: "admin" },
    });

  } catch (err) {
    next(err);
  }
}

// GET /api/admin/dashboard
export async function getDashboard(req, res, next) {
  try {
    const [
      { count: totalOrders },
      { count: pendingOrders },
      { count: activeProducts },
      { count: totalUsers },
    ] = await Promise.all([
      supabaseAdmin.from("orders").select("*",   { count: "exact", head: true }),
      supabaseAdmin.from("orders").select("*",   { count: "exact", head: true }).in("status", ["placed", "confirmed"]),
      supabaseAdmin.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
    ]);

    res.json({
      success: true,
      stats: {
        total_orders:    totalOrders    || 0,
        pending_orders:  pendingOrders  || 0,
        active_products: activeProducts || 0,
        total_users:     totalUsers     || 0,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/users
export async function listUsers(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone, role, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, users: data || [] });
  } catch (err) {
    next(err);
  }
}