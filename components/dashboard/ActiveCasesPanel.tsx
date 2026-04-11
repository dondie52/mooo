"use client";

import Link from "next/link";
import { cn, daysFromNow } from "@/lib/utils";
import { HeartPulse, ArrowRight } from "lucide-react";

interface ActiveCase {
  event_id: string;
  animal_id: string;
  tag_number: string;
  condition_name: string | null;
  severity: string | null;
  event_date: string;
  farmer_name: string;
  outcome: string;
}

interface ActiveCasesPanelProps {
  cases: ActiveCase[];
}

const severityBadge: Record<string, string> = {
  mild: "badge-green",
  moderate: "badge-amber",
  severe: "badge-red",
  critical: "badge-red",
};

export default function ActiveCasesPanel({ cases }: ActiveCasesPanelProps) {
  if (cases.length === 0) {
    return (
      <div className="card h-full flex flex-col items-center justify-center text-center py-12">
        <HeartPulse className="w-10 h-10 text-muted/40 mb-3" />
        <p className="text-sm text-muted">
          No active cases — all animals are healthy
        </p>
      </div>
    );
  }

  return (
    <div className="card h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-alert-red" />
          <h3 className="font-display text-lg font-semibold">Active Cases</h3>
        </div>
      </div>
      <div className="space-y-3">
        {cases.map((c) => {
          const daysAgo = Math.abs(daysFromNow(c.event_date));
          return (
            <div
              key={c.event_id}
              className="flex items-start gap-3 p-3 rounded-lg bg-earth-cream/60"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/animals/detail?id=${c.animal_id}`}
                    className="text-sm font-semibold text-forest-deep hover:text-forest-accent transition-colors"
                  >
                    {c.tag_number}
                  </Link>
                  {c.severity && (
                    <span
                      className={cn(
                        "badge",
                        severityBadge[c.severity] || "badge-muted"
                      )}
                    >
                      {c.severity}
                    </span>
                  )}
                </div>
                <p className="text-sm text-forest-deep mt-0.5">
                  {c.condition_name || "Unknown condition"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted">
                    {daysAgo === 0
                      ? "Today"
                      : daysAgo === 1
                        ? "1 day ago"
                        : `${daysAgo} days ago`}
                  </span>
                  <span className="text-xs text-muted">·</span>
                  <span className="text-xs text-muted">{c.farmer_name}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-3 border-t border-border">
        <Link
          href="/health"
          className="text-sm text-forest-accent hover:text-forest-mid font-medium flex items-center gap-1"
        >
          Log follow-up <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
