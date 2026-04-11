"use client";

import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";
import { ClipboardList, Plus } from "lucide-react";

interface RecentEvent {
  event_id: string;
  event_date: string;
  animal_id: string;
  tag_number: string;
  farmer_name: string;
  condition_name: string | null;
  outcome: string | null;
}

interface VetRecentEventsTableProps {
  events: RecentEvent[];
}

function outcomeBadge(outcome: string | null): string {
  if (!outcome) return "badge-muted";
  switch (outcome.toLowerCase()) {
    case "recovered":
      return "badge-green";
    case "recovering":
    case "ongoing":
      return "badge-amber";
    case "deceased":
      return "badge-red";
    default:
      return "badge-muted";
  }
}

export default function VetRecentEventsTable({
  events,
}: VetRecentEventsTableProps) {
  const displayed = events.slice(0, 10);

  if (displayed.length === 0) {
    return (
      <div className="card text-center py-12">
        <ClipboardList className="w-10 h-10 text-muted/40 mx-auto mb-3" />
        <p className="text-sm text-muted">
          You haven&apos;t logged any health events yet
        </p>
        <Link href="/health" className="btn-primary mt-4 inline-flex">
          Log your first event
        </Link>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold">
          Recent Health Events
        </h3>
        <Link href="/health" className="btn-primary text-xs py-1.5 px-3">
          <Plus className="w-3.5 h-3.5" />
          Log new event
        </Link>
      </div>
      <div className="overflow-x-auto -mx-6">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Recent health events logged by this veterinarian
          </caption>
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Date
              </th>
              <th className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Animal
              </th>
              <th className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Farm
              </th>
              <th className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Condition
              </th>
              <th className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Outcome
              </th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((event) => (
              <tr
                key={event.event_id}
                className="border-b border-border/50 last:border-0 hover:bg-earth-cream/50 transition-colors"
              >
                <td className="px-6 py-3 text-muted">
                  {formatDate(event.event_date)}
                </td>
                <td className="px-6 py-3">
                  <Link
                    href={`/animals/detail?id=${event.animal_id}`}
                    className="font-medium text-forest-deep hover:text-forest-accent transition-colors"
                  >
                    {event.tag_number}
                  </Link>
                </td>
                <td className="px-6 py-3 text-muted">{event.farmer_name}</td>
                <td className="px-6 py-3 text-forest-deep">
                  {event.condition_name || "—"}
                </td>
                <td className="px-6 py-3">
                  <span className={cn("badge", outcomeBadge(event.outcome))}>
                    {event.outcome || "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
