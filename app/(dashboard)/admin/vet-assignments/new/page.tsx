"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { logAdminAction } from "@/lib/audit";

interface ProfileOption {
  id: string;
  full_name: string;
  farm_name?: string | null;
  district?: string | null;
}

export default function AdminNewVetAssignmentPage() {
  const router = useRouter();
  const toast = useToast();
  const [vets, setVets] = useState<ProfileOption[]>([]);
  const [farmers, setFarmers] = useState<ProfileOption[]>([]);
  const [vetId, setVetId] = useState("");
  const [farmerId, setFarmerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: me } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
      if ((me as any)?.role !== "admin") { router.push("/dashboard"); return; }

      const [{ data: vetData }, { data: farmerData }] = await Promise.all([
        supabase.from("profiles").select("id, full_name").eq("role", "vet").eq("is_active", true).order("full_name"),
        supabase.from("profiles").select("id, full_name, farm_name, district").eq("role", "farmer").eq("is_active", true).order("full_name"),
      ]);

      setVets((vetData as ProfileOption[]) ?? []);
      setFarmers((farmerData as ProfileOption[]) ?? []);
      setLoading(false);
    };
    load();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vetId || !farmerId) {
      setError("Select both a vet and a farmer");
      return;
    }

    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await (supabase.from("vet_assignments") as any).insert({
      vet_id: vetId,
      farmer_id: farmerId,
    });

    if (insertError) {
      if (insertError.message?.includes("duplicate") || insertError.code === "23505") {
        setError("This vet is already assigned to this farmer");
      } else {
        setError(insertError.message);
      }
      setSaving(false);
      return;
    }

    const vet = vets.find((v) => v.id === vetId);
    const farmer = farmers.find((f) => f.id === farmerId);
    await logAdminAction(supabase, "create_vet_assignment", "vet_assignments", undefined, {
      vet_name: vet?.full_name,
      farmer_name: farmer?.full_name,
    });

    toast({ message: `${vet?.full_name} assigned to ${farmer?.full_name}`, variant: "success" });
    router.push("/admin/vet-assignments");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-2 border-forest-mid border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/vet-assignments" className="inline-flex items-center gap-2 text-sm text-muted hover:text-forest-mid">
        <ArrowLeft className="w-4 h-4" /> Back to assignments
      </Link>

      <div className="animate-fade-up">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">Create Assignment</h1>
        <p className="text-sm text-muted mt-1">Assign a vet to oversee a farmer&apos;s herd</p>
      </div>

      <div className="card max-w-xl">
        <div className="accent-bar w-16 mb-6" />

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-alert-red text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Veterinary Officer *</label>
            <select className="input" value={vetId} onChange={(e) => { setVetId(e.target.value); setError(null); }}>
              <option value="">— Select a vet —</option>
              {vets.map((v) => (
                <option key={v.id} value={v.id}>{v.full_name}</option>
              ))}
            </select>
            {vets.length === 0 && (
              <p className="text-xs text-alert-amber mt-1">No active vets found. Create a vet account first.</p>
            )}
          </div>

          <div>
            <label className="label">Farmer *</label>
            <select className="input" value={farmerId} onChange={(e) => { setFarmerId(e.target.value); setError(null); }}>
              <option value="">— Select a farmer —</option>
              {farmers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.full_name}{f.farm_name ? ` — ${f.farm_name}` : ""}{f.district ? ` (${f.district})` : ""}
                </option>
              ))}
            </select>
            {farmers.length === 0 && (
              <p className="text-xs text-alert-amber mt-1">No active farmers found.</p>
            )}
          </div>

          <div className="pt-2">
            <button type="submit" disabled={saving || !vetId || !farmerId} className="btn-primary w-full sm:w-auto justify-center h-11 disabled:opacity-60">
              {saving ? "Assigning..." : "Create Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
