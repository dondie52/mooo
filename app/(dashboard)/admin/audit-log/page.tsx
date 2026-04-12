"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScrollText, Search } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import EmptyState from "@/components/ui/EmptyState";

interface AuditEntry {
  log_id: string;
  user_id: string | null;
  user_name: string;
  action: string;
  table_name: string | null;
  record_id: string | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

const PAGE_SIZE = 25;

export default function AdminAuditLogPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: me } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
      if ((me as any)?.role !== "admin") { router.push("/dashboard"); return; }

      // Fetch audit log entries (limit 200 for client-side filtering)
      const { data: logs } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (!logs) { setLoading(false); return; }

      // Fetch user names for all user_ids
      const userIds = [...new Set((logs as any[]).map((l) => l.user_id).filter(Boolean))];
      const { data: profiles } = userIds.length > 0
        ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
        : { data: [] };

      const nameMap = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name]));

      const mapped: AuditEntry[] = (logs as any[]).map((l) => ({
        log_id: l.log_id,
        user_id: l.user_id,
        user_name: l.user_id ? (nameMap.get(l.user_id) ?? "Unknown") : "System",
        action: l.action,
        table_name: l.table_name,
        record_id: l.record_id,
        new_data: l.new_data,
        created_at: l.created_at,
      }));

      setEntries(mapped);
      setLoading(false);
    };
    load();
  }, [router]);

  // Client-side filtering
  const filtered = entries.filter((e) => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        e.action.toLowerCase().includes(q) ||
        e.user_name.toLowerCase().includes(q) ||
        (e.table_name ?? "").toLowerCase().includes(q);
      if (!match) return false;
    }
    if (dateFrom && e.created_at < dateFrom) return false;
    if (dateTo && e.created_at > dateTo + "T23:59:59") return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Action display formatting
  function formatAction(action: string) {
    return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function actionBadgeClass(action: string) {
    if (action.includes("delete") || action.includes("deactivate")) return "badge-red";
    if (action.includes("create") || action.includes("activate")) return "badge-green";
    if (action.includes("change") || action.includes("edit") || action.includes("reset")) return "badge-amber";
    return "badge-muted";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-2 border-forest-mid border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">Audit Log</h1>
        <p className="text-sm text-muted mt-1">
          {entries.length} entries · All admin actions are recorded here
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            className="input pl-9"
            placeholder="Search by action, user, table..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-xs text-muted">From</label>
          <input type="date" className="input w-auto py-1.5 text-xs" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }} />
          <label className="text-xs text-muted">To</label>
          <input type="date" className="input w-auto py-1.5 text-xs" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit entries"
          description={search || dateFrom || dateTo ? "Try adjusting your filters" : "Admin actions will appear here once performed"}
        />
      ) : (
        <>
          <div className="card">
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Timestamp", "User", "Action", "Table", "Details"].map((h) => (
                      <th key={h} className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((entry) => (
                    <tr key={entry.log_id} className="border-b border-border/50 last:border-0">
                      <td className="px-6 py-3 text-muted whitespace-nowrap text-xs">
                        {new Date(entry.created_at).toLocaleString("en-BW", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-3 font-medium text-forest-deep">{entry.user_name}</td>
                      <td className="px-6 py-3">
                        <span className={cn("badge", actionBadgeClass(entry.action))}>
                          {formatAction(entry.action)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-muted font-mono text-xs">{entry.table_name || "—"}</td>
                      <td className="px-6 py-3 text-muted text-xs max-w-[250px] truncate">
                        {entry.new_data ? JSON.stringify(entry.new_data) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="btn-secondary text-xs disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="btn-secondary text-xs disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
