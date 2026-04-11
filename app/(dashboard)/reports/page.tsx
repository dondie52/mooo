"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ReportsClient from "@/components/reports/ReportsClient";

export default function ReportsPage() {
  const router = useRouter();
  const [data, setData] = useState<{ animals: any[]; vaccinations: any[]; healthEvents: any[]; movements: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [{ data: animals }, { data: vaccinations }, { data: healthEvents }, { data: movements }] = await Promise.all([
        supabase.from("animals").select("*").order("tag_number"),
        supabase.from("vaccinations").select("*, animals(tag_number, lits_tag)").order("date_given", { ascending: false }),
        supabase.from("health_events").select("*, animals(tag_number)").order("event_date", { ascending: false }),
        supabase.from("movements").select("*, animals(tag_number)").order("movement_date", { ascending: false }),
      ]);

      setData({
        animals: animals ?? [],
        vaccinations: vaccinations ?? [],
        healthEvents: healthEvents ?? [],
        movements: movements ?? [],
      });
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading || !data) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-8 w-8 border-2 border-forest-mid border-t-transparent rounded-full" /></div>;

  return <ReportsClient animals={data.animals} vaccinations={data.vaccinations} healthEvents={data.healthEvents} movements={data.movements} />;
}
