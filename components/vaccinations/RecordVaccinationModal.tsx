"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { vaccinationSchema, type VaccinationFormData } from "@/lib/validators/vaccination";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

interface RecordVaccinationModalProps {
  open: boolean;
  onClose: () => void;
  animals: Pick<Tables<"animals">, "animal_id" | "tag_number" | "breed" | "status">[];
}

const COMMON_VACCINES = ["FMD", "Anthrax", "Blackleg", "CBPP", "Brucellosis", "LSD"];

const initial: VaccinationFormData = {
  animal_id: "",
  vaccine_name: "",
  date_given: new Date().toISOString().split("T")[0],
  next_due_date: "",
  vet_name: "",
  batch_number: "",
  notes: "",
};

export default function RecordVaccinationModal({ open, onClose, animals }: RecordVaccinationModalProps) {
  const toast = useToast();
  const router = useRouter();
  const [form, setForm] = useState<VaccinationFormData>(initial);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [loading, setLoading] = useState(false);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = vaccinationSchema.safeParse(form);
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
      return;
    }

    const row = {
      animal_id: result.data.animal_id,
      vaccine_name: result.data.vaccine_name,
      date_given: result.data.date_given,
      next_due_date: result.data.next_due_date || null,
      vet_name: result.data.vet_name || null,
      batch_number: result.data.batch_number || null,
      notes: result.data.notes || null,
      logged_by: user.id,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- insert types resolve to `never` due to generated type mismatch; safe at runtime
    const { error: insertError } = await supabase.from("vaccinations").insert(row as any);

    if (insertError) {
      setLoading(false);
      toast({ message: "Failed to record vaccination. Please try again.", variant: "error" });
      return;
    }

    setForm(initial);
    setLoading(false);
    onClose();
    router.refresh();
    toast({ message: "Vaccination recorded successfully", variant: "success" });
  }

  return (
    <Modal open={open} onClose={onClose} title="Record Vaccination">
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

        <div>
          <label className="label">Vaccine Name *</label>
          <input
            className="input"
            value={form.vaccine_name}
            onChange={(e) => set("vaccine_name", e.target.value)}
            placeholder="e.g. FMD, Anthrax"
            list="vaccine-suggestions"
          />
          <datalist id="vaccine-suggestions">
            {COMMON_VACCINES.map((v) => <option key={v} value={v} />)}
          </datalist>
          {errors.vaccine_name && <p className="text-xs text-alert-red mt-1">{errors.vaccine_name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date Given *</label>
            <input type="date" className="input" value={form.date_given} onChange={(e) => set("date_given", e.target.value)} />
            {errors.date_given && <p className="text-xs text-alert-red mt-1">{errors.date_given}</p>}
          </div>
          <div>
            <label className="label">Next Due Date</label>
            <input type="date" className="input" value={form.next_due_date} onChange={(e) => set("next_due_date", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Vet Name</label>
            <input className="input" value={form.vet_name} onChange={(e) => set("vet_name", e.target.value)} />
          </div>
          <div>
            <label className="label">Batch Number</label>
            <input className="input" value={form.batch_number} onChange={(e) => set("batch_number", e.target.value)} placeholder="e.g. FMD-2025-A1" />
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea className="input min-h-[60px] resize-y" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>

        <div className="pt-2 flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center h-11 disabled:opacity-60">
            {loading ? <><span className="spinner" /> Saving…</> : "Record Vaccination"}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center h-11">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
