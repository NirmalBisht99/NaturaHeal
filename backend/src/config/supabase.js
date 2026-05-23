// backend/src/config/supabase.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL          = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.warn("⚠️  Supabase env vars missing — DB operations will fail.");
}

// Validate URL format before creating client
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

const url  = SUPABASE_URL && isValidUrl(SUPABASE_URL) ? SUPABASE_URL : "https://placeholder.supabase.co";
const key  = SUPABASE_SERVICE_ROLE || "placeholder-key";

export const supabaseAdmin = createClient(url, key, {
  auth: {
    persistSession:   false,
    autoRefreshToken: false,
  },
  global: {
    fetch: (input, init) => {
      // Add a 10-second timeout to every Supabase request
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      return fetch(input, { ...init, signal: controller.signal })
        .finally(() => clearTimeout(timer));
    },
  },
});

// Test connectivity on startup (non-blocking)
export async function testSupabaseConnection() {
  try {
    const { error } = await supabaseAdmin
      .from("products")
      .select("id")
      .limit(1);
    if (error) {
      console.warn("⚠️  Supabase connection test failed:", error.message);
      return false;
    }
    console.log("✅ Supabase connected successfully");
    return true;
  } catch (err) {
    console.warn("⚠️  Supabase unreachable:", err.message);
    return false;
  }
}