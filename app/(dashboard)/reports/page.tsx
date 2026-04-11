import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReportsClient from "@/components/reports/ReportsClient";

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const animalsP = supabase.from("animals").select("*").order("tag_number");
  const vaccinationsP = supabase
    .from("vaccinations")
    .select("*, animals(tag_number, lits_tag)")
    .order("date_given", { ascending: false });
  const healthEventsP = supabase
    .from("health_events")
    .select("*, animals(tag_number)")
    .order("event_date", { ascending: false });
  const movementsP = supabase
    .from("movements")
    .select("*, animals(tag_number)")
    .order("movement_date", { ascending: false });

  const { data: animals } = await animalsP;
  const { data: vaccinations } = await vaccinationsP;
  const { data: healthEvents } = await healthEventsP;
  const { data: movements } = await movementsP;

  return (
    <ReportsClient
      animals={(animals ?? []) as any}
      vaccinations={(vaccinations ?? []) as any}
      healthEvents={(healthEvents ?? []) as any}
      movements={(movements ?? []) as any}
    />
  );
}
