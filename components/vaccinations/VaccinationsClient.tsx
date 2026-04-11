"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Syringe, Plus } from "lucide-react";
import { cn, formatDate, daysFromNow } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/database.types";
import Tabs from "@/components/ui/Tabs";
import EmptyState from "@/components/ui/EmptyState";
import RecordVaccinationModal from "@/components/vaccinations/RecordVaccinationModal";

interface VaccinationsClientProps {
  vaccinations: (Tables<"vaccinations"> & { animals: { tag_number: string } | null })[];
  animals: Pick<Tables<"animals">, "animal_id" | "tag_number" | "breed" | "status">[];
}

export default function VaccinationsClient({ vaccinations, animals }: VaccinationsClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const overdue = vaccinations
    .filter((v) => v.next_due_date && v.next_due_date < today)
    .sort((a, b) => (a.next_due_date ?? "").localeCompare(b.next_due_date ?? ""));

  const upcoming = vaccinations
    .filter((v) => {
      if (!v.next_due_date || v.next_due_date < today) return false;
      const days = daysFromNow(v.next_due_date);
      return days <= 14;
    })
    .sort((a, b) => (a.next_due_date ?? "").localeCompare(b.next_due_date ?? ""));

  const allRecords = [...vaccinations].sort(
    (a, b) => new Date(b.date_given).getTime() - new Date(a.date_given).getTime()
  );

  const tabList = [
    { key: "overdue", label: "Overdue", count: overdue.length },
    { key: "upcoming", label: "Upcoming", count: upcoming.length },
    { key: "all", label: "All Records", count: allRecords.length },
  ];

  const [activeTab, setActiveTab] = useState("overdue");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">Vaccinations</h1>
          <p className="text-sm text-muted mt-1">Track and manage vaccination schedules</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary shrink-0">
          <Plus className="w-4 h-4" /> Record Vaccination
        </button>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabList} activeTab={activeTab} onChange={setActiveTab} />

      {/* Overdue */}
      {activeTab === "overdue" && (
        overdue.length === 0 ? (
          <EmptyState icon={Syringe} title="No overdue vaccinations" description="All vaccinations are up to date" />
        ) : (
          <div className="card border-l-4 border-l-alert-red">
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm">
                <caption className="sr-only">Overdue vaccinations requiring immediate attention</caption>
                <thead>
                  <tr className="border-b border-border">
                    {["Animal", "Vaccine", "Date Given", "Was Due", "Days Overdue"].map((h) => (
                      <th key={h} className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {overdue.map((v) => {
                    const days = Math.abs(daysFromNow(v.next_due_date!));
                    return (
                      <tr key={v.vacc_id} onClick={() => router.push(`/animals/${v.animal_id}`)} className="border-b border-border/50 last:border-0 hover:bg-earth-cream/50 transition-colors cursor-pointer">
                        <td className="px-6 py-3">
                          <Link href={`/animals/${v.animal_id}`} className="font-medium text-forest-deep hover:text-forest-accent">
                            {v.animals?.tag_number ?? "Unknown"}
                          </Link>
                        </td>
                        <td className="px-6 py-3 font-medium">{v.vaccine_name}</td>
                        <td className="px-6 py-3 text-muted">{formatDate(v.date_given)}</td>
                        <td className="px-6 py-3 text-muted">{formatDate(v.next_due_date!)}</td>
                        <td className="px-6 py-3">
                          <span className="badge badge-red">{days} days</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Upcoming */}
      {activeTab === "upcoming" && (
        upcoming.length === 0 ? (
          <EmptyState icon={Syringe} title="No upcoming vaccinations" description="No vaccinations due in the next 14 days" />
        ) : (
          <div className="card border-l-4 border-l-gold">
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm">
                <caption className="sr-only">Upcoming vaccinations due within 14 days</caption>
                <thead>
                  <tr className="border-b border-border">
                    {["Animal", "Vaccine", "Date Given", "Due Date", "Due In"].map((h) => (
                      <th key={h} className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((v) => {
                    const days = daysFromNow(v.next_due_date!);
                    return (
                      <tr key={v.vacc_id} onClick={() => router.push(`/animals/${v.animal_id}`)} className="border-b border-border/50 last:border-0 hover:bg-earth-cream/50 transition-colors cursor-pointer">
                        <td className="px-6 py-3">
                          <Link href={`/animals/${v.animal_id}`} className="font-medium text-forest-deep hover:text-forest-accent">
                            {v.animals?.tag_number ?? "Unknown"}
                          </Link>
                        </td>
                        <td className="px-6 py-3 font-medium">{v.vaccine_name}</td>
                        <td className="px-6 py-3 text-muted">{formatDate(v.date_given)}</td>
                        <td className="px-6 py-3 text-muted">{formatDate(v.next_due_date!)}</td>
                        <td className="px-6 py-3">
                          <span className="badge badge-amber">{days} days</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* All Records */}
      {activeTab === "all" && (
        allRecords.length === 0 ? (
          <EmptyState icon={Syringe} title="No vaccination records" description="Record your first vaccination to start tracking" />
        ) : (
          <div className="card">
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm">
                <caption className="sr-only">All vaccination records</caption>
                <thead>
                  <tr className="border-b border-border">
                    {["Date Given", "Animal", "Vaccine", "Next Due", "Vet", "Batch #"].map((h) => (
                      <th key={h} className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allRecords.map((v) => (
                    <tr key={v.vacc_id} onClick={() => router.push(`/animals/${v.animal_id}`)} className="border-b border-border/50 last:border-0 hover:bg-earth-cream/50 transition-colors cursor-pointer">
                      <td className="px-6 py-3 text-muted whitespace-nowrap">{formatDate(v.date_given)}</td>
                      <td className="px-6 py-3">
                        <Link href={`/animals/${v.animal_id}`} className="font-medium text-forest-deep hover:text-forest-accent">
                          {v.animals?.tag_number ?? "Unknown"}
                        </Link>
                      </td>
                      <td className="px-6 py-3 font-medium">{v.vaccine_name}</td>
                      <td className="px-6 py-3 text-muted">{v.next_due_date ? formatDate(v.next_due_date) : "—"}</td>
                      <td className="px-6 py-3 text-muted">{v.vet_name || "—"}</td>
                      <td className="px-6 py-3 text-muted">{v.batch_number || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      <RecordVaccinationModal open={modalOpen} onClose={() => setModalOpen(false)} animals={animals} />
    </div>
  );
}
