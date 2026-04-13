"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2, HeartPulse, Syringe, HeartHandshake, Truck, FileText } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";
import Tabs from "@/components/ui/Tabs";
import EmptyState from "@/components/ui/EmptyState";

const severityBadge: Record<string, string> = {
  mild: "badge-green",
  moderate: "badge-amber",
  severe: "badge-red",
  critical: "badge-red",
};

const breedingBadge: Record<string, string> = {
  mating: "badge-muted",
  pregnant: "badge-amber",
  calving: "badge-green",
  abortion: "badge-red",
  weaning: "badge-muted",
};

const statusBadge: Record<string, string> = {
  active: "badge-green",
  sold: "badge-amber",
  deceased: "badge-red",
  missing: "badge-muted",
};

const tabs = [
  { key: "health", label: "Health Events" },
  { key: "vaccinations", label: "Vaccinations" },
  { key: "breeding", label: "Breeding" },
  { key: "movements", label: "Movements" },
];

interface AnimalDetailClientProps {
  animal: Tables<"animals">;
  healthEvents: Tables<"health_events">[];
  vaccinations: Tables<"vaccinations">[];
  breedingRecords: Tables<"breeding_records">[];
  movements: Tables<"movements">[];
  role?: "farmer" | "vet" | "admin";
}

export default function AnimalDetailClient({
  animal,
  healthEvents,
  vaccinations,
  breedingRecords,
  movements,
  role = "farmer",
}: AnimalDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("health");

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this animal?")) return;
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- delete types resolve to `never` due to generated type mismatch; safe at runtime
    const { error } = await (supabase.from("animals") as any).delete().eq("animal_id", animal.animal_id);
    if (!error) {
      router.push("/animals");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/animals" className="inline-flex items-center gap-2 text-sm text-muted hover:text-forest-mid">
        <ArrowLeft className="w-4 h-4" /> Back to animals
      </Link>

      {/* Animal profile card */}
      <div className="card animate-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold">{animal.tag_number}</h1>
              <span className={cn("badge", statusBadge[animal.status] ?? "badge-muted")}>{animal.status}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {role === "vet" ? (
              <>
                <Link href={`/health?animal=${animal.animal_id}`} className="btn-primary">
                  <HeartPulse className="w-4 h-4" /> Log Health Event
                </Link>
                <Link href={`/vaccinations?animal=${animal.animal_id}`} className="btn-secondary">
                  <Syringe className="w-4 h-4" /> Record Vaccination
                </Link>
              </>
            ) : (
              <>
                <Link href={`/animals/edit?id=${animal.animal_id}`} className="btn-secondary">
                  <Pencil className="w-4 h-4" /> Edit
                </Link>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 text-alert-red text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </>
            )}
            <Link href={`/reports/certificate?id=${animal.animal_id}`} className="btn-gold">
              <FileText className="w-4 h-4" /> Generate Certificate
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Breed", value: animal.breed },
            { label: "Gender", value: animal.gender, capitalize: true },
            { label: "Date of Birth", value: animal.date_of_birth ? formatDate(animal.date_of_birth) : "\u2014" },
            { label: "Colour", value: animal.colour || "\u2014" },
            { label: "Location", value: animal.location || "\u2014" },
            { label: "Type", value: animal.animal_type, capitalize: true },
            { label: "Acquired", value: formatDate(animal.acquired_date) },
            { label: "Registered", value: formatDate(animal.created_at) },
          ].map((item) => (
            <div key={item.label}>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-0.5">{item.label}</div>
              <div className={cn("text-sm font-medium", item.capitalize && "capitalize")}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      <div className="animate-fade-in">
        {activeTab === "health" && (
          healthEvents.length === 0 ? (
            <EmptyState icon={HeartPulse} title="No health events" description="Log a health event to track this animal's health history" />
          ) : (
            <div className="card">
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["Date", "Type", "Condition", "Severity", "Treatment", "Outcome"].map((h) => (
                        <th key={h} className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {healthEvents.map((evt) => (
                      <tr key={evt.event_id} className="border-b border-border/50 last:border-0">
                        <td className="px-6 py-3 text-muted">{formatDate(evt.event_date)}</td>
                        <td className="px-6 py-3"><span className="badge badge-muted capitalize">{evt.event_type}</span></td>
                        <td className="px-6 py-3 font-medium">{evt.condition_name || "\u2014"}</td>
                        <td className="px-6 py-3">{evt.severity ? <span className={cn("badge", severityBadge[evt.severity])}>{evt.severity}</span> : "\u2014"}</td>
                        <td className="px-6 py-3 text-muted max-w-[200px] truncate">{evt.treatment_given || "\u2014"}</td>
                        <td className="px-6 py-3">{evt.outcome ? <span className="badge badge-muted capitalize">{evt.outcome}</span> : "\u2014"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {activeTab === "vaccinations" && (
          vaccinations.length === 0 ? (
            <EmptyState icon={Syringe} title="No vaccinations" description="Record a vaccination to track this animal's immunisation history" />
          ) : (
            <div className="card">
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["Date Given", "Vaccine", "Next Due", "Vet", "Batch #"].map((h) => (
                        <th key={h} className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vaccinations.map((v) => (
                      <tr key={v.vacc_id} className="border-b border-border/50 last:border-0">
                        <td className="px-6 py-3 text-muted">{formatDate(v.date_given)}</td>
                        <td className="px-6 py-3 font-medium">{v.vaccine_name}</td>
                        <td className="px-6 py-3 text-muted">{v.next_due_date ? formatDate(v.next_due_date) : "\u2014"}</td>
                        <td className="px-6 py-3 text-muted">{v.vet_name || "\u2014"}</td>
                        <td className="px-6 py-3 text-muted">{v.batch_number || "\u2014"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {activeTab === "breeding" && (
          breedingRecords.length === 0 ? (
            <EmptyState icon={HeartHandshake} title="No breeding records" description="Record breeding events to track this animal's reproductive history" />
          ) : (
            <div className="card">
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["Date", "Event", "Mate", "Sire Breed", "Notes"].map((h) => (
                        <th key={h} className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {breedingRecords.map((b) => (
                      <tr key={b.breeding_id} className="border-b border-border/50 last:border-0">
                        <td className="px-6 py-3 text-muted">{formatDate(b.event_date)}</td>
                        <td className="px-6 py-3"><span className={cn("badge", breedingBadge[b.event_type] ?? "badge-muted")}>{b.event_type}</span></td>
                        <td className="px-6 py-3 text-muted">{b.mate_tag || "\u2014"}</td>
                        <td className="px-6 py-3 text-muted">{b.sire_breed || "\u2014"}</td>
                        <td className="px-6 py-3 text-muted max-w-[200px] truncate">{b.notes || "\u2014"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {activeTab === "movements" && (
          movements.length === 0 ? (
            <EmptyState icon={Truck} title="No movements" description="Record movements to track this animal's location history" />
          ) : (
            <div className="card">
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["Date", "Type", "From", "To", "Permit #", "Notes"].map((h) => (
                        <th key={h} className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m) => (
                      <tr key={m.movement_id} className="border-b border-border/50 last:border-0">
                        <td className="px-6 py-3 text-muted">{formatDate(m.movement_date)}</td>
                        <td className="px-6 py-3"><span className="badge badge-muted capitalize">{m.movement_type}</span></td>
                        <td className="px-6 py-3 text-muted">{m.from_location}</td>
                        <td className="px-6 py-3 text-muted">{m.to_location}</td>
                        <td className="px-6 py-3 text-muted">{m.permit_number || "\u2014"}</td>
                        <td className="px-6 py-3 text-muted">{m.notes || "\u2014"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
