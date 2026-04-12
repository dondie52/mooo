import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client with the SERVICE ROLE key — bypasses RLS.
 * Only use in server-side code (server actions, API routes, edge functions).
 * NEVER import this file into a Client Component.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
