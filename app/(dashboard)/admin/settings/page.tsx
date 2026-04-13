"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Shield, Mail, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { logAdminAction } from "@/lib/audit";

interface Settings {
  bmc_threshold: number;
  reminder_days: number;
  overdue_escalation_days: number;
  email_enabled: boolean;
  sender_name: string;
  reply_to_email: string;
}

const DEFAULTS: Settings = {
  bmc_threshold: 80,
  reminder_days: 7,
  overdue_escalation_days: 15,
  email_enabled: true,
  sender_name: "LMHTS",
  reply_to_email: "",
};

export default function AdminSettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [original, setOriginal] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // System info state
  const [systemInfo, setSystemInfo] = useState({
    totalUsers: 0,
    totalAnimals: 0,
    lastReminderRun: null as string | null,
  });

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const supabase = createClient();

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") return;
    setIsAdmin(true);

    // Load settings
    const { data: rows } = await supabase
      .from("system_settings")
      .select("key, value");

    if (rows) {
      const s = { ...DEFAULTS };
      for (const row of rows) {
        const v = row.value;
        switch (row.key) {
          case "bmc_threshold":
            s.bmc_threshold = typeof v === "number" ? v : Number(v) || DEFAULTS.bmc_threshold;
            break;
          case "reminder_days":
            s.reminder_days = typeof v === "number" ? v : Number(v) || DEFAULTS.reminder_days;
            break;
          case "overdue_escalation_days":
            s.overdue_escalation_days = typeof v === "number" ? v : Number(v) || DEFAULTS.overdue_escalation_days;
            break;
          case "email_enabled":
            s.email_enabled = v === true || v === "true";
            break;
          case "sender_name":
            s.sender_name = typeof v === "string" ? v : String(v ?? DEFAULTS.sender_name);
            break;
          case "reply_to_email":
            s.reply_to_email = typeof v === "string" ? v : String(v ?? "");
            break;
        }
      }
      setSettings(s);
      setOriginal(s);
    }

    // Load system info in parallel
    const [usersRes, animalsRes, auditRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("animals").select("animal_id", { count: "exact", head: true }),
      supabase
        .from("audit_log")
        .select("created_at")
        .ilike("action", "%reminder%")
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    setSystemInfo({
      totalUsers: usersRes.count ?? 0,
      totalAnimals: animalsRes.count ?? 0,
      lastReminderRun: auditRes.data?.[0]?.created_at ?? null,
    });

    setLoading(false);
  }

  async function saveSection(section: "thresholds" | "email") {
    setSavingSection(section);
    const supabase = createClient();

    const updates: { key: string; value: unknown; old: unknown }[] = [];

    if (section === "thresholds") {
      if (settings.bmc_threshold !== original.bmc_threshold)
        updates.push({ key: "bmc_threshold", value: settings.bmc_threshold, old: original.bmc_threshold });
      if (settings.reminder_days !== original.reminder_days)
        updates.push({ key: "reminder_days", value: settings.reminder_days, old: original.reminder_days });
      if (settings.overdue_escalation_days !== original.overdue_escalation_days)
        updates.push({ key: "overdue_escalation_days", value: settings.overdue_escalation_days, old: original.overdue_escalation_days });
    } else {
      if (settings.email_enabled !== original.email_enabled)
        updates.push({ key: "email_enabled", value: settings.email_enabled, old: original.email_enabled });
      if (settings.sender_name !== original.sender_name)
        updates.push({ key: "sender_name", value: settings.sender_name, old: original.sender_name });
      if (settings.reply_to_email !== original.reply_to_email)
        updates.push({ key: "reply_to_email", value: settings.reply_to_email, old: original.reply_to_email });
    }

    if (updates.length === 0) {
      toast({ message: "No changes to save", variant: "info" });
      setSavingSection(null);
      return;
    }

    let hasError = false;
    for (const u of updates) {
      const { error } = await supabase
        .from("system_settings")
        .update({ value: u.value as never, updated_at: new Date().toISOString() })
        .eq("key", u.key);

      if (error) {
        hasError = true;
        toast({ message: `Failed to update ${u.key}: ${error.message}`, variant: "error" });
      }
    }

    if (!hasError) {
      await logAdminAction(supabase, "update_settings", "system_settings", undefined, {
        section,
        changes: updates.map((u) => ({ key: u.key, from: u.old, to: u.value })),
      });
      setOriginal({ ...settings });
      toast({ message: "Settings saved", variant: "success" });
    }

    setSavingSection(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading settings...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <p className="text-alert-red font-medium">Access denied. Admin only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted hover:text-forest-mid">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <div className="animate-fade-up">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">System Settings</h1>
        <p className="text-sm text-muted mt-1">Configure alert thresholds, email preferences, and view system information</p>
      </div>

      <div className="grid gap-6 max-w-3xl">
        {/* Alert Thresholds */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-forest-light/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-forest-mid" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">Alert Thresholds</h2>
              <p className="text-xs text-muted">Configure BMC compliance and reminder rules</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">BMC Coverage Threshold (%)</label>
              <input
                type="number"
                className="input max-w-[200px]"
                min={50}
                max={100}
                value={settings.bmc_threshold}
                onChange={(e) => setSettings((s) => ({ ...s, bmc_threshold: Number(e.target.value) || 80 }))}
              />
              <p className="text-xs text-muted mt-1">Farmers below this % get a BMC warning. Default: 80%</p>
            </div>

            <div>
              <label className="label">Vaccination Reminder Days</label>
              <input
                type="number"
                className="input max-w-[200px]"
                min={1}
                max={30}
                value={settings.reminder_days}
                onChange={(e) => setSettings((s) => ({ ...s, reminder_days: Number(e.target.value) || 7 }))}
              />
              <p className="text-xs text-muted mt-1">Send advance reminders this many days before due date. Default: 7</p>
            </div>

            <div>
              <label className="label">Overdue Escalation Days</label>
              <input
                type="number"
                className="input max-w-[200px]"
                min={1}
                max={60}
                value={settings.overdue_escalation_days}
                onChange={(e) => setSettings((s) => ({ ...s, overdue_escalation_days: Number(e.target.value) || 15 }))}
              />
              <p className="text-xs text-muted mt-1">Overdue vaccinations escalate to &quot;critical&quot; after this many days. Default: 15</p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-border">
            <button
              onClick={() => saveSection("thresholds")}
              disabled={savingSection !== null}
              className="btn-primary h-10 text-sm inline-flex items-center gap-2 disabled:opacity-60"
            >
              {savingSection === "thresholds" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Thresholds
            </button>
          </div>
        </div>

        {/* Email Preferences */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-gold-dark" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">Email Preferences</h2>
              <p className="text-xs text-muted">Control email sending behaviour</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="label mb-0">Email Sending</label>
                <p className="text-xs text-muted">When off, alerts are still created but no emails are sent</p>
              </div>
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, email_enabled: !s.email_enabled }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.email_enabled ? "bg-forest-mid" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.email_enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="label">Sender Name</label>
              <input
                className="input max-w-[300px]"
                value={settings.sender_name}
                onChange={(e) => setSettings((s) => ({ ...s, sender_name: e.target.value }))}
                placeholder="LMHTS"
              />
              <p className="text-xs text-muted mt-1">The &quot;From&quot; name shown in emails</p>
            </div>

            <div>
              <label className="label">Reply-to Email</label>
              <input
                type="email"
                className="input max-w-[300px]"
                value={settings.reply_to_email}
                onChange={(e) => setSettings((s) => ({ ...s, reply_to_email: e.target.value }))}
                placeholder="support@lmhts.bw"
              />
              <p className="text-xs text-muted mt-1">Optional reply-to address for outgoing emails</p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-border">
            <button
              onClick={() => saveSection("email")}
              disabled={savingSection !== null}
              className="btn-primary h-10 text-sm inline-flex items-center gap-2 disabled:opacity-60"
            >
              {savingSection === "email" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Email Preferences
            </button>
          </div>
        </div>

        {/* System Info (read-only) */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-earth-sand flex items-center justify-center">
              <Info className="w-5 h-5 text-muted" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">System Information</h2>
              <p className="text-xs text-muted">Read-only platform statistics</p>
            </div>
          </div>

          <dl className="grid sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-earth-cream/50">
              <dt className="text-xs text-muted uppercase tracking-wide">Total Users</dt>
              <dd className="text-xl font-semibold mt-1">{systemInfo.totalUsers}</dd>
            </div>
            <div className="p-3 rounded-lg bg-earth-cream/50">
              <dt className="text-xs text-muted uppercase tracking-wide">Total Animals</dt>
              <dd className="text-xl font-semibold mt-1">{systemInfo.totalAnimals}</dd>
            </div>
            <div className="p-3 rounded-lg bg-earth-cream/50 sm:col-span-2">
              <dt className="text-xs text-muted uppercase tracking-wide">Last Reminder Run</dt>
              <dd className="text-sm font-medium mt-1">
                {systemInfo.lastReminderRun
                  ? new Date(systemInfo.lastReminderRun).toLocaleString("en-BW", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "No runs recorded"}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
