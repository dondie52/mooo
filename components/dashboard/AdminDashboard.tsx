"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import KpiCard from "@/components/dashboard/KpiCard";
import AdminFarmsTable, { type FarmRow } from "@/components/dashboard/AdminFarmsTable";
import AdminActivityFeed, { type ActivityRow } from "@/components/dashboard/AdminActivityFeed";
import AdminVetWorkload, { type VetWorkloadRow } from "@/components/dashboard/AdminVetWorkload";
import AdminQuickActions from "@/components/dashboard/AdminQuickActions";

type SystemStats = {
  total_users: number;
  total_farmers: number;
  total_vets: number;
  total_animals: number;
  avg_coverage_pct: number;
  active_alerts_7d: number;
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [farms, setFarms] = useState<FarmRow[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [vets, setVets] = useState<VetWorkloadRow[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();

        const rpc = supabase.rpc as any;
        const [statsRes, farmsRes, activityRes, vetsRes] = await Promise.all([
          rpc("get_admin_system_stats"),
          rpc("get_admin_all_farms"),
          rpc("get_admin_recent_activity", { lim: 15 }),
          rpc("get_admin_vet_workload"),
        ]);

        const { data: statsData } = statsRes as { data: SystemStats[] | SystemStats | null };
        if (statsData && Array.isArray(statsData) && statsData.length > 0) {
          setStats(statsData[0]);
        } else if (statsData && !Array.isArray(statsData)) {
          setStats(statsData);
        }

        const { data: farmsData } = farmsRes as { data: FarmRow[] | null };
        const { data: actData } = activityRes as { data: ActivityRow[] | null };
        const { data: vetsData } = vetsRes as { data: VetWorkloadRow[] | null };
        setFarms(farmsData || []);
        setActivities(actData || []);
        setVets(vetsData || []);
      } catch (err) {
        console.error("Admin dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-2 border-forest-mid border-t-transparent rounded-full" />
      </div>
    );
  }

  const coverageVariant: "default" | "warning" | "danger" =
    stats && stats.avg_coverage_pct < 60
      ? "danger"
      : stats && stats.avg_coverage_pct < 80
      ? "warning"
      : "default";

  const coverageBadge =
    stats && stats.avg_coverage_pct >= 80
      ? "Compliant"
      : "Below threshold";

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-forest-deep">
          System Overview
        </h1>
        <p className="text-sm text-muted mt-1">
          Admin dashboard — monitoring all farms, users, and compliance
        </p>
      </div>

      {/* Row 1 — KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Users"
          value={stats?.total_users ?? 0}
          sublabel={`${stats?.total_farmers ?? 0} farmers · ${stats?.total_vets ?? 0} vets`}
          href="/admin/users"
        />
        <KpiCard
          label="Total Active Animals"
          value={stats?.total_animals ?? 0}
          sublabel="Across all farms"
          href="/animals"
        />
        <KpiCard
          label="System Compliance"
          value={`${stats?.avg_coverage_pct ?? 0}%`}
          sublabel={coverageBadge}
          variant={coverageVariant}
        />
        <KpiCard
          label="Active Alerts"
          value={stats?.active_alerts_7d ?? 0}
          sublabel="Last 7 days"
          href="/alerts"
          variant={
            stats && stats.active_alerts_7d > 0 ? "warning" : "default"
          }
        />
      </div>

      {/* Row 2 — Farms compliance table */}
      <AdminFarmsTable farms={farms} />

      {/* Row 3 — Activity feed + Vet workload */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7">
          <AdminActivityFeed activities={activities} />
        </div>
        <div className="lg:col-span-5">
          <AdminVetWorkload vets={vets} />
        </div>
      </div>

      {/* Row 4 — Quick actions */}
      <AdminQuickActions />
    </div>
  );
}
