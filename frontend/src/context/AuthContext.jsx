// src/context/AuthContext.jsx
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase, DEMO_MODE } from "../lib/supabase.js";
import { API_BASE } from "../lib/constants.js";
import { closeWebSocket } from "../hooks/useWebSocket.js";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const DEMO_USER   = { id: "demo-user-1",  email: "user@naturaheal.com" };
const DEMO_ADMIN  = { id: "demo-admin-1", email: "admin@naturaheal.com" };
const DEMO_PROF_U = { id: "demo-user-1",  full_name: "Demo User",  phone: "+917579189494", role: "user",  avatar_url: null };
const DEMO_PROF_A = { id: "demo-admin-1", full_name: "Admin",      phone: "+917579189494", role: "admin", avatar_url: null };

export function AuthProvider({ children }) {
  const [user,       setUser]       = useState(null);
  const [profile,    setProfile]    = useState(null);
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem("nh_admin_token") || null);
  const [loading,    setLoading]    = useState(true);

  const isAdmin = profile?.role === "admin";

  const fetchProfile = useCallback(async (userId) => {
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, phone, role, avatar_url")
        .eq("id", userId)
        .single();
      if (data) setProfile(data);
    } catch (e) {
      console.warn("fetchProfile failed:", e.message);
    }
  }, []);

  // Restore session on mount
  useEffect(() => {
    if (DEMO_MODE) {
      setLoading(false);
      return;
    }

    const storedAdminToken = localStorage.getItem("nh_admin_token");
    if (storedAdminToken) {
      setAdminToken(storedAdminToken);
      setUser({ id: "admin", email: "admin@naturaheal.com" });
      setProfile({ id: "admin", full_name: "Admin", role: "admin", phone: "+917579189494" });
      setLoading(false);
      return;
    }

    if (!supabase) {
      setLoading(false);
      return;
    }

    // Wrap in try/catch to handle network errors gracefully
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id).finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("getSession failed (network?):", err.message);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const hasAdminToken = !!localStorage.getItem("nh_admin_token");
      if (hasAdminToken) return;

      if (event === "TOKEN_REFRESH_FAILED") {
        console.warn("Supabase token refresh failed — clearing session");
        setUser(null);
        setProfile(null);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // User: email + password
  const signIn = async (email, password) => {
    if (DEMO_MODE) {
      if (email === "admin@naturaheal.com") {
        setUser(DEMO_ADMIN);
        setProfile(DEMO_PROF_A);
      } else {
        setUser(DEMO_USER);
        setProfile(DEMO_PROF_U);
      }
      return;
    }
    if (!supabase) throw new Error("Supabase not configured");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data?.user) {
      setUser(data.user);
      await fetchProfile(data.user.id);
    }
    return data;
  };

  const signUp = async (email, password, fullName) => {
    if (DEMO_MODE) {
      setUser(DEMO_USER);
      setProfile({ ...DEMO_PROF_U, full_name: fullName });
      return;
    }
    if (!supabase) throw new Error("Supabase not configured");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    return data;
  };

  const signInWithPhone = async (phone) => {
    if (DEMO_MODE) return;
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.auth.signInWithOtp({ phone, options: { channel: "sms" } });
    if (error) throw error;
  };

  const verifyOtp = async (phone, token) => {
    if (DEMO_MODE) {
      setUser(DEMO_USER);
      setProfile(DEMO_PROF_U);
      return;
    }
    if (!supabase) throw new Error("Supabase not configured");
    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
    if (error) throw error;
    return data;
  };

  // Admin: backend JWT (no Supabase)
  const adminSignIn = async (email, password) => {
    if (DEMO_MODE) {
      if (email === "admin@naturaheal.com") {
        setUser(DEMO_ADMIN);
        setProfile(DEMO_PROF_A);
        return;
      }
      throw new Error("Invalid admin credentials");
    }

    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, password }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("Server error. Make sure the backend is running.");
    }

    if (!res.ok) throw new Error(data?.error || "Admin login failed");

    localStorage.setItem("nh_admin_token", data.token);
    setAdminToken(data.token);
    setUser({ id: "admin", email: data.admin.email });
    setProfile({ id: "admin", full_name: "Admin", role: "admin", phone: "+917579189494" });
  };

  const signOut = async () => {
    closeWebSocket();
    localStorage.removeItem("nh_admin_token");
    setAdminToken(null);

    if (!DEMO_MODE && supabase) {
      try { await supabase.auth.signOut(); } catch {}
    }

    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates) => {
    if (!user || !supabase) return;
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();
    if (!error && data) setProfile(data);
    return { data, error };
  };

  // Returns the best available token
  const getToken = async () => {
    const storedAdminToken = localStorage.getItem("nh_admin_token");
    if (storedAdminToken) return storedAdminToken;
    if (adminToken) return adminToken;
    if (!supabase) return null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  };

  return (
    <AuthCtx.Provider value={{
      user, profile, loading,
      isAdmin,
      adminToken,
      signIn, signUp, signInWithPhone,
      verifyOtp,
      verifyPhoneOtp: verifyOtp,
      adminSignIn, signOut, updateProfile, fetchProfile, getToken,
    }}>
      {children}
    </AuthCtx.Provider>
  );
}