import Link from "next/link";
import { cn } from "@/lib/utils";

interface BmcCoverageCardProps {
  coveragePct: number;
  href?: string;
}

const BMC_THRESHOLD = 80;

export default function BmcCoverageCard({
  coveragePct,
  href = "/vaccinations",
}: BmcCoverageCardProps) {
  const compliant = coveragePct >= BMC_THRESHOLD;

  const shellClass = cn(
    "card block h-full transition-shadow card-hover cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-accent",
    compliant
      ? "border-l-4 border-l-alert-green"
      : "border-l-4 border-l-alert-red"
  );

  const inner = (
    <>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-2">
        Vaccination Coverage
      </div>
      <div className="font-display text-4xl font-semibold text-forest-deep leading-none mb-3">
        {coveragePct}%
      </div>

      {/* Progress bar */}
      <div className="relative h-2.5 bg-earth-sand rounded-full overflow-hidden mb-2">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
            compliant ? "bg-alert-green" : "bg-alert-red"
          )}
          style={{ width: `${Math.min(coveragePct, 100)}%` }}
        />
        {/* 80% threshold marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-forest-deep/40"
          style={{ left: `${BMC_THRESHOLD}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span
          className={cn(
            "badge",
            compliant ? "badge-green" : "badge-red"
          )}
        >
          {compliant ? "Compliant" : "Below minimum"}
        </span>
        <span className="text-[10px] text-muted">80% threshold</span>
      </div>
    </>
  );

  return (
    <Link href={href} className={shellClass}>
      {inner}
    </Link>
  );
}
