"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Beef } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/database.types";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import StatusFilter from "@/components/ui/StatusFilter";
import EmptyState from "@/components/ui/EmptyState";

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Sold", value: "sold" },
  { label: "Deceased", value: "deceased" },
  { label: "Missing", value: "missing" },
];

const statusBadge: Record<string, string> = {
  active: "badge-green",
  sold: "badge-amber",
  deceased: "badge-red",
  missing: "badge-muted",
};

interface AnimalsClientProps {
  animals: Tables<"animals">[];
}

export default function AnimalsClient({ animals }: AnimalsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const filtered = animals.filter((a) => {
    const matchesStatus = !status || a.status === status;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      a.tag_number.toLowerCase().includes(q) ||
      a.breed.toLowerCase().includes(q) ||
      (a.location ?? "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const counts = {
    total: animals.length,
    active: animals.filter((a) => a.status === "active").length,
    sold: animals.filter((a) => a.status === "sold").length,
    deceased: animals.filter((a) => a.status === "deceased").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Animals"
        description="Manage your herd"
        action={{ label: "Register Animal", href: "/animals/new", icon: Plus }}
      />

      {/* Stats bar */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Total", value: counts.total, cls: "bg-earth-sand text-forest-deep" },
          { label: "Active", value: counts.active, cls: "bg-green-50 text-alert-green" },
          { label: "Sold", value: counts.sold, cls: "bg-amber-50 text-gold-dark" },
          { label: "Deceased", value: counts.deceased, cls: "bg-red-50 text-alert-red" },
        ].map((s) => (
          <div key={s.label} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", s.cls)}>
            {s.label}: {s.value}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by tag, breed, location..." />
        </div>
        <StatusFilter value={status} onChange={setStatus} options={statusOptions} />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Beef}
          title="No animals found"
          description={search || status ? "Try adjusting your filters" : "Register your first animal to get started"}
          action={!search && !status ? { label: "Register Animal", href: "/animals/new" } : undefined}
        />
      ) : (
        <div className="card">
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <caption className="sr-only">List of animals with tag, breed, location, and status</caption>
              <thead>
                <tr className="border-b border-border">
                  {["Tag", "Breed", "Gender", "Location", "Status", "Acquired"].map((h) => (
                    <th key={h} className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((animal) => (
                  <tr key={animal.animal_id} onClick={() => router.push(`/animals/detail?id=${animal.animal_id}`)} className="border-b border-border/50 last:border-0 hover:bg-earth-cream/50 transition-colors cursor-pointer">
                    <td className="px-6 py-3">
                      <Link href={`/animals/detail?id=${animal.animal_id}`} className="font-medium text-forest-deep hover:text-forest-accent">
                        {animal.tag_number}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-muted">{animal.breed}</td>
                    <td className="px-6 py-3 text-muted capitalize">{animal.gender}</td>
                    <td className="px-6 py-3 text-muted">{animal.location || "\u2014"}</td>
                    <td className="px-6 py-3">
                      <span className={cn("badge", statusBadge[animal.status] ?? "badge-muted")}>
                        {animal.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-muted">{formatDate(animal.acquired_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
