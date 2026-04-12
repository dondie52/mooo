import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Insert an audit_log row using the Postgres RPC function (SECURITY DEFINER).
 * Works for admins via RLS and for edge functions via the definer function.
 */
export async function logAdminAction(
  supabase: SupabaseClient,
  action: string,
  tableName?: string,
  recordId?: string,
  details?: Record<string, unknown>
) {
  await supabase.rpc("log_audit_entry", {
    p_action: action,
    p_table_name: tableName ?? null,
    p_record_id: recordId ?? null,
    p_old_data: null,
    p_new_data: details ? JSON.stringify(details) : null,
  });
}
