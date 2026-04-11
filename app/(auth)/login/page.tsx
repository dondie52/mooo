"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { CowIcon } from "@/components/ui/CowIcon";
import { createClient } from "@/lib/supabase/client";

const devPreviewAuth = process.env.NEXT_PUBLIC_DEV_PREVIEW_AUTH === "true";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (devPreviewAuth) {
        document.cookie =
          "lmhts_dev_auth=1; path=/; max-age=604800; SameSite=Lax";
      } else {
        const supabase = createClient();
        const { error: signError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signError) {
          setError(signError.message);
          return;
        }
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
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — brand side */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-forest-deep text-earth-cream relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "24px 24px"
        }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-gold flex items-center justify-center">
              <CowIcon className="w-6 h-6 text-forest-deep" size={24} />
            </div>
            <div>
              <div className="font-display text-xl font-semibold leading-tight">LMHTS</div>
              <div className="text-xs text-earth-stone/70 uppercase tracking-widest">Botswana</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl font-semibold leading-[1.15] mb-4">
            Digital livestock management for Botswana&rsquo;s smallholder farmers.
          </h1>
          <p className="text-earth-stone/80 text-[15px] leading-relaxed mb-8">
            Track vaccinations, monitor herd health, and maintain BMC compliance —
            all from one platform built for your farm.
          </p>
          <div className="space-y-2.5">
            {[
              "Digital animal records & herd tracking",
              "Automated vaccination reminders",
              "BMC & BAITS compliance reports",
              "Rule-based disease risk alerts",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                <span className="text-earth-cream/90">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-earth-stone/50">
          University of Botswana · Department of Computer Science
        </div>
      </div>

      {/* Right — form side */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-earth-cream">
        <div className="w-full max-w-md animate-fade-up">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-forest-mid flex items-center justify-center">
              <CowIcon className="w-5 h-5 text-gold" size={20} />
            </div>
            <div className="font-display text-lg font-semibold">LMHTS</div>
          </div>

          <h2 className="font-display text-3xl font-semibold mb-2">Welcome back</h2>
          <p className="text-muted text-sm mb-8">Sign in to manage your herd</p>

          {devPreviewAuth && (
            <div className="mb-5 p-3.5 rounded-lg bg-amber-50 border border-amber-100 text-amber-950 text-sm">
              Dev preview: Sign in sets a local cookie only — no Supabase session. Do not
              enable <code className="text-xs">NEXT_PUBLIC_DEV_PREVIEW_AUTH</code> in production.
            </div>
          )}

          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-100 text-alert-red text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label" htmlFor="email">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input pl-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center h-11 disabled:opacity-60"
            >
              {loading ? <><span className="spinner" /> Signing in…</> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center text-sm text-muted">
            Don&rsquo;t have an account?{" "}
            <Link href="/register" className="text-forest-mid font-semibold hover:text-forest-deep">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
