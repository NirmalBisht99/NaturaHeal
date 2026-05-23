import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { DEMO_MODE } from "../../lib/supabase.js";
import { rules } from "../../lib/validation.js";
import ValidatedInput from "../ui/ValidatedInput.jsx";

export default function AuthPage({ onSuccess }) {
  const [mode,      setMode]      = useState("login");
  const [loginType, setLoginType] = useState("email");
  const [form,      setForm]      = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors,    setErrors]    = useState({});
  const [touched,   setTouched]   = useState({});
  const [otpSent,   setOtpSent]   = useState(false);
  const [otp,       setOtp]       = useState("");
  const [loading,   setLoading]   = useState(false);
  const [serverErr, setServerErr] = useState("");
  const [showPw,    setShowPw]    = useState(false);

  const { signIn, signUp, signInWithPhone, verifyOtp, adminSignIn } = useAuth();

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setTouched((p) => ({ ...p, [k]: true }));
    // Clear server error on any change
    setServerErr("");
    // Live validate
    const err = validateField(k, v);
    setErrors((p) => ({ ...p, [k]: err }));
  };

  const validateField = (k, v) => {
    if (k === "name")     return rules.name(v);
    if (k === "email")    return rules.email(v);
    if (k === "password") return rules.password(v);
    if (k === "phone")    return rules.phone(v);
    if (k === "confirm")  return v !== form.password ? "Passwords do not match" : null;
    return null;
  };

  const validateAll = (fields) => {
    const errs = {};
    for (const f of fields) errs[f] = validateField(f, form[f]);
    setErrors(errs);
    setTouched(Object.fromEntries(fields.map((f) => [f, true])));
    return Object.values(errs).every((e) => !e);
  };

  const handleSendOtp = async () => {
    if (!validateAll(["phone"])) return;
    setServerErr(""); setLoading(true);
    try {
      if (DEMO_MODE) { setOtpSent(true); setLoading(false); return; }
      await signInWithPhone(form.phone);
      setOtpSent(true);
    } catch (e) {
      setServerErr(e.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) { setServerErr("Enter the OTP."); return; }
    setServerErr(""); setLoading(true);
    try {
      if (DEMO_MODE) { onSuccess(); return; }
      await verifyOtp(form.phone, otp);
      onSuccess();
    } catch (e) {
      setServerErr(e.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    setServerErr("");

    let fieldsToValidate;
    if (mode === "admin")  fieldsToValidate = ["email", "password"];
    else if (mode === "signup") fieldsToValidate = ["name", "email", "password", "confirm"];
    else fieldsToValidate = ["email", "password"];

    if (!validateAll(fieldsToValidate)) return;

    setLoading(true);
    try {
      if (mode === "admin") {
        await adminSignIn(form.email, form.password);
        onSuccess();
      } else if (mode === "signup") {
        await signUp(form.email, form.password, form.name);
        if (!DEMO_MODE) {
          alert("Account created! Check your email to confirm, then sign in.");
          setMode("login");
          return;
        }
        onSuccess();
      } else {
        await signIn(form.email, form.password);
        onSuccess();
      }
    } catch (e) {
      setServerErr(e.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = mode === "admin";
  const IS = {
    width: "100%", padding: "12px 14px",
    border: "1px solid #E5E7EB", borderRadius: 8,
    fontSize: 14, outline: "none",
    boxSizing: "border-box", fontFamily: "inherit", background: "#fff",
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#F0FDF4,#DCFCE7,#BBF7D0)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#15803D,#166534)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: "0 8px 24px rgba(21,128,61,.4)" }}>
            <span style={{ fontSize: 30 }}>🌿</span>
          </div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 800, color: "#111827" }}>NaturaHeal</div>
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2, letterSpacing: 2, textTransform: "uppercase" }}>Homeopathic Store</div>
        </div>

        <div style={{ background: "#fff", borderRadius: 24, padding: 36, boxShadow: "0 20px 60px rgba(0,0,0,.12)" }}>

          {/* Tabs */}
          {!isAdmin && (
            <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 12, padding: 4, marginBottom: 28 }}>
              {[["login", "Sign In"], ["signup", "Create Account"]].map(([t, l]) => (
                <button key={t} onClick={() => { setMode(t); setServerErr(""); setErrors({}); setTouched({}); setOtpSent(false); }}
                  style={{ flex: 1, padding: 10, border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 14, background: mode === t ? "#fff" : "transparent", color: mode === t ? "#111827" : "#6B7280", boxShadow: mode === t ? "0 2px 6px rgba(0,0,0,.1)" : "none", transition: "all .2s" }}>
                  {l}
                </button>
              ))}
            </div>
          )}

          {isAdmin && (
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔐</div>
              <h2 style={{ fontWeight: 800, margin: 0, color: "#111827" }}>Admin Login</h2>
              <p style={{ color: "#6B7280", fontSize: 13, margin: "6px 0 0" }}>Restricted — authorised personnel only</p>
            </div>
          )}

          {/* Login type toggle */}
          {mode === "login" && (
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[["email", "📧 Email"], ["phone", "📱 Phone OTP"]].map(([t, l]) => (
                <button key={t} onClick={() => { setLoginType(t); setServerErr(""); setErrors({}); setTouched({}); setOtpSent(false); }}
                  style={{ flex: 1, padding: 8, border: `2px solid ${loginType === t ? "#15803D" : "#E5E7EB"}`, borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, background: loginType === t ? "#F0FDF4" : "#fff", color: loginType === t ? "#15803D" : "#6B7280", transition: "all .2s" }}>
                  {l}
                </button>
              ))}
            </div>
          )}

          {/* Phone OTP flow */}
          {mode === "login" && loginType === "phone" && (
            <>
              <ValidatedInput
                label="Mobile Number" required type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={form.phone}
                error={touched.phone ? errors.phone : null}
                onChange={(e) => set("phone", e.target.value)}
                disabled={otpSent}
                hint="10-digit Indian mobile number"
                style={{ marginBottom: 16 }}
              />

              {otpSent && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Enter OTP *</label>
                  <input type="text" placeholder="6-digit OTP" value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                    style={IS} maxLength={6} />
                  {DEMO_MODE && <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>Demo: enter any 6 digits</div>}
                </div>
              )}

              {serverErr && <div style={{ background: "#FEF2F2", color: "#DC2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>⚠️ {serverErr}</div>}

              <button onClick={otpSent ? handleVerifyOtp : handleSendOtp} disabled={loading}
                style={{ width: "100%", background: "linear-gradient(135deg,#15803D,#166534)", color: "#fff", border: "none", borderRadius: 12, padding: 15, fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: loading ? 0.7 : 1, boxShadow: "0 4px 14px rgba(21,128,61,.4)" }}>
                {loading ? "Please wait…" : otpSent ? "Verify OTP →" : "Send OTP →"}
              </button>

              {otpSent && (
                <button onClick={() => { setOtpSent(false); setOtp(""); setServerErr(""); }}
                  style={{ display: "block", margin: "12px auto 0", background: "none", border: "none", color: "#6B7280", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
                  Change number
                </button>
              )}
            </>
          )}

          {/* Email + password flow */}
          {(mode !== "login" || loginType === "email" || isAdmin) && !(mode === "login" && loginType === "phone") && (
            <>
              {mode === "signup" && (
                <ValidatedInput
                  label="Full Name" required
                  placeholder="Your full name"
                  value={form.name}
                  error={touched.name ? errors.name : null}
                  data-no-numbers="true"
                  onChange={(e) => set("name", e.target.value)}
                  hint="Letters only — no numbers"
                  style={{ marginBottom: 16 }}
                />
              )}

              <ValidatedInput
                label="Email Address" required type="email"
                placeholder={isAdmin ? "admin@naturaheal.com" : "your@email.com"}
                value={form.email}
                error={touched.email ? errors.email : null}
                onChange={(e) => set("email", e.target.value)}
                style={{ marginBottom: 16 }}
              />

              <div style={{ marginBottom: mode === "signup" ? 16 : 22, position: "relative" }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Password *</label>
                <div style={{ position: "relative" }}>
                  <input type={showPw ? "text" : "password"} placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    style={{ ...IS, paddingRight: 44, borderColor: (touched.password && errors.password) ? "#EF4444" : "#E5E7EB" }} />
                  <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9CA3AF" }}>
                    {showPw ? "🙈" : "👁"}
                  </button>
                </div>
                {touched.password && errors.password && (
                  <div style={{ fontSize: 12, color: "#EF4444", marginTop: 4 }}>⚠ {errors.password}</div>
                )}
              </div>

              {mode === "signup" && (
                <ValidatedInput
                  label="Confirm Password" required type="password"
                  placeholder="••••••••"
                  value={form.confirm}
                  error={touched.confirm ? errors.confirm : null}
                  onChange={(e) => set("confirm", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  style={{ marginBottom: 22 }}
                />
              )}

              {serverErr && (
                <div style={{ background: "#FEF2F2", color: "#DC2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>
                  ⚠️ {serverErr}
                </div>
              )}

              <button onClick={submit} disabled={loading}
                style={{ width: "100%", background: isAdmin ? "linear-gradient(135deg,#7C3AED,#6D28D9)" : "linear-gradient(135deg,#15803D,#166534)", color: "#fff", border: "none", borderRadius: 12, padding: 15, fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, boxShadow: isAdmin ? "0 4px 14px rgba(124,58,237,.4)" : "0 4px 14px rgba(21,128,61,.4)" }}>
                {loading ? "Please wait…" : mode === "login" ? "Sign In →" : mode === "signup" ? "Create Account →" : "Admin Sign In →"}
              </button>
            </>
          )}

          {!isAdmin && (
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <button onClick={() => { setMode("admin"); setServerErr(""); setErrors({}); setTouched({}); setLoginType("email"); setForm({ name: "", email: "", phone: "", password: "", confirm: "" }); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#6B7280", textDecoration: "underline" }}>
                🔐 Login as Admin
              </button>
            </div>
          )}
          {isAdmin && (
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <button onClick={() => { setMode("login"); setServerErr(""); setErrors({}); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#6B7280", textDecoration: "underline" }}>
                ← Back to User Login
              </button>
            </div>
          )}

          {DEMO_MODE && (
            <div style={{ marginTop: 20, background: "#F0FDF4", borderRadius: 10, padding: "12px 16px", fontSize: 12, lineHeight: 1.7, border: "1px solid #86EFAC" }}>
              <strong>Demo Mode</strong><br />
              👑 Admin: <code>admin@naturaheal.com</code> / any password<br />
              👤 User: <code>user@naturaheal.com</code> / any password
            </div>
          )}
        </div>
      </div>
    </div>
  );
}