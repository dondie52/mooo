"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";

interface FormState {
  email: string;
  password: string;
  full_name: string;
  role: "farmer" | "vet" | "admin";
  phone: string;
  farm_name: string;
  district: string;
}

const initial: FormState = {
  email: "",
  password: "",
  full_name: "",
  role: "farmer",
  phone: "",
  farm_name: "",
  district: "",
};

const DISTRICTS = [
  "Central", "Chobe", "Ghanzi", "Kgalagadi", "Kgatleng",
  "Kweneng", "North-East", "North-West", "South-East", "Southern",
];

export default function AdminNewUserPage() {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.password || !form.full_name) {
      setError("Email, password, and full name are required");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setError("Your session expired. Sign in again.");
      setLoading(false);
      return;
    }

    const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!base || !anon) {
      setError("App configuration error.");
      setLoading(false);
      return;
    }

    // Edge function uses service role to create the auth user without calling signUp(),
    // which would replace the browser session with the newly created account.
    let res: Response;
    try {
      res = await fetch(`${base}/functions/v1/admin-create-user`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: anon,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          role: form.role,
          ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
          ...(form.farm_name.trim() ? { farm_name: form.farm_name.trim() } : {}),
          ...(form.district ? { district: form.district } : {}),
        }),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? `Network error: ${err.message}. Check that the admin-create-user edge function is deployed.`
          : "Network error reaching the server.",
      );
      setLoading(false);
      return;
    }

    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
    };
    if (!res.ok || !json.ok) {
      setError(
        typeof json.error === "string"
          ? json.error
          : `Failed to create user (${res.status})`,
      );
      setLoading(false);
      return;
    }

    toast({ message: `User ${form.full_name} created successfully`, variant: "success" });
    router.push("/admin/users");
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-muted hover:text-forest-mid">
        <ArrowLeft className="w-4 h-4" /> Back to users
      </Link>

      <div className="animate-fade-up">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">Add New User</h1>
        <p className="text-sm text-muted mt-1">Create a farmer, vet, or admin account</p>
      </div>

      <div className="card max-w-2xl">
        <div className="accent-bar w-16 mb-6" />

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-alert-red text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Refilwe Sengate" />
            </div>
            <div>
              <label className="label">Role *</label>
              <select className="input" value={form.role} onChange={(e) => set("role", e.target.value as FormState["role"])}>
                <option value="farmer">Farmer</option>
                <option value="vet">Vet / Extension Officer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="user@example.com" />
            </div>
            <div>
              <label className="label">Password *</label>
              <input type="password" className="input" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Min 8 characters" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+267 7X XXX XXX" />
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
              <input className="input" value={form.farm_name} onChange={(e) => set("farm_name", e.target.value)} placeholder="e.g. Sengate Cattle Farm" />
            </div>
          )}

          <div className="pt-2">
            <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto justify-center h-11 disabled:opacity-60">
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
