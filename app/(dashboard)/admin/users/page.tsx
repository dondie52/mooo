import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UsersClient from "@/components/admin/UsersClient";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify admin role
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (currentProfile?.role !== "admin") redirect("/dashboard");

  // Fetch all profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch emails from auth
  const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emailMap = new Map<string, string>();
  for (const u of authData?.users ?? []) {
    if (u.email) emailMap.set(u.id, u.email);
  }

  const users = (profiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: emailMap.get(p.id) ?? "—",
    role: p.role,
    district: p.district,
    farm_name: p.farm_name,
    is_active: p.is_active,
    created_at: p.created_at,
  }));

  return <UsersClient users={users} />;
}
