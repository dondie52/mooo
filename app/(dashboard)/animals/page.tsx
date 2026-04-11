import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnimalsClient from "@/components/animals/AnimalsClient";

export default async function AnimalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: animals } = await supabase
    .from("animals")
    .select("*")
    .order("created_at", { ascending: false });

  return <AnimalsClient animals={animals ?? []} />;
}
