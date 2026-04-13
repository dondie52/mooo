"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { ToastProvider } from "@/components/ui/Toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!prof) { router.push("/login"); return; }

      const { count } = await supabase
        .from("alerts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      // Update last_login timestamp
      supabase
        .from("profiles")
        .update({ last_login: new Date().toISOString() })
        .eq("id", user.id)
        .then();

      setProfile(prof);
      setUnreadAlerts(count ?? 0);
      setLoading(false);
    };
    load();
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-earth-cream flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-3 border-forest-mid border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-earth-cream">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-1/2 focus:-translate-x-1/2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-forest-mid focus:text-white focus:rounded-lg focus:shadow-lg"
        >
          Skip to content
        </a>

        <Sidebar profile={profile} unreadAlerts={unreadAlerts} />
        <main
          id="main-content"
          className="min-h-screen relative z-10 lg:pl-[240px]"
        >
          <Topbar profile={profile} unreadCount={unreadAlerts} />
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-6 lg:pt-8 lg:pb-8">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
