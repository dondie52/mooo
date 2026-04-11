"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import type { Enums } from "@/lib/supabase/database.types";

type UserRole = Enums<"user_role">;

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  district: string | null;
  farm_name: string | null;
  is_active: boolean;
  created_at: string;
}

interface UsersClientProps {
  users: UserRow[];
}

export default function UsersClient({ users: initialUsers }: UsersClientProps) {
  const router = useRouter();
  const toast = useToast();
  const [users, setUsers] = useState<UserRow[]>(initialUsers);

  async function updateRole(id: string, role: UserRole) {
    const supabase = createClient();
    const { error } = await (supabase.from("profiles").update({ role }) as any).eq("id", id);
    if (error) {
      toast({ message: error.message, variant: "error" });
      return;
    }
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
    toast({ message: "Role updated", variant: "success" });
    router.refresh();
  }

  async function toggleActive(id: string) {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const supabase = createClient();
    const { error } = await (supabase.from("profiles").update({ is_active: !user.is_active }) as any).eq("id", id);
    if (error) {
      toast({ message: error.message, variant: "error" });
      return;
    }
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, is_active: !u.is_active } : u));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">User Management</h1>
        <p className="text-sm text-muted mt-1">Manage system users and roles</p>
      </div>

      <div className="card">
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Name", "Email", "Role", "District", "Farm", "Status", "Joined"].map((h) => (
                  <th key={h} className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border/50 last:border-0">
                  <td className="px-6 py-3 font-medium text-forest-deep">{user.full_name}</td>
                  <td className="px-6 py-3 text-muted">{user.email}</td>
                  <td className="px-6 py-3">
                    <select
                      className="input w-auto py-1.5 px-2 text-xs"
                      value={user.role}
                      onChange={(e) => updateRole(user.id, e.target.value as UserRole)}
                    >
                      <option value="farmer">Farmer</option>
                      <option value="vet">Vet</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-3 text-muted">{user.district || "—"}</td>
                  <td className="px-6 py-3 text-muted">{user.farm_name || "—"}</td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => toggleActive(user.id)}
                      className={cn(
                        "relative w-10 h-5 rounded-full transition-colors",
                        user.is_active ? "bg-alert-green" : "bg-earth-stone"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                          user.is_active ? "left-[22px]" : "left-0.5"
                        )}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-3 text-muted whitespace-nowrap">{formatDate(user.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
