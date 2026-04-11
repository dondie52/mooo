import Link from "next/link";
import { cn } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";

interface RiskAnimal {
  animal_id?: string;
  tag_number: string;
  breed: string;
  risk_level: "high" | "medium" | "low";
  reason: string;
}

interface PredictiveRiskPanelProps {
  animals: RiskAnimal[];
}

const riskBadge = {
  high: "badge-red",
  medium: "badge-amber",
  low: "badge-green",
} as const;

export default function PredictiveRiskPanel({
  animals,
}: PredictiveRiskPanelProps) {
  if (animals.length === 0) {
    return (
      <div className="card h-full flex flex-col items-center justify-center text-center py-12">
        <ShieldAlert className="w-10 h-10 text-muted/40 mb-3" />
        <p className="text-sm text-muted">No risk predictions yet</p>
        <p className="text-xs text-muted/60 mt-1">
          Log vaccinations and health events to enable risk scoring
        </p>
      </div>
    );
  }

  return (
    <div className="card h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold">Predictive Risk</h3>
        <ShieldAlert className="w-5 h-5 text-muted" />
      </div>
      <div className="space-y-3">
        {animals.map((animal) => {
          const row = (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-earth-cream/60 transition-colors hover:bg-earth-sand/80">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-forest-deep">
                    {animal.tag_number}
                  </span>
                  <span className={cn("badge", riskBadge[animal.risk_level])}>
                    {animal.risk_level}
                  </span>
                </div>
                <div className="text-xs text-muted mt-0.5">{animal.breed}</div>
              </div>
              <div className="text-xs text-muted text-right max-w-[180px]">
                {animal.reason}
              </div>
            </div>
          );
          const key = animal.animal_id ?? animal.tag_number;
          if (animal.animal_id) {
            return (
              <Link
                key={key}
                href={`/animals/detail?id=${animal.animal_id}`}
                className="block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-accent"
              >
                {row}
              </Link>
            );
          }
          return <div key={key}>{row}</div>;
        })}
      </div>
    </div>
  );
}
