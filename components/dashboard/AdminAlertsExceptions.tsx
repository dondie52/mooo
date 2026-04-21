"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle } from "lucide-react";

export type AlertRow = {
  alert_id: string;
  title: string;
  severity: "info" | "warning" | "critical";
  created_at: string;
  farmer_name: string | null;
};

interface AdminAlertsExceptionsProps {
  alerts: AlertRow[];
}

function severityBadge(severity: AlertRow["severity"]) {
  switch (severity) {
    case "critical":
      return "badge badge-red";
    case "warning":
      return "badge badge-amber";
    default:
      return "badge badge-muted";
  }
}

export default function AdminAlertsExceptions({ alerts }: AdminAlertsExceptionsProps) {
  return (
    <div className="card h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-forest-deep">
          Alerts &amp; Exceptions
        </h2>
        <Link
          href="/alerts"
          className="text-xs text-gold-dark hover:text-gold font-medium"
        >
          View all →
        </Link>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertTriangle className="w-8 h-8 text-muted/40 mb-2" />
          <p className="text-sm text-muted">
            No warning or critical alerts across farms.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
          {alerts.map((a) => (
            <div
              key={a.alert_id}
              className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-forest-deep leading-snug truncate">
                  {a.title}
                </p>
                <p className="text-[11px] text-muted mt-0.5">
                  {a.farmer_name ?? "Unknown farmer"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={severityBadge(a.severity)}>{a.severity}</span>
                <span className="text-[10px] text-muted whitespace-nowrap">
                  {formatDistanceToNow(new Date(a.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
