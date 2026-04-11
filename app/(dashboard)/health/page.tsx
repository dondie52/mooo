"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import HealthClient from "@/components/health/HealthClient";

export default function HealthPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [{ data: ev }, { data: an }] = await Promise.all([
        supabase.from("health_events").select("*, animals(tag_number)").order("event_date", { ascending: false }),
        supabase.from("animals").select("animal_id, tag_number, breed, status").eq("status", "active").order("tag_number"),
      ]);

      setEvents(ev ?? []);
      setAnimals(an ?? []);
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-8 w-8 border-2 border-forest-mid border-t-transparent rounded-full" /></div>;

  return <HealthClient events={events} animals={animals} />;
}
