"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import KpiCard from "@/components/dashboard/KpiCard";
import AdminFarmsTable, { type FarmRow } from "@/components/dashboard/AdminFarmsTable";
import AdminActivityFeed, { type ActivityRow } from "@/components/dashboard/AdminActivityFeed";
import AdminAlertsExceptions, { type AlertRow } from "@/components/dashboard/AdminAlertsExceptions";
import AdminQuickActions from "@/components/dashboard/AdminQuickActions";

type SystemStats = {
  total_users: number;
  total_farmers: number;
  total_vets: number;
  total_animals: number;
  avg_coverage_pct: number;
  active_alerts_7d: number;
};

type AlertWithFarmer = {
  alert_id: string;
  title: string;
  severity: "info" | "warning" | "critical";
  created_at: string;
  profiles: { full_name: string | null } | null;
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [farms, setFarms] = useState<FarmRow[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [diseaseEventsThisMonth, setDiseaseEventsThisMonth] = useState(0);
  const [overdueSystemWide, setOverdueSystemWide] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const rpcErrors: string[] = [];

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const today = new Date().toISOString();

        const [
          statsRes,
          farmsRes,
          activityRes,
          alertsRes,
          diseaseRes,
          overdueRes,
        ] = await Promise.all([
          supabase.rpc("get_admin_system_stats"),
          supabase.rpc("get_admin_all_farms"),
          supabase.rpc("get_admin_recent_activity", { lim: 15 }),
          supabase
            .from("alerts")
            .select("alert_id, title, severity, created_at, profiles:user_id(full_name)")
            .in("severity", ["warning", "critical"])
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("health_events")
            .select("*", { count: "exact", head: true })
            .gte("event_date", startOfMonth.toISOString().slice(0, 10)),
          supabase
            .from("vaccinations")
            .select("*", { count: "exact", head: true })
            .lt("next_due_date", today),
        ]);

        if (statsRes.error) {
          console.error("get_admin_system_stats error:", statsRes.error);
          rpcErrors.push(`System stats: ${statsRes.error.message}`);
        }
        if (farmsRes.error) {
          console.error("get_admin_all_farms error:", farmsRes.error);
          rpcErrors.push(`Farms data: ${farmsRes.error.message}`);
        }
        if (activityRes.error) {
          console.error("get_admin_recent_activity error:", activityRes.error);
          rpcErrors.push(`Activity feed: ${activityRes.error.message}`);
        }
        if (alertsRes.error) {
          console.error("alerts query error:", alertsRes.error);
          rpcErrors.push(`Alerts & exceptions: ${alertsRes.error.message}`);
        }

        if (rpcErrors.length > 0) setErrors(rpcErrors);

        const { data: statsData } = statsRes as { data: SystemStats[] | SystemStats | null };
        if (statsData && Array.isArray(statsData) && statsData.length > 0) {
          setStats(statsData[0]);
        } else if (statsData && !Array.isArray(statsData)) {
          setStats(statsData);
        }

        const { data: farmsData } = farmsRes as { data: FarmRow[] | null };
        const { data: actData } = activityRes as { data: ActivityRow[] | null };
        const { data: alertsData } = alertsRes as { data: AlertWithFarmer[] | null };
        setFarms(farmsData || []);
        setActivities(actData || []);
        setAlerts(
          (alertsData || []).map((a) => ({
            alert_id: a.alert_id,
            title: a.title,
            severity: a.severity,
            created_at: a.created_at,
            farmer_name: a.profiles?.full_name ?? null,
          }))
        );
        setDiseaseEventsThisMonth(diseaseRes.count ?? 0);
        setOverdueSystemWide(overdueRes.count ?? 0);
      } catch (err) {
        console.error("Admin dashboard load error:", err);
        setErrors(["Failed to load dashboard data. Check the browser console for details."]);
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

  const farmsBelow80 = farms.filter((f) => (f.coverage_pct ?? 0) < 80).length;

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

      {/* RPC error banner */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-alert-red/30 bg-red-50 p-4">
          <p className="text-sm font-semibold text-alert-red mb-1">
            Some dashboard data failed to load
          </p>
          <ul className="text-xs text-alert-red/80 space-y-0.5 list-disc list-inside">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

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

      {/* Row 3 — Activity feed + Alerts & exceptions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7">
          <AdminActivityFeed activities={activities} />
        </div>
        <div className="lg:col-span-5">
          <AdminAlertsExceptions alerts={alerts} />
        </div>
      </div>

      {/* Row 4 — Analytics overview */}
      <div>
        <h2 className="font-display text-lg font-semibold text-forest-deep mb-3">
          Analytics Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label="Disease Events This Month"
            value={diseaseEventsThisMonth}
            sublabel="Across all farms"
            href="/health"
            variant={diseaseEventsThisMonth > 0 ? "warning" : "default"}
          />
          <KpiCard
            label="Overdue Vaccinations"
            value={overdueSystemWide}
            sublabel="System-wide"
            href="/vaccinations"
            variant={overdueSystemWide > 0 ? "danger" : "default"}
          />
          <KpiCard
            label="Farms Below 80% Compliance"
            value={farmsBelow80}
            sublabel={`Of ${farms.length} total farms`}
            variant={farmsBelow80 > 0 ? "warning" : "default"}
          />
        </div>
      </div>

      {/* Row 5 — Quick actions */}
      <AdminQuickActions />
    </div>
  );
}
