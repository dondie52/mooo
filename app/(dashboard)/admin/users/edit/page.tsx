"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { logAdminAction } from "@/lib/audit";

const DISTRICTS = [
  "Central", "Chobe", "Ghanzi", "Kgalagadi", "Kgatleng",
  "Kweneng", "North-East", "North-West", "South-East", "Southern",
];

interface ProfileForm {
  full_name: string;
  role: "farmer" | "vet" | "admin";
  phone: string;
  farm_name: string;
  district: string;
  is_active: boolean;
}

export default function AdminEditUserPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");
  const toast = useToast();
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) { router.push("/admin/users"); return; }
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Verify admin
      const { data: me } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
      if ((me as any)?.role !== "admin") { router.push("/dashboard"); return; }

      const { data: profile } = await supabase
        .from("profiles").select("*").eq("id", userId).single();
      if (!profile) { router.push("/admin/users"); return; }

      setForm({
        full_name: (profile as any).full_name ?? "",
        role: (profile as any).role ?? "farmer",
        phone: (profile as any).phone ?? "",
        farm_name: (profile as any).farm_name ?? "",
        district: (profile as any).district ?? "",
        is_active: (profile as any).is_active ?? true,
      });
      setLoading(false);
    };
    load();
  }, [userId, router]);

  function set<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((f) => f ? { ...f, [key]: value } : f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !userId) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await (supabase.from("profiles").update({
      full_name: form.full_name,
      role: form.role,
      phone: form.phone || null,
      farm_name: form.farm_name || null,
      district: form.district || null,
      is_active: form.is_active,
    }) as any).eq("id", userId);

    if (error) {
      toast({ message: error.message, variant: "error" });
      setSaving(false);
      return;
    }

    await logAdminAction(supabase, "edit_user", "profiles", userId, {
      full_name: form.full_name,
      role: form.role,
      is_active: form.is_active,
    });

    toast({ message: "User updated", variant: "success" });
    router.push("/admin/users");
  }

  if (loading || !form) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-2 border-forest-mid border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-muted hover:text-forest-mid">
        <ArrowLeft className="w-4 h-4" /> Back to users
      </Link>

      <div className="animate-fade-up">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">Edit User</h1>
        <p className="text-sm text-muted mt-1">Update user profile and permissions</p>
      </div>

      <div className="card max-w-2xl">
        <div className="accent-bar w-16 mb-6" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={(e) => set("role", e.target.value as ProfileForm["role"])}>
                <option value="farmer">Farmer</option>
                <option value="vet">Vet / Extension Officer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div>
              <label className="label">District</label>
              <select className="input" value={form.district} onChange={(e) => set("district", e.target.value)}>
                <option value="">— Select —</option>
                {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {form.role === "farmer" && (
            <div>
              <label className="label">Farm Name</label>
              <input className="input" value={form.farm_name} onChange={(e) => set("farm_name", e.target.value)} />
            </div>
          )}

          <div className="flex items-center gap-3">
            <label className="label mb-0">Active</label>
            <button
              type="button"
              onClick={() => set("is_active", !form.is_active)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                form.is_active ? "bg-alert-green" : "bg-earth-stone"
              }`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                form.is_active ? "left-[22px]" : "left-0.5"
              }`} />
            </button>
            <span className="text-sm text-muted">{form.is_active ? "Active" : "Inactive"}</span>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto justify-center h-11 disabled:opacity-60">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
