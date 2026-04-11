"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { healthEventSchema, type HealthEventFormData } from "@/lib/validators/health-event";
import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesInsert } from "@/lib/supabase/database.types";

interface LogHealthEventModalProps {
  open: boolean;
  onClose: () => void;
  animals: Pick<Tables<"animals">, "animal_id" | "tag_number" | "breed" | "status">[];
}

const initial: HealthEventFormData = {
  animal_id: "",
  event_date: new Date().toISOString().split("T")[0],
  event_type: "disease",
  condition_name: "",
  severity: undefined,
  symptoms: "",
  treatment_given: "",
  vet_name: "",
  outcome: undefined,
  followup_date: "",
  notes: "",
};

export default function LogHealthEventModal({ open, onClose, animals }: LogHealthEventModalProps) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<HealthEventFormData>(initial);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [loading, setLoading] = useState(false);

  function set(key: string, value: string | undefined) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = healthEventSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((i) => {
        const key = String(i.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      toast({ message: "You must be logged in to log events", variant: "error" });
      return;
    }

    const row: TablesInsert<"health_events"> = {
      animal_id: result.data.animal_id,
      event_date: result.data.event_date,
      event_type: result.data.event_type as TablesInsert<"health_events">["event_type"],
      condition_name: result.data.condition_name || null,
      severity: (result.data.severity as TablesInsert<"health_events">["severity"]) || null,
      symptoms: result.data.symptoms || null,
      treatment_given: result.data.treatment_given || null,
      vet_name: result.data.vet_name || null,
      outcome: (result.data.outcome as TablesInsert<"health_events">["outcome"]) || null,
      followup_date: result.data.followup_date || null,
      notes: result.data.notes || null,
      logged_by: user.id,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- insert types resolve to `never` due to generated type mismatch; safe at runtime
    const { error: insertError } = await supabase.from("health_events").insert(row as any);

    if (insertError) {
      setLoading(false);
      toast({ message: "Failed to log health event", variant: "error" });
      return;
    }

    setForm(initial);
    setLoading(false);
    onClose();
    toast({ message: "Health event logged successfully", variant: "success" });
    router.refresh();
  }

  return (
    <Modal open={open} onClose={onClose} title="Log Health Event">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Animal *</label>
          <select className="input" value={form.animal_id} onChange={(e) => set("animal_id", e.target.value)}>
            <option value="">Select animal…</option>
            {animals.map((a) => (
              <option key={a.animal_id} value={a.animal_id}>{a.tag_number} — {a.breed}</option>
            ))}
          </select>
          {errors.animal_id && <p className="text-xs text-alert-red mt-1">{errors.animal_id}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date *</label>
            <input type="date" className="input" value={form.event_date} onChange={(e) => set("event_date", e.target.value)} />
            {errors.event_date && <p className="text-xs text-alert-red mt-1">{errors.event_date}</p>}
          </div>
          <div>
            <label className="label">Type *</label>
            <select className="input" value={form.event_type} onChange={(e) => set("event_type", e.target.value)}>
              {["disease", "injury", "treatment", "checkup", "other"].map((t) => (
                <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Condition</label>
            <input className="input" value={form.condition_name} onChange={(e) => set("condition_name", e.target.value)} placeholder="e.g. Lumpy Skin Disease" />
          </div>
          <div>
            <label className="label">Severity</label>
            <select className="input" value={form.severity ?? ""} onChange={(e) => set("severity", e.target.value || undefined)}>
              <option value="">Select…</option>
              {["mild", "moderate", "severe", "critical"].map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Symptoms</label>
          <textarea className="input min-h-[60px] resize-y" value={form.symptoms} onChange={(e) => set("symptoms", e.target.value)} placeholder="Describe symptoms…" />
        </div>

        <div>
          <label className="label">Treatment Given</label>
          <textarea className="input min-h-[60px] resize-y" value={form.treatment_given} onChange={(e) => set("treatment_given", e.target.value)} placeholder="Describe treatment…" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Vet Name</label>
            <input className="input" value={form.vet_name} onChange={(e) => set("vet_name", e.target.value)} />
          </div>
          <div>
            <label className="label">Outcome</label>
            <select className="input" value={form.outcome ?? ""} onChange={(e) => set("outcome", e.target.value || undefined)}>
              <option value="">Select…</option>
              {["recovering", "recovered", "ongoing", "referred", "deceased"].map((o) => (
                <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Follow-up Date</label>
          <input type="date" className="input" value={form.followup_date} onChange={(e) => set("followup_date", e.target.value)} />
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea className="input min-h-[60px] resize-y" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>

        <div className="pt-2 flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center h-11 disabled:opacity-60">
            {loading ? <><span className="spinner" /> Saving…</> : "Log Event"}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center h-11">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
