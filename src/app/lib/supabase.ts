import { createClient } from "@supabase/supabase-js";

// Make sure to add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file.
// The fallback URL prevents the app from crashing before you've set up your .env file.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "public-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
