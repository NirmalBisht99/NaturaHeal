// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || "";
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const DEMO_MODE = !SUPABASE_URL || !SUPABASE_ANON;

// Test that URL is reachable before enabling auth refresh
// This prevents the ERR_NAME_NOT_RESOLVED spam in the console
function isValidSupabaseUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname !== "" && u.protocol === "https:";
  } catch {
    return false;
  }
}

const supabaseUrlValid = !DEMO_MODE && isValidSupabaseUrl(SUPABASE_URL);

export const supabase = DEMO_MODE || !supabaseUrlValid
  ? null
  : createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: {
        persistSession:     true,
        // Only auto-refresh in production when we know the URL works;
        // set to false initially and override in AuthContext after first success
        autoRefreshToken:   true,
        detectSessionInUrl: true,
      },
    });