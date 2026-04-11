import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LandingPage from "./(marketing)/page";

export default async function RootPage() {
  let isAuthenticated = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isAuthenticated = !!user;
  } catch {
    // Supabase not configured — treat as unauthenticated
  }

  if (isAuthenticated) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
