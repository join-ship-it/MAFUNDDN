import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-side client using the service role key (bypasses RLS).
// Only import this in Server Components or Route Handlers — never in client code.
export function createServerClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey);
}
