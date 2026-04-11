"use client";

import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";
import { ClipboardCheck } from "lucide-react";

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

interface FarmsComplianceTableProps {
  farmers: FarmerRow[];
}

function coverageDot(pct: number) {
  if (pct >= 80) return "bg-alert-green";
  if (pct >= 60) return "bg-gold";
  return "bg-alert-red";
}

export default function FarmsComplianceTable({
  farmers,
}: FarmsComplianceTableProps) {
  if (farmers.length === 0) {
    return (
      <div className="card text-center py-12">
        <ClipboardCheck className="w-10 h-10 text-muted/40 mx-auto mb-3" />
        <p className="text-sm text-muted">No assigned farmers yet</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold">
          Farms Compliance Overview
        </h3>
        <ClipboardCheck className="w-5 h-5 text-muted" />
      </div>
      <div className="overflow-x-auto -mx-6">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Compliance overview for assigned farmers
          </caption>
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Farmer
              </th>
              <th className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Farm
              </th>
              <th className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
                District
              </th>
              <th className="text-right px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Animals
              </th>
              <th className="text-right px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
                BMC Coverage
              </th>
              <th className="text-right px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Overdue
              </th>
              <th className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Last Visit
              </th>
            </tr>
          </thead>
          <tbody>
            {farmers.map((farmer) => (
              <tr
                key={farmer.farmer_id}
                className="border-b border-border/50 last:border-0 hover:bg-earth-cream/50 transition-colors"
              >
                <td className="px-6 py-3">
                  <Link
                    href={`/animals?farmer=${farmer.farmer_id}`}
                    className="font-medium text-forest-deep hover:text-forest-accent transition-colors"
                  >
                    {farmer.full_name}
                  </Link>
                </td>
                <td className="px-6 py-3 text-muted">
                  {farmer.farm_name || "—"}
                </td>
                <td className="px-6 py-3 text-muted">
                  {farmer.district || "—"}
                </td>
                <td className="px-6 py-3 text-right font-medium">
                  {farmer.animal_count}
                </td>
                <td className="px-6 py-3 text-right">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        coverageDot(farmer.coverage_pct)
                      )}
                    />
                    <span className="font-medium">
                      {farmer.coverage_pct.toFixed(0)}%
                    </span>
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  {farmer.overdue_count > 0 ? (
                    <span className="badge badge-red">
                      {farmer.overdue_count}
                    </span>
                  ) : (
                    <span className="text-muted">0</span>
                  )}
                </td>
                <td className="px-6 py-3 text-muted">
                  {farmer.last_visit_date
                    ? formatDate(farmer.last_visit_date)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
