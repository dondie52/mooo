"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeartPulse, Plus } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/database.types";
import SearchInput from "@/components/ui/SearchInput";
import StatusFilter from "@/components/ui/StatusFilter";
import EmptyState from "@/components/ui/EmptyState";
import LogHealthEventModal from "@/components/health/LogHealthEventModal";

const typeOptions = [
  { label: "Disease", value: "disease" },
  { label: "Injury", value: "injury" },
  { label: "Treatment", value: "treatment" },
  { label: "Checkup", value: "checkup" },
  { label: "Other", value: "other" },
];

const severityBadge: Record<string, string> = {
  mild: "badge-green",
  moderate: "badge-amber",
  severe: "badge-red",
  critical: "badge-red",
};

const outcomeBadge: Record<string, string> = {
  recovered: "badge-green",
  recovering: "badge-amber",
  ongoing: "badge-amber",
  referred: "badge-muted",
  deceased: "badge-red",
};

interface HealthClientProps {
  events: (Tables<"health_events"> & { animals: { tag_number: string } | null })[];
  animals: Pick<Tables<"animals">, "animal_id" | "tag_number" | "breed" | "status">[];
}

export default function HealthClient({ events, animals }: HealthClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = events
    .filter((evt) => {
      const matchesType = !typeFilter || evt.event_type === typeFilter;
      const q = search.toLowerCase();
      const tag = evt.animals?.tag_number ?? "Unknown";
      const matchesSearch =
        !q ||
        (evt.condition_name ?? "").toLowerCase().includes(q) ||
        tag.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    })
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">Health Events</h1>
          <p className="text-sm text-muted mt-1">Disease, injury, and treatment records</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary shrink-0">
          <Plus className="w-4 h-4" /> Log Event
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by condition or animal tag…" />
        </div>
        <StatusFilter value={typeFilter} onChange={setTypeFilter} options={typeOptions} />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={HeartPulse}
          title="No health events found"
          description={search || typeFilter ? "Try adjusting your filters" : "Log your first health event to start tracking"}
        />
      ) : (
        <div className="card">
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <caption className="sr-only">Health events with date, animal, condition, severity, and outcome</caption>
              <thead>
                <tr className="border-b border-border">
                  {["Date", "Animal", "Type", "Condition", "Severity", "Treatment", "Outcome", "Vet"].map((h) => (
                    <th key={h} className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((evt) => {
                  const tag = evt.animals?.tag_number ?? "Unknown";
                  return (
                    <tr key={evt.event_id} onClick={() => router.push(`/animals/detail?id=${evt.animal_id}`)} className="border-b border-border/50 last:border-0 hover:bg-earth-cream/50 transition-colors cursor-pointer">
                      <td className="px-6 py-3 text-muted whitespace-nowrap">{formatDate(evt.event_date)}</td>
                      <td className="px-6 py-3">
                        <Link href={`/animals/detail?id=${evt.animal_id}`} className="font-medium text-forest-deep hover:text-forest-accent">
                          {tag}
                        </Link>
                      </td>
                      <td className="px-6 py-3"><span className="badge badge-muted capitalize">{evt.event_type}</span></td>
                      <td className="px-6 py-3 font-medium">{evt.condition_name || "—"}</td>
                      <td className="px-6 py-3">
                        {evt.severity ? (
                          <span className={cn("badge", severityBadge[evt.severity])}>{evt.severity}</span>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-3 text-muted max-w-[180px] truncate">{evt.treatment_given || "—"}</td>
                      <td className="px-6 py-3">
                        {evt.outcome ? (
                          <span className={cn("badge", outcomeBadge[evt.outcome] ?? "badge-muted")}>{evt.outcome}</span>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-3 text-muted">{evt.vet_name || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <LogHealthEventModal open={modalOpen} onClose={() => setModalOpen(false)} animals={animals} />
    </div>
  );
}
