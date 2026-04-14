"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeartHandshake, Plus, Clock } from "lucide-react";
import { cn, formatDate, daysFromNow } from "@/lib/utils";
import EmptyState from "@/components/ui/EmptyState";
import RecordBreedingModal from "@/components/breeding/RecordBreedingModal";
import type { Tables } from "@/lib/supabase/database.types";
import { BREEDING_EVENT_LABELS } from "@/lib/utils/breeding";

type BreedingRecord = Tables<"breeding_records">;
type AnimalPick = Pick<Tables<"animals">, "animal_id" | "tag_number" | "breed" | "gender" | "status">;

interface BreedingWithAnimal extends BreedingRecord {
  animals: { tag_number: string; breed: string } | null;
}

interface BreedingClientProps {
  records: BreedingWithAnimal[];
  animals: AnimalPick[];
  calvings: Array<{ animal_id: string; tag_number: string; expected_date: string }>;
  role?: "farmer" | "vet" | "admin";
}

const breedingBadge: Record<string, string> = {
  mating: "badge-muted",
  ai: "badge-muted",
  pregnant: "badge-amber",
  calving: "badge-green",
  abortion: "badge-red",
  weaning: "badge-muted",
};

export default function BreedingClient({ records, animals, calvings, role = "farmer" }: BreedingClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">Breeding</h1>
          <p className="text-sm text-muted mt-1">Breeding records and expected calvings</p>
        </div>
        {role !== "vet" && (
          <button onClick={() => setModalOpen(true)} className="btn-primary shrink-0">
            <Plus className="w-4 h-4" /> Record Event
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Breeding records table */}
        <div className="xl:col-span-2">
          {sortedRecords.length === 0 ? (
            <EmptyState icon={HeartHandshake} title="No breeding records" description="Record mating, pregnancy, or calving events" />
          ) : (
            <div className="card">
              <h3 className="font-display text-lg font-semibold mb-4">Breeding Records</h3>
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-sm">
                  <caption className="sr-only">Breeding records with date, animal, event type, and mate</caption>
                  <thead>
                    <tr className="border-b border-border">
                      {["Date", "Animal", "Event", "Mate", "Sire Breed", "Notes"].map((h) => (
                        <th key={h} className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRecords.map((b) => (
                      <tr key={b.breeding_id} onClick={() => router.push(`/animals/detail?id=${b.animal_id}`)} className="border-b border-border/50 last:border-0 hover:bg-earth-cream/50 transition-colors cursor-pointer">
                        <td className="px-6 py-3 text-muted whitespace-nowrap">{formatDate(b.event_date)}</td>
                        <td className="px-6 py-3">
                          <Link href={`/animals/detail?id=${b.animal_id}`} className="font-medium text-forest-deep hover:text-forest-accent">
                            {b.animals?.tag_number ?? "Unknown"}
                          </Link>
                        </td>
                        <td className="px-6 py-3">
                          <span className={cn("badge", breedingBadge[b.event_type] ?? "badge-muted")}>{BREEDING_EVENT_LABELS[b.event_type] ?? b.event_type}</span>
                        </td>
                        <td className="px-6 py-3 text-muted">{b.mate_tag || "—"}</td>
                        <td className="px-6 py-3 text-muted">{b.sire_breed || "—"}</td>
                        <td className="px-6 py-3 text-muted max-w-[160px] truncate">{b.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Expected calvings panel */}
        <div>
          <div className="card h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold">Expected Calvings</h3>
              <Clock className="w-5 h-5 text-muted" />
            </div>
            {calvings.length === 0 ? (
              <div className="text-center py-8">
                <HeartHandshake className="w-10 h-10 text-muted/40 mx-auto mb-3" />
                <p className="text-sm text-muted">No upcoming calvings</p>
                <p className="text-xs text-muted/60 mt-1">Record breeding events to track expected calvings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {calvings.map((c) => {
                  const days = daysFromNow(c.expected_date);
                  return (
                    <div key={`${c.animal_id}-${c.expected_date}`} className="p-3 rounded-lg bg-earth-cream/60">
                      <div className="flex items-center justify-between mb-1">
                        <Link href={`/animals/detail?id=${c.animal_id}`} className="text-sm font-semibold text-forest-deep hover:text-forest-accent">
                          {c.tag_number}
                        </Link>
                        <span className={cn("badge", days <= 14 ? "badge-amber" : "badge-green")}>
                          {days} days
                        </span>
                      </div>
                      <div className="text-xs text-muted">
                        Expected: {formatDate(c.expected_date)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <RecordBreedingModal open={modalOpen} onClose={() => setModalOpen(false)} animals={animals} />
    </div>
  );
}
