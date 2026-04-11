"use client";

import { useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import SearchInput from "@/components/ui/SearchInput";
import EmptyState from "@/components/ui/EmptyState";

interface FarmerRow {
  farmer_id: string;
  full_name: string;
  farm_name: string | null;
  district: string | null;
  animal_count: number;
  coverage_pct: number;
  overdue_count: number;
  last_visit_date: string | null;
}

interface FarmersClientProps {
  farmers: FarmerRow[];
}

function coverageDot(pct: number) {
  if (pct >= 80) return "bg-alert-green";
  if (pct >= 60) return "bg-gold";
  return "bg-alert-red";
}

export default function FarmersClient({ farmers }: FarmersClientProps) {
  const [search, setSearch] = useState("");

  const filtered = farmers.filter((f) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      f.full_name.toLowerCase().includes(q) ||
      (f.farm_name ?? "").toLowerCase().includes(q) ||
      (f.district ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">Assigned Farmers</h1>
        <p className="text-sm text-muted mt-1">
          {farmers.length} farmer{farmers.length !== 1 ? "s" : ""} under your care
        </p>
      </div>

      <div className="max-w-md">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, farm, or district..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No farmers found"
          description={search ? "Try adjusting your search" : "No farmers have been assigned to you yet"}
        />
      ) : (
        <div className="card">
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Farmer", "Farm", "District", "Animals", "BMC Coverage", "Overdue", "Last Visit"].map((h) => (
                    <th key={h} className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr key={f.farmer_id} className="border-b border-border/50 last:border-0 hover:bg-earth-cream/50 transition-colors">
                    <td className="px-6 py-3">
                      <Link href={`/animals?farmer=${f.farmer_id}`} className="font-medium text-forest-deep hover:text-forest-accent">
                        {f.full_name}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-muted">{f.farm_name || "—"}</td>
                    <td className="px-6 py-3 text-muted">{f.district || "—"}</td>
                    <td className="px-6 py-3 font-medium">{f.animal_count}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full shrink-0", coverageDot(f.coverage_pct))} />
                        <span className="font-medium">{f.coverage_pct}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      {f.overdue_count > 0 ? (
                        <span className="badge badge-red">{f.overdue_count}</span>
                      ) : (
                        <span className="text-muted">0</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-muted whitespace-nowrap">
                      {f.last_visit_date ? formatDate(f.last_visit_date) : "—"}
                    </td>
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
