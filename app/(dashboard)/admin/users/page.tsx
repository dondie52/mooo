"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import UsersClient from "@/components/admin/UsersClient";

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Verify admin role
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if ((currentProfile as any)?.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      // Fetch all profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      const mapped = (profiles ?? []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        email: user.email ?? "—",
        role: p.role,
        district: p.district,
        farm_name: p.farm_name,
        is_active: p.is_active,
        created_at: p.created_at,
      }));

      setUsers(mapped);
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-8 w-8 border-2 border-forest-mid border-t-transparent rounded-full" /></div>;

  return <UsersClient users={users} />;
}
