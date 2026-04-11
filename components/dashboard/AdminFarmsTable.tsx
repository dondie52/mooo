"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type FarmRow = {
  farmer_id: string;
  full_name: string;
  farm_name: string | null;
  district: string | null;
  animal_count: number;
  coverage_pct: number;
  overdue_count: number;
  assigned_vet_name: string | null;
  is_active: boolean;
};

interface AdminFarmsTableProps {
  farms: FarmRow[];
}

function CoverageDot({ pct }: { pct: number }) {
  const color =
    pct >= 80
      ? "bg-alert-green"
      : pct >= 50
      ? "bg-alert-amber"
      : "bg-alert-red";
  return <span className={cn("inline-block w-2 h-2 rounded-full", color)} />;
}

export default function AdminFarmsTable({ farms }: AdminFarmsTableProps) {
  if (farms.length === 0) {
    return (
      <div className="card">
        <h2 className="font-display text-lg font-semibold text-forest-deep mb-4">
          Farms Compliance Overview
        </h2>
        <p className="text-sm text-muted py-8 text-center">
          No farmers registered yet. Click &ldquo;Add User&rdquo; to create the
          first farmer account.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <h2 className="font-display text-lg font-semibold text-forest-deep mb-4 px-1">
        Farms Compliance Overview
      </h2>
      <div className="overflow-x-auto -mx-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Farmer
              </th>
              <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Farm
              </th>
              <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                District
              </th>
              <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted text-right">
                Animals
              </th>
              <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted text-right">
                Coverage
              </th>
              <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted text-right">
                Overdue
              </th>
              <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Assigned Vet
              </th>
              <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {farms.map((f) => (
              <tr
                key={f.farmer_id}
                className="hover:bg-earth-sand/40 transition-colors"
              >
                <td className="px-5 py-3 font-medium text-forest-deep whitespace-nowrap">
                  <Link
                    href={`/admin/farmers/${f.farmer_id}`}
                    className="hover:text-forest-accent transition-colors"
                  >
                    {f.full_name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-muted whitespace-nowrap">
                  {f.farm_name || "—"}
                </td>
                <td className="px-5 py-3 text-muted whitespace-nowrap">
                  {f.district || "—"}
                </td>
                <td className="px-5 py-3 text-right tabular-nums">
                  {f.animal_count}
                </td>
                <td className="px-5 py-3 text-right whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <CoverageDot pct={f.coverage_pct} />
                    {f.coverage_pct}%
                  </span>
                </td>
                <td
                  className={cn(
                    "px-5 py-3 text-right tabular-nums",
                    f.overdue_count > 0 && "text-alert-red font-medium"
                  )}
                >
                  {f.overdue_count}
                </td>
                <td className="px-5 py-3 text-muted whitespace-nowrap">
                  {f.assigned_vet_name || "—"}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={cn(
                      "badge text-[11px]",
                      f.is_active ? "badge-green" : "badge-red"
                    )}
                  >
                    {f.is_active ? "Active" : "Inactive"}
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
