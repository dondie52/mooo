import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AlertsClient from "@/components/alerts/AlertsClient";

export default async function AlertsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: alerts } = await supabase
    .from("alerts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <AlertsClient alerts={alerts ?? []} />;
}
