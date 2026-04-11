"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import KpiCard from "@/components/dashboard/KpiCard";
import CriticalAlertCard from "@/components/dashboard/CriticalAlertCard";
import FarmsComplianceTable from "@/components/dashboard/FarmsComplianceTable";
import ActiveCasesPanel from "@/components/dashboard/ActiveCasesPanel";
import UpcomingVaccinationsPanel from "@/components/dashboard/UpcomingVaccinationsPanel";
import VetRecentEventsTable from "@/components/dashboard/VetRecentEventsTable";
import DiseaseFrequencyChart from "@/components/charts/DiseaseFrequencyChart";

type VetFarmerRow = {
  farmer_id: string;
  full_name: string;
  farm_name: string | null;
  district: string | null;
  animal_count: number;
  coverage_pct: number;
  overdue_count: number;
  last_visit_date: string | null;
};

type ActiveCaseRow = {
  event_id: string;
  animal_id: string;
  tag_number: string;
  condition_name: string | null;
  severity: string | null;
  event_date: string;
  farmer_name: string;
  outcome: string;
};

type UpcomingVaccRow = {
  vacc_id: string;
  animal_id: string;
  tag_number: string;
  vaccine_name: string;
  next_due_date: string;
  farmer_name: string;
};

export default function VetDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [farmers, setFarmers] = useState<VetFarmerRow[]>([]);
  const [activeCases, setActiveCases] = useState<ActiveCaseRow[]>([]);
  const [upcomingVaccs, setUpcomingVaccs] = useState<UpcomingVaccRow[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [diseaseFreq, setDiseaseFreq] = useState<{ condition_name: string; count: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const [farmersRes, casesRes, vaccsRes, eventsRes, diseaseRes] = await Promise.all([
        (supabase.rpc as any)("get_vet_assigned_farmers", { vet_uuid: user.id }),
        (supabase.rpc as any)("get_vet_active_cases", { vet_uuid: user.id }),
        (supabase.rpc as any)("get_vet_upcoming_vaccinations", { vet_uuid: user.id }),
        supabase
          .from("health_events")
          .select("*, animals(tag_number, owner_id)")
          .eq("logged_by", user.id)
          .order("event_date", { ascending: false })
          .limit(10),
        (supabase.rpc as any)("get_vet_disease_frequency", { vet_uuid: user.id }),
      ]);

      const { data: farmersData } = farmersRes as {
        data: VetFarmerRow[] | null;
      };
      const { data: casesData } = casesRes as {
        data: ActiveCaseRow[] | null;
      };
      const { data: vaccsData } = vaccsRes as {
        data: UpcomingVaccRow[] | null;
      };

      const { data: diseaseData } = diseaseRes as { data: { condition_name: string; count: number }[] | null };

      setFarmers(farmersData ?? []);
      setActiveCases(casesData ?? []);
      setUpcomingVaccs(vaccsData ?? []);
      setRecentEvents(eventsRes.data ?? []);
      setDiseaseFreq(diseaseData ?? []);
      setLoading(false);
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

  // KPI derivation
  const assignedFarmers = farmers.length;
  const animalsUnderCare = farmers.reduce(
    (sum, f) => sum + f.animal_count,
    0
  );
  const activeCasesCount = activeCases.length;
  const vaccinationsDue = upcomingVaccs.length;

  // Critical alert: any farmer below 80% coverage with overdue vaccinations
  const hasCriticalAlert = farmers.some(
    (f) => f.coverage_pct < 80 && f.overdue_count > 0
  );

  // Build farmer name map for recent events
  const farmerMap = new Map(farmers.map((f) => [f.farmer_id, f.full_name]));
  const recentFormatted = recentEvents.map((e) => ({
    event_id: e.event_id,
    event_date: e.event_date,
    animal_id: e.animal_id,
    tag_number: (e.animals as any)?.tag_number ?? "Unknown",
    farmer_name:
      farmerMap.get((e.animals as any)?.owner_id) ?? "Unknown",
    condition_name: e.condition_name,
    outcome: e.outcome,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">
          Vet Dashboard
        </h1>
        <p className="text-sm text-muted mt-1">
          Overview of your assigned farms
        </p>
      </div>

      {hasCriticalAlert && (
        <CriticalAlertCard
          title="Farmer Compliance Warning"
          message="One or more assigned farmers have overdue vaccinations and are below the 80% BMC compliance threshold. Immediate attention required."
          action={{ label: "View farmers", href: "/farmers" }}
        />
      )}

      <div className="bento-grid stagger-children">
        <div className="bento-span-3">
          <KpiCard
            label="Assigned Farmers"
            value={assignedFarmers}
            sublabel="Under your care"
            href="/farmers"
          />
        </div>
        <div className="bento-span-3">
          <KpiCard
            label="Animals Under Care"
            value={animalsUnderCare}
            sublabel="Across all farms"
            href="/animals"
          />
        </div>
        <div className="bento-span-3">
          <KpiCard
            label="Active Cases"
            value={activeCasesCount}
            sublabel="Ongoing health events"
            variant={activeCasesCount > 0 ? "warning" : "default"}
            href="/health"
          />
        </div>
        <div className="bento-span-3">
          <KpiCard
            label="Vaccinations Due"
            value={vaccinationsDue}
            sublabel="Upcoming schedule"
            variant={vaccinationsDue > 5 ? "danger" : "default"}
            href="/vaccinations"
          />
        </div>
      </div>

      <div className="animate-fade-up">
        <FarmsComplianceTable farmers={farmers} />
      </div>

      <div className="bento-grid stagger-children">
        <div className="bento-span-6">
          <DiseaseFrequencyChart data={diseaseFreq} />
        </div>
        <div className="bento-span-6">
          <ActiveCasesPanel cases={activeCases} />
        </div>
      </div>

      <div className="bento-grid stagger-children">
        <div className="bento-span-6">
          <UpcomingVaccinationsPanel vaccinations={upcomingVaccs} />
        </div>
        <div className="bento-span-6">
          <VetRecentEventsTable events={recentFormatted} />
        </div>
      </div>
    </div>
  );
}
