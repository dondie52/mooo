"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import VaccinationsClient from "@/components/vaccinations/VaccinationsClient";

export default function VaccinationsPage() {
  const router = useRouter();
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [{ data: vacc }, { data: an }] = await Promise.all([
        supabase.from("vaccinations").select("*, animals(tag_number)").order("date_given", { ascending: false }),
        supabase.from("animals").select("animal_id, tag_number, breed, status").eq("status", "active").order("tag_number"),
      ]);

      setVaccinations(vacc ?? []);
      setAnimals(an ?? []);
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-8 w-8 border-2 border-forest-mid border-t-transparent rounded-full" /></div>;

  return <VaccinationsClient vaccinations={vaccinations} animals={animals} />;
}
