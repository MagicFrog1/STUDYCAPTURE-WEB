import { createClient } from "@supabase/supabase-js";

// Fallback a valores proporcionados si no hay variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://swljiqodhagjtfgzcwyc.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3bGppcW9kaGFnanRmZ3pjd3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNjU2MjAsImV4cCI6MjA3NjY0MTYyMH0.qRY7TmxISkm4n8DmP-yfXVe5DmC9lsqQevxTSBexzGI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});


