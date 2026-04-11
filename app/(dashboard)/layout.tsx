import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const { count: unreadAlerts } = await supabase
    .from("alerts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-earth-cream">
        {/* Skip to content — a11y */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-1/2 focus:-translate-x-1/2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-forest-mid focus:text-white focus:rounded-lg focus:shadow-lg"
        >
          Skip to content
        </a>

        <Sidebar profile={profile} unreadAlerts={unreadAlerts ?? 0} />
        <main id="main-content" className="lg:ml-[240px] min-h-screen">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-6 lg:pt-8 lg:pb-8">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
