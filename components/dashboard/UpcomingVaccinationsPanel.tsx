"use client";

import Link from "next/link";
import { cn, formatDate, daysFromNow } from "@/lib/utils";
import { Syringe } from "lucide-react";

interface UpcomingVacc {
  vacc_id: string;
  animal_id: string;
  tag_number: string;
  vaccine_name: string;
  next_due_date: string;
  farmer_name: string;
}

interface UpcomingVaccinationsPanelProps {
  vaccinations: UpcomingVacc[];
}

export default function UpcomingVaccinationsPanel({
  vaccinations,
}: UpcomingVaccinationsPanelProps) {
  if (vaccinations.length === 0) {
    return (
      <div className="card h-full flex flex-col items-center justify-center text-center py-12">
        <Syringe className="w-10 h-10 text-muted/40 mb-3" />
        <p className="text-sm text-muted">No vaccinations due this week</p>
      </div>
    );
  }

  return (
    <div className="card h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Syringe className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg font-semibold">
            This Week&apos;s Vaccinations
          </h3>
        </div>
      </div>
      <div className="space-y-3">
        {vaccinations.map((v) => {
          const daysUntil = daysFromNow(v.next_due_date);
          const urgent = daysUntil <= 3;
          return (
            <div
              key={v.vacc_id}
              className="flex items-start justify-between gap-3 p-3 rounded-lg bg-earth-cream/60"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/animals/detail?id=${v.animal_id}`}
                    className="text-sm font-semibold text-forest-deep hover:text-forest-accent transition-colors"
                  >
                    {v.tag_number}
                  </Link>
                </div>
                <p className="text-sm font-medium text-forest-deep mt-0.5">
                  {v.vaccine_name}
                </p>
                <span className="text-xs text-muted">{v.farmer_name}</span>
              </div>
              <div className="text-right shrink-0">
                <span
                  className={cn(
                    "badge",
                    urgent ? "badge-amber" : "badge-green"
                  )}
                >
                  {daysUntil === 0
                    ? "Today"
                    : daysUntil === 1
                      ? "1 day"
                      : `${daysUntil} days`}
                </span>
                <p className="text-xs text-muted mt-1">
                  {formatDate(v.next_due_date)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
