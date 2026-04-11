import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

type CoverageTrendRow = { month: string; coverage_pct: number };
type CompositionRow = { breed: string; count: number };
type DiseaseFreqRow = { condition_name: string; count: number };
type RiskRow = {
  animal_id: string;
  tag_number: string;
  breed: string;
  risk_level: "high" | "medium" | "low";
  reason: string;
};
type CalvingRow = { animal_id: string; tag_number: string; expected_date: string };
import KpiCard from "@/components/dashboard/KpiCard";
import BmcCoverageCard from "@/components/dashboard/BmcCoverageCard";
import CriticalAlertCard from "@/components/dashboard/CriticalAlertCard";
import PredictiveRiskPanel from "@/components/dashboard/PredictiveRiskPanel";
import RecentAnimalsTable from "@/components/dashboard/RecentAnimalsTable";
import VaccinationTrendChart from "@/components/charts/VaccinationTrendChart";
import HerdCompositionChart from "@/components/charts/HerdCompositionChart";
import DiseaseFrequencyChart from "@/components/charts/DiseaseFrequencyChart";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fire all queries concurrently (promises start immediately)
  const animalsCountP = supabase
    .from("animals")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");
  const overdueCountP = supabase
    .from("vaccinations")
    .select("*", { count: "exact", head: true })
    .lt("next_due_date", new Date().toISOString());
  const coverageTrendP = supabase.rpc("get_vaccination_coverage_trend");
  const compositionP = supabase.rpc("get_herd_composition");
  const diseaseFreqP = supabase.rpc("get_disease_frequency");
  const riskP = supabase.rpc("get_predictive_risk");
  const calvingsP = supabase.rpc("get_upcoming_calvings");
  const recentAnimalsP = supabase
    .from("animals")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(5);

  // Await all in parallel
  const { count: totalAnimals } = await animalsCountP;
  const { count: overdueCount } = await overdueCountP;
  const { data: coverageTrend } = await coverageTrendP as { data: CoverageTrendRow[] | null };
  const { data: composition } = await compositionP as { data: CompositionRow[] | null };
  const { data: diseaseFreq } = await diseaseFreqP as { data: DiseaseFreqRow[] | null };
  const { data: riskAnimals } = await riskP as { data: RiskRow[] | null };
  const { data: calvings } = await calvingsP as { data: CalvingRow[] | null };
  const { data: recentAnimals } = await recentAnimalsP;

  const safeTotal = totalAnimals ?? 0;
  const safeOverdue = overdueCount ?? 0;
  const safeCalvings = (calvings ?? []).length;
  const trendData = coverageTrend ?? [];

  // Compute coverage % from the most recent month in the trend
  const latestCoverage =
    trendData.length > 0
      ? Number(trendData[trendData.length - 1].coverage_pct)
      : 0;

  const hasCriticalAlert = safeOverdue > 3 || latestCoverage < 80;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">
          Dashboard
        </h1>
        <p className="text-sm text-muted mt-1">
          Herd overview and health analytics
        </p>
      </div>

      {/* Row 0: Critical alert (conditional) */}
      {hasCriticalAlert && (
        <CriticalAlertCard
          title="Vaccination Compliance Warning"
          message={`${safeOverdue} animals have overdue vaccinations. Your BMC compliance may be affected if not addressed within 7 days.`}
          action={{ label: "View overdue", href: "/vaccinations" }}
        />
      )}

      {/* Row 1: KPI cards */}
      <div className="bento-grid stagger-children">
        <div className="bento-span-3">
          <KpiCard
            label="Total Active Animals"
            value={safeTotal}
            sublabel="Across all locations"
            href="/animals"
          />
        </div>
        <div className="bento-span-3">
          <BmcCoverageCard coveragePct={latestCoverage} href="/vaccinations" />
        </div>
        <div className="bento-span-3">
          <KpiCard
            label="Overdue Vaccinations"
            value={safeOverdue}
            sublabel="Requires immediate action"
            variant="danger"
            href="/vaccinations"
          />
        </div>
        <div className="bento-span-3">
          <KpiCard
            label="Upcoming Calvings"
            value={safeCalvings}
            sublabel="Next 30 days"
            variant="warning"
            href="/breeding"
          />
        </div>
      </div>

      {/* Row 2: Vaccination trend (8 cols) + Herd composition (4 cols) */}
      <div className="bento-grid stagger-children">
        <div className="bento-span-8">
          <VaccinationTrendChart data={coverageTrend ?? []} />
        </div>
        <div className="bento-span-4">
          <HerdCompositionChart data={composition ?? []} />
        </div>
      </div>

      {/* Row 3: Disease frequency + Predictive risk */}
      <div className="bento-grid stagger-children">
        <div className="bento-span-6">
          <DiseaseFrequencyChart data={diseaseFreq ?? []} />
        </div>
        <div className="bento-span-6">
          <PredictiveRiskPanel animals={riskAnimals ?? []} />
        </div>
      </div>

      {/* Row 4: Recent animals table */}
      <div className="animate-fade-up">
        <RecentAnimalsTable animals={recentAnimals ?? []} />
      </div>
    </div>
  );
}
