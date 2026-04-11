import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VaccinationsClient from "@/components/vaccinations/VaccinationsClient";

export default async function VaccinationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: vaccinations }, { data: animals }] = await Promise.all([
    supabase
      .from("vaccinations")
      .select("*, animals(tag_number)")
      .order("date_given", { ascending: false }),
    supabase
      .from("animals")
      .select("animal_id, tag_number, breed, status")
      .eq("status", "active")
      .order("tag_number"),
  ]);

  return <VaccinationsClient vaccinations={vaccinations ?? []} animals={animals ?? []} />;
}
