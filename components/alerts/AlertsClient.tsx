"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, AlertTriangle, Info, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import StatusFilter from "@/components/ui/StatusFilter";
import { formatDistanceToNow, parseISO } from "date-fns";
import type { Tables } from "@/lib/supabase/database.types";

type Alert = Tables<"alerts">;

interface AlertsClientProps {
  alerts: Alert[];
}

const severityOptions = [
  { label: "Critical", value: "critical" },
  { label: "Warning", value: "warning" },
  { label: "Info", value: "info" },
];

const severityIcon = {
  critical: Bell,
  warning: AlertTriangle,
  info: Info,
} as const;

const severityBorder: Record<string, string> = {
  critical: "border-l-alert-red",
  warning: "border-l-gold",
  info: "border-l-forest-accent",
};

const severityIconColor: Record<string, string> = {
  critical: "text-alert-red bg-red-50",
  warning: "text-gold-dark bg-amber-50",
  info: "text-forest-accent bg-green-50",
};

export default function AlertsClient({ alerts: initialAlerts }: AlertsClientProps) {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [severityFilter, setSeverityFilter] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const filtered = alerts.filter((a) => {
    const matchesSeverity = !severityFilter || a.severity === severityFilter;
    const matchesRead = !unreadOnly || !a.is_read;
    return matchesSeverity && matchesRead;
  });

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  async function markRead(id: string) {
    const supabase = createClient();
    await supabase.from("alerts").update({ is_read: true } as any).eq("alert_id", id);
    setAlerts((prev) => prev.map((a) => a.alert_id === id ? { ...a, is_read: true } : a));
    router.refresh();
  }

  async function markAllRead() {
    const supabase = createClient();
    const unreadIds = alerts.filter((a) => !a.is_read).map((a) => a.alert_id);
    await supabase.from("alerts").update({ is_read: true } as any).in("alert_id", unreadIds);
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">Alerts</h1>
          <p className="text-sm text-muted mt-1">
            Notifications and system alerts
            {unreadCount > 0 && (
              <span className="ml-2 badge badge-red">{unreadCount} unread</span>
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary shrink-0">
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <StatusFilter value={severityFilter} onChange={setSeverityFilter} options={severityOptions} />
        <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="w-4 h-4 rounded border-border text-forest-mid focus:ring-forest-accent/30"
          />
          Unread only
        </label>
      </div>

      {/* Alert list */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="w-10 h-10 text-muted/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-forest-deep">No alerts</p>
          <p className="text-xs text-muted mt-1">
            {severityFilter || unreadOnly ? "Try adjusting your filters" : "You're all caught up"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((alert) => {
            const sev = alert.severity as keyof typeof severityIcon;
            const Icon = severityIcon[sev] ?? Info;
            return (
              <div
                key={alert.alert_id}
                className={cn(
                  "rounded-xl border border-border p-4 transition-colors",
                  !alert.is_read
                    ? cn("border-l-4 bg-earth-sand/50", severityBorder[alert.severity])
                    : "bg-white opacity-70"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", severityIconColor[alert.severity])}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={cn("text-sm font-semibold", !alert.is_read ? "text-forest-deep" : "text-muted")}>
                        {alert.title}
                      </h4>
                      <span className="text-[10px] text-muted whitespace-nowrap shrink-0">
                        {formatDistanceToNow(parseISO(alert.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted mt-0.5">{alert.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {alert.animal_id && (
                        <Link href={`/animals/${alert.animal_id}`} className="text-xs font-medium text-forest-accent hover:text-forest-mid">
                          View animal
                        </Link>
                      )}
                      {!alert.is_read && (
                        <button
                          onClick={() => markRead(alert.alert_id)}
                          className="text-xs font-medium text-muted hover:text-forest-deep"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
