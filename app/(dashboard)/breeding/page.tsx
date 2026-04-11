import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BreedingClient from "@/components/breeding/BreedingClient";

type CalvingRow = { animal_id: string; tag_number: string; expected_date: string };

export default async function BreedingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const recordsP = supabase
    .from("breeding_records")
    .select("*, animals(tag_number, breed)")
    .order("event_date", { ascending: false });

  const animalsP = supabase
    .from("animals")
    .select("animal_id, tag_number, breed, gender, status")
    .eq("status", "active")
    .order("tag_number");

  const calvingsP = supabase.rpc("get_upcoming_calvings");

  const { data: records } = await recordsP;
  const { data: animals } = await animalsP;
  const { data: calvings } = await calvingsP as { data: CalvingRow[] | null };

  return (
    <BreedingClient
      records={(records ?? []) as any}
      animals={animals ?? []}
      calvings={calvings ?? []}
    />
  );
}
