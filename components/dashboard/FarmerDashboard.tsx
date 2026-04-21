"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import KpiCard from "@/components/dashboard/KpiCard";
import BmcCoverageCard from "@/components/dashboard/BmcCoverageCard";
import CriticalAlertCard from "@/components/dashboard/CriticalAlertCard";
import PredictiveRiskPanel from "@/components/dashboard/PredictiveRiskPanel";
import RecentAnimalsTable from "@/components/dashboard/RecentAnimalsTable";
import VaccinationTrendChart from "@/components/charts/VaccinationTrendChart";
import HerdCompositionChart from "@/components/charts/HerdCompositionChart";
import DiseaseFrequencyChart from "@/components/charts/DiseaseFrequencyChart";

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

export default function FarmerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [totalAnimals, setTotalAnimals] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [currentCoverage, setCurrentCoverage] = useState(0);
  const [coverageTrend, setCoverageTrend] = useState<CoverageTrendRow[]>([]);
  const [composition, setComposition] = useState<CompositionRow[]>([]);
  const [diseaseFreq, setDiseaseFreq] = useState<DiseaseFreqRow[]>([]);
  const [riskAnimals, setRiskAnimals] = useState<RiskRow[]>([]);
  const [calvingsCount, setCalvingsCount] = useState(0);
  const [recentAnimals, setRecentAnimals] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        const [
          { count: animals },
          { count: overdue },
          { data: coverage },
          { data: trend },
          { data: comp },
          { data: disease },
          { data: risk },
          { data: calvings },
          { data: recent },
        ] = await Promise.all([
          supabase.from("animals").select("*", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("vaccinations").select("*", { count: "exact", head: true }).lt("next_due_date", new Date().toISOString()),
          supabase.rpc("get_farm_coverage", { farmer_uuid: user.id }),
          supabase.rpc("get_vaccination_coverage_trend"),
          supabase.rpc("get_herd_composition"),
          supabase.rpc("get_disease_frequency"),
          supabase.rpc("get_predictive_risk"),
          supabase.rpc("get_upcoming_calvings"),
          supabase.from("animals").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(5),
        ]);

        setTotalAnimals(animals ?? 0);
        setOverdueCount(overdue ?? 0);
        setCurrentCoverage(typeof coverage === "number" ? coverage : 0);
        setCoverageTrend((trend as CoverageTrendRow[] | null) ?? []);
        setComposition((comp as CompositionRow[] | null) ?? []);
        setDiseaseFreq((disease as DiseaseFreqRow[] | null) ?? []);
        setRiskAnimals((risk as RiskRow[] | null) ?? []);
        setCalvingsCount((calvings as any[] | null)?.length ?? 0);
        setRecentAnimals(recent ?? []);
      } catch (err) {
        console.error("Farmer dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-2 border-forest-mid border-t-transparent rounded-full" />
      </div>
    );
  }

  const hasCriticalAlert = overdueCount > 3 || currentCoverage < 80;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted mt-1">Herd overview and health analytics</p>
      </div>

      {hasCriticalAlert && (
        <CriticalAlertCard
          title="Vaccination Compliance Warning"
          message={`${overdueCount} animals have overdue vaccinations. Your compliance may be affected if not addressed within 7 days.`}
          action={{ label: "View overdue", href: "/vaccinations" }}
        />
      )}

      <div className="bento-grid stagger-children">
        <div className="bento-span-3">
          <KpiCard label="Total Active Animals" value={totalAnimals} sublabel="Across all locations" href="/animals" />
        </div>
        <div className="bento-span-3">
          <BmcCoverageCard coveragePct={currentCoverage} href="/vaccinations" />
        </div>
        <div className="bento-span-3">
          <KpiCard label="Overdue Vaccinations" value={overdueCount} sublabel="Requires immediate action" variant="danger" href="/vaccinations" />
        </div>
        <div className="bento-span-3">
          <KpiCard label="Upcoming Calvings" value={calvingsCount} sublabel="Next 30 days" variant="warning" href="/breeding" />
        </div>
      </div>

      <div className="bento-grid stagger-children">
        <div className="bento-span-8">
          <VaccinationTrendChart data={coverageTrend} />
        </div>
        <div className="bento-span-4">
          <HerdCompositionChart data={composition} />
        </div>
      </div>

      <div className="bento-grid stagger-children">
        <div className="bento-span-6">
          <DiseaseFrequencyChart data={diseaseFreq} />
        </div>
        <div className="bento-span-6">
          <PredictiveRiskPanel animals={riskAnimals} />
        </div>
      </div>

      <div className="animate-fade-up">
        <RecentAnimalsTable animals={recentAnimals} />
      </div>
    </div>
  );
}
