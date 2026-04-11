"use client";

import { formatDistanceToNow } from "date-fns";

export type ActivityRow = {
  log_id: string;
  user_name: string | null;
  action: string;
  table_name: string;
  created_at: string;
};

interface AdminActivityFeedProps {
  activities: ActivityRow[];
}

function formatAction(action: string, table: string, userName: string | null): string {
  const user = userName || "System";
  const tableLabel = table.replace(/_/g, " ");

  switch (action.toUpperCase()) {
    case "INSERT":
      return `${user} created a ${tableLabel} record`;
    case "UPDATE":
      return `${user} updated a ${tableLabel} record`;
    case "DELETE":
      return `${user} deleted a ${tableLabel} record`;
    default:
      return `${user} performed ${action} on ${tableLabel}`;
  }
}

export default function AdminActivityFeed({ activities }: AdminActivityFeedProps) {
  return (
    <div className="card h-full">
      <h2 className="font-display text-lg font-semibold text-forest-deep mb-4">
        Recent System Activity
      </h2>
      {activities.length === 0 ? (
        <p className="text-sm text-muted py-8 text-center">
          No recent activity. System is quiet.
        </p>
      ) : (
        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
          {activities.map((a) => (
            <div
              key={a.log_id}
              className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-b-0"
            >
              <p className="text-sm text-forest-deep leading-snug">
                {formatAction(a.action, a.table_name, a.user_name)}
              </p>
              <span className="text-[11px] text-muted whitespace-nowrap shrink-0">
                {formatDistanceToNow(new Date(a.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
