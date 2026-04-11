"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";

type Animal = Tables<"animals">;

interface RecentAnimalsTableProps {
  animals: Animal[];
}

function statusBadge(status: string) {
  switch (status) {
    case "active":
      return "badge-green";
    case "sold":
      return "badge-amber";
    case "deceased":
      return "badge-red";
    default:
      return "badge-muted";
  }
}

export default function RecentAnimalsTable({
  animals,
}: RecentAnimalsTableProps) {
  const router = useRouter();

  if (animals.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-sm text-muted">No animals registered yet</p>
        <Link href="/animals/new" className="btn-primary mt-4 inline-flex">
          Register your first animal
        </Link>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold">Recent Animals</h3>
        <Link
          href="/animals"
          className="text-sm text-forest-accent hover:text-forest-mid font-medium flex items-center gap-1"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="overflow-x-auto -mx-6">
        <table className="w-full text-sm">
          <caption className="sr-only">Recently registered animals with tag, breed, location, and status</caption>
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Tag
              </th>
              <th className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Breed
              </th>
              <th className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Location
              </th>
              <th className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {animals.map((animal) => (
              <tr
                key={animal.animal_id}
                onClick={() => router.push(`/animals/${animal.animal_id}`)}
                className="border-b border-border/50 last:border-0 hover:bg-earth-cream/50 transition-colors cursor-pointer"
              >
                <td className="px-6 py-3 font-medium text-forest-deep">
                  {animal.tag_number}
                </td>
                <td className="px-6 py-3 text-muted">{animal.breed}</td>
                <td className="px-6 py-3 text-muted">
                  {animal.location || "—"}
                </td>
                <td className="px-6 py-3">
                  <span className={cn("badge", statusBadge(animal.status))}>
                    {animal.status}
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
