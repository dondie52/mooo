import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnimalDetailClient from "@/components/animals/AnimalDetailClient";

export default async function AnimalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: animal } = await supabase
    .from("animals").select("*").eq("animal_id", id).single();
  if (!animal) notFound();

  // Fetch related records in parallel
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

  return (
    <AnimalDetailClient
      animal={animal}
      healthEvents={healthEvents ?? []}
      vaccinations={vaccinations ?? []}
      breedingRecords={breedingRecords ?? []}
      movements={movements ?? []}
    />
  );
}
