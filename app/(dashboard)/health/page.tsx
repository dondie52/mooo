import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HealthClient from "@/components/health/HealthClient";

export default async function HealthPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: events }, { data: animals }] = await Promise.all([
    supabase
      .from("health_events")
      .select("*, animals(tag_number)")
      .order("event_date", { ascending: false }),
    supabase
      .from("animals")
      .select("animal_id, tag_number, breed, status")
      .eq("status", "active")
      .order("tag_number"),
  ]);

  return <HealthClient events={events ?? []} animals={animals ?? []} />;
}
