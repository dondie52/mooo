"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AnimalDetailClient from "@/components/animals/AnimalDetailClient";

export default function AnimalDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { router.push("/animals"); return; }
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: animal } = await supabase
        .from("animals").select("*").eq("animal_id", id).single();
      if (!animal) { router.push("/animals"); return; }

      const [
        { data: healthEvents },
        { data: vaccinations },
        { data: breedingRecords },
        { data: movements },
      ] = await Promise.all([
        supabase.from("health_events").select("*").eq("animal_id", id).order("event_date", { ascending: false }),
        supabase.from("vaccinations").select("*").eq("animal_id", id).order("date_given", { ascending: false }),
        supabase.from("breeding_records").select("*").eq("animal_id", id).order("event_date", { ascending: false }),
        supabase.from("movements").select("*").eq("animal_id", id).order("movement_date", { ascending: false }),
      ]);

      setData({
        animal,
        healthEvents: healthEvents ?? [],
        vaccinations: vaccinations ?? [],
        breedingRecords: breedingRecords ?? [],
        movements: movements ?? [],
      });
      setLoading(false);
    };
    load();
  }, [id, router]);

  if (loading || !data) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-8 w-8 border-2 border-forest-mid border-t-transparent rounded-full" /></div>;

  return (
    <AnimalDetailClient
      animal={data.animal}
      healthEvents={data.healthEvents}
      vaccinations={data.vaccinations}
      breedingRecords={data.breedingRecords}
      movements={data.movements}
    />
  );
}
