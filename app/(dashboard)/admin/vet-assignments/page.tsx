"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Link2, Plus, Trash2 } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { logAdminAction } from "@/lib/audit";
import EmptyState from "@/components/ui/EmptyState";

interface Assignment {
  assignment_id: string;
  vet_id: string;
  farmer_id: string;
  vet_name: string;
  farmer_name: string;
  farmer_farm: string | null;
  farmer_district: string | null;
  assigned_at: string;
  is_active: boolean;
}

export default function AdminVetAssignmentsPage() {
  const router = useRouter();
  const toast = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: me } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
      if ((me as any)?.role !== "admin") { router.push("/dashboard"); return; }

      // Fetch assignments with joined profile names
      const { data } = await supabase
        .from("vet_assignments")
        .select("*")
        .order("assigned_at", { ascending: false });

      if (!data) { setLoading(false); return; }

      // Fetch profiles for all unique user IDs
      const userIds = [...new Set(data.flatMap((a: any) => [a.vet_id, a.farmer_id]))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, farm_name, district")
        .in("id", userIds);

      const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

      const mapped: Assignment[] = data.map((a: any) => {
        const vet = profileMap.get(a.vet_id);
        const farmer = profileMap.get(a.farmer_id);
        return {
          assignment_id: a.assignment_id,
          vet_id: a.vet_id,
          farmer_id: a.farmer_id,
          vet_name: vet?.full_name ?? "Unknown Vet",
          farmer_name: farmer?.full_name ?? "Unknown Farmer",
          farmer_farm: farmer?.farm_name ?? null,
          farmer_district: farmer?.district ?? null,
          assigned_at: a.assigned_at,
          is_active: a.is_active,
        };
      });

      setAssignments(mapped);
      setLoading(false);
    };
    load();
  }, [router]);

  async function removeAssignment(a: Assignment) {
    if (!window.confirm(`Remove ${a.vet_name} from ${a.farmer_name}?`)) return;
    const supabase = createClient();
    const { error } = await (supabase.from("vet_assignments") as any)
      .delete()
      .eq("assignment_id", a.assignment_id);

    if (error) {
      toast({ message: error.message, variant: "error" });
      return;
    }

    await logAdminAction(supabase, "remove_vet_assignment", "vet_assignments", a.assignment_id, {
      vet_name: a.vet_name,
      farmer_name: a.farmer_name,
    });

    setAssignments((prev) => prev.filter((x) => x.assignment_id !== a.assignment_id));
    toast({ message: "Assignment removed", variant: "success" });
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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">Vet Assignments</h1>
          <p className="text-sm text-muted mt-1">
            Manage vet-to-farmer assignments · {assignments.filter((a) => a.is_active).length} active
          </p>
        </div>
        <Link href="/admin/vet-assignments/new" className="btn-primary shrink-0">
          <Plus className="w-4 h-4" /> Create Assignment
        </Link>
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          icon={Link2}
          title="No vet assignments"
          description="Assign vets to farmers so they can view and manage animal health records"
          action={{ label: "Create Assignment", href: "/admin/vet-assignments/new" }}
        />
      ) : (
        <div className="card">
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Vet", "Farmer", "Farm", "District", "Assigned", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.assignment_id} className="border-b border-border/50 last:border-0">
                    <td className="px-6 py-3 font-medium text-forest-deep">{a.vet_name}</td>
                    <td className="px-6 py-3 font-medium text-forest-deep">{a.farmer_name}</td>
                    <td className="px-6 py-3 text-muted">{a.farmer_farm || "—"}</td>
                    <td className="px-6 py-3 text-muted">{a.farmer_district || "—"}</td>
                    <td className="px-6 py-3 text-muted whitespace-nowrap">{formatDate(a.assigned_at)}</td>
                    <td className="px-6 py-3">
                      <span className={cn("badge", a.is_active ? "badge-green" : "badge-muted")}>
                        {a.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => removeAssignment(a)}
                        className="p-1.5 rounded hover:bg-red-50 transition-colors text-muted hover:text-alert-red"
                        title="Remove assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
