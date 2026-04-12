"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, KeyRound, Trash2, UserX, UserCheck } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { logAdminAction } from "@/lib/audit";
import type { Enums } from "@/lib/supabase/database.types";

type UserRole = Enums<"user_role">;

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  district: string | null;
  farm_name: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

interface UsersClientProps {
  users: UserRow[];
}

const roleFilters: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Farmers", value: "farmer" },
  { label: "Vets", value: "vet" },
  { label: "Admins", value: "admin" },
  { label: "Inactive", value: "inactive" },
];

const roleBadge: Record<string, string> = {
  farmer: "badge-green",
  vet: "badge-amber",
  admin: "badge-muted",
};

export default function UsersClient({ users: initialUsers }: UsersClientProps) {
  const router = useRouter();
  const toast = useToast();
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  const filtered = users.filter((u) => {
    if (filter === "inactive") return !u.is_active;
    if (filter && u.role !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.district ?? "").toLowerCase().includes(q) ||
        (u.farm_name ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  async function updateRole(id: string, role: UserRole) {
    const supabase = createClient();
    const old = users.find((u) => u.id === id);
    const { error } = await (supabase.from("profiles").update({ role }) as any).eq("id", id);
    if (error) {
      toast({ message: error.message, variant: "error" });
      return;
    }
    await logAdminAction(supabase, "change_role", "profiles", id, {
      old_role: old?.role,
      new_role: role,
      user_name: old?.full_name,
    });
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
    toast({ message: "Role updated", variant: "success" });
  }

  async function toggleActive(id: string) {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const newActive = !user.is_active;
    const supabase = createClient();
    const { error } = await (supabase.from("profiles").update({ is_active: newActive }) as any).eq("id", id);
    if (error) {
      toast({ message: error.message, variant: "error" });
      return;
    }
    await logAdminAction(supabase, newActive ? "activate_user" : "deactivate_user", "profiles", id, {
      user_name: user.full_name,
    });
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, is_active: newActive } : u));
    toast({ message: newActive ? "User activated" : "User deactivated", variant: "success" });
  }

  async function resetPassword(user: UserRow) {
    if (!window.confirm(`Send a password reset email to ${user.email}?`)) return;
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    if (error) {
      toast({ message: error.message, variant: "error" });
      return;
    }
    await logAdminAction(supabase, "reset_password", "profiles", user.id, {
      user_name: user.full_name,
      email: user.email,
    });
    toast({ message: `Password reset email sent to ${user.email}`, variant: "success" });
  }

  async function deleteUser(user: UserRow) {
    if (!window.confirm(`Deactivate ${user.full_name}? This will prevent them from logging in.`)) return;
    // For static export, we deactivate rather than delete from auth.users
    // (full deletion requires service role key via server-side code)
    const supabase = createClient();
    const { error } = await (supabase.from("profiles").update({ is_active: false }) as any).eq("id", user.id);
    if (error) {
      toast({ message: error.message, variant: "error" });
      return;
    }
    await logAdminAction(supabase, "deactivate_user", "profiles", user.id, {
      user_name: user.full_name,
    });
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: false } : u));
    toast({ message: `${user.full_name} has been deactivated`, variant: "success" });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">User Management</h1>
          <p className="text-sm text-muted mt-1">
            {users.length} users · {users.filter((u) => u.is_active).length} active
          </p>
        </div>
        <Link href="/admin/users/new" className="btn-primary shrink-0">
          <Plus className="w-4 h-4" /> Add User
        </Link>
      </div>

      {/* Filter chips + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-wrap gap-2">
          {roleFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                filter === f.value
                  ? "bg-forest-mid text-white"
                  : "bg-earth-sand text-forest-deep hover:bg-earth-stone"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            className="input pl-9"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Users table */}
      <div className="card">
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Name", "Email", "Role", "Farm", "District", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h} className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-muted">No users match your filters</td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="border-b border-border/50 last:border-0">
                    <td className="px-6 py-3">
                      <Link href={`/admin/users/edit?id=${user.id}`} className="font-medium text-forest-deep hover:text-forest-accent">
                        {user.full_name || "—"}
                      </Link>
                    </td>
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
                    <td className="px-6 py-3 text-muted">{user.farm_name || "—"}</td>
                    <td className="px-6 py-3 text-muted">{user.district || "—"}</td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => toggleActive(user.id)}
                        className={cn(
                          "relative w-10 h-5 rounded-full transition-colors",
                          user.is_active ? "bg-alert-green" : "bg-earth-stone"
                        )}
                        title={user.is_active ? "Active — click to deactivate" : "Inactive — click to activate"}
                      >
                        <span className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                          user.is_active ? "left-[22px]" : "left-0.5"
                        )} />
                      </button>
                    </td>
                    <td className="px-6 py-3 text-muted whitespace-nowrap">{formatDate(user.created_at)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/users/edit?id=${user.id}`}
                          className="p-1.5 rounded hover:bg-earth-sand transition-colors text-muted hover:text-forest-deep"
                          title="Edit user"
                        >
                          <UserCheck className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => resetPassword(user)}
                          className="p-1.5 rounded hover:bg-earth-sand transition-colors text-muted hover:text-gold-dark"
                          title="Reset password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteUser(user)}
                          className="p-1.5 rounded hover:bg-red-50 transition-colors text-muted hover:text-alert-red"
                          title="Deactivate user"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
