
import { Router }        from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { supabaseAdmin } from "../config/supabase.js";
import { sendOTP, verifyOTP } from "../services/notificationService.js";

const router = Router();

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone, role, avatar_url, created_at")
      .eq("id", req.user.id)
      .single();

    if (error) return res.status(404).json({ error: "Profile not found" });
    res.json({ success: true, profile: data });
  } catch (err) { next(err); }
});

// PATCH /api/auth/me
router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const allowed = {};
    if (req.body.full_name !== undefined) allowed.full_name = String(req.body.full_name);
    if (req.body.phone !== undefined)     allowed.phone     = String(req.body.phone);

    const { data, error } = await supabaseAdmin
      .from("profiles").update(allowed).eq("id", req.user.id).select().single();

    if (error) throw error;
    res.json({ success: true, profile: data });
  } catch (err) { next(err); }
});

// POST /api/auth/send-otp
router.post("/send-otp", async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "phone is required" });
    const status = await sendOTP(phone);
    res.json({ success: true, status });
  } catch (err) { next(err); }
});

// POST /api/auth/verify-otp
router.post("/verify-otp", async (req, res, next) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ error: "phone and code are required" });
    const approved = await verifyOTP(phone, code);
    if (!approved) return res.status(400).json({ error: "Invalid or expired OTP" });
    res.json({ success: true, message: "OTP verified" });
  } catch (err) { next(err); }
});

// PATCH /api/auth/users/:id/role  (admin only)
router.patch("/users/:id/role", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "role must be user or admin" });
    }
    const { data, error } = await supabaseAdmin
      .from("profiles").update({ role }).eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, profile: data });
  } catch (err) { next(err); }
});

export default router;