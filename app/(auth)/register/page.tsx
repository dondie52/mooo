"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CowIcon } from "@/components/ui/CowIcon";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "farmer" as "farmer" | "vet",
    phone: "",
    farm_name: "",
    district: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
            role: form.role,
            phone: form.phone,
            farm_name: form.farm_name,
            district: form.district,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-earth-cream">
      <div className="w-full max-w-xl">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted hover:text-forest-mid mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>

        <div className="card animate-fade-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-lg bg-forest-mid flex items-center justify-center">
              <CowIcon className="w-6 h-6 text-gold" size={24} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold">Create your account</h1>
              <p className="text-muted text-sm">Join LMHTS to start managing your herd</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-100 text-alert-red text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full name</label>
                <input required className="input" value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as "farmer" | "vet" })}>
                  <option value="farmer">Farmer</option>
                  <option value="vet">Veterinary / Extension Officer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Email address</label>
              <input required type="email" className="input" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>

            <div>
              <label className="label">Password</label>
              <input required type="password" minLength={8} className="input" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <p className="text-xs text-muted mt-1">At least 8 characters</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Phone</label>
                <input className="input" placeholder="+267 7X XXX XXX" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">District</label>
                <input className="input" placeholder="e.g. Southern" value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })} />
              </div>
            </div>

            {form.role === "farmer" && (
              <div>
                <label className="label">Farm name</label>
                <input className="input" value={form.farm_name}
                  onChange={(e) => setForm({ ...form, farm_name: e.target.value })} />
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center h-11 disabled:opacity-60">
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
