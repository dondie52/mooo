"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BreedingClient from "@/components/breeding/BreedingClient";

export default function BreedingPage() {
  const router = useRouter();
  const [records, setRecords] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [calvings, setCalvings] = useState<any[]>([]);
  const [role, setRole] = useState<"farmer" | "vet" | "admin">("farmer");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role) setRole(profile.role as typeof role);

      const [{ data: rec }, { data: an }, { data: calv }] = await Promise.all([
        supabase.from("breeding_records").select("*, animals(tag_number, breed)").order("event_date", { ascending: false }),
        supabase.from("animals").select("animal_id, tag_number, breed, gender, status").eq("status", "active").order("tag_number"),
        supabase.rpc("get_upcoming_calvings"),
      ]);

      setRecords(rec ?? []);
      setAnimals(an ?? []);
      setCalvings((calv as any[] | null) ?? []);
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-8 w-8 border-2 border-forest-mid border-t-transparent rounded-full" /></div>;

  return <BreedingClient records={records} animals={animals} calvings={calvings} role={role} />;
}
