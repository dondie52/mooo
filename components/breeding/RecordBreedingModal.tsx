"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { breedingSchema, type BreedingFormData } from "@/lib/validators/breeding";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";
import { BREEDING_EVENT_OPTIONS } from "@/lib/utils/breeding";
import { cn } from "@/lib/utils";

type AnimalPick = Pick<Tables<"animals">, "animal_id" | "tag_number" | "breed" | "gender" | "status">;

interface RecordBreedingModalProps {
  open: boolean;
  onClose: () => void;
  animals: AnimalPick[];
}

const initial: BreedingFormData = {
  animal_id: "",
  event_type: "mating",
  event_date: new Date().toISOString().split("T")[0],
  mate_tag_number: "",
  expected_calving_date: "",
  notes: "",
};

export default function RecordBreedingModal({ open, onClose, animals }: RecordBreedingModalProps) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<BreedingFormData>(initial);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [loading, setLoading] = useState(false);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  // Auto-calculate expected calving date: mating date + 283 days
  useEffect(() => {
    if (form.event_type === "mating" && form.event_date) {
      const d = new Date(form.event_date);
      d.setDate(d.getDate() + 283);
      setForm((f) => ({ ...f, expected_calving_date: d.toISOString().split("T")[0] }));
    }
  }, [form.event_type, form.event_date]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = breedingSchema.safeParse(form);
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
    if (!user) { setLoading(false); return; }

    const row = {
      animal_id: result.data.animal_id,
      event_type: result.data.event_type as "mating" | "ai" | "pregnant" | "calving" | "abortion" | "weaning",
      event_date: result.data.event_date,
      mate_tag: result.data.mate_tag_number || null,
      sire_breed: null,
      notes: result.data.notes || null,
      logged_by: user.id,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await supabase.from("breeding_records").insert(row as any);

    if (insertError) {
      toast({ message: insertError.message, variant: "error" });
      setLoading(false);
      return;
    }

    setForm(initial);
    setLoading(false);
    onClose();
    router.refresh();
    toast({ message: "Breeding event recorded successfully", variant: "success" });
  }

  const femaleAnimals = animals.filter((a) => a.gender === "female");

  return (
    <Modal open={open} onClose={onClose} title="Record Breeding Event">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Animal (Female) *</label>
          <select className="input" value={form.animal_id} onChange={(e) => set("animal_id", e.target.value)}>
            <option value="">Select animal…</option>
            {femaleAnimals.map((a) => (
              <option key={a.animal_id} value={a.animal_id}>{a.tag_number} — {a.breed}</option>
            ))}
          </select>
          {errors.animal_id && <p className="text-xs text-alert-red mt-1">{errors.animal_id}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Event Type *</label>
            <div className="flex flex-wrap gap-2">
              {BREEDING_EVENT_OPTIONS.map(({ value, label }) => {
                const selected = form.event_type === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set("event_type", value)}
                    className={cn(
                      "px-3.5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer border",
                      selected
                        ? "bg-forest-mid text-white border-forest-mid"
                        : "bg-white text-forest-deep border-border hover:bg-earth-sand"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="label">Date *</label>
            <input type="date" className="input" value={form.event_date} onChange={(e) => set("event_date", e.target.value)} />
            {errors.event_date && <p className="text-xs text-alert-red mt-1">{errors.event_date}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Mate Tag Number</label>
            <input className="input" value={form.mate_tag_number} onChange={(e) => set("mate_tag_number", e.target.value)} placeholder="e.g. BW-KW-0005" />
          </div>
          <div>
            <label className="label">Expected Calving</label>
            <input type="date" className="input" value={form.expected_calving_date} onChange={(e) => set("expected_calving_date", e.target.value)} />
            {form.event_type === "mating" && (
              <p className="text-[10px] text-muted mt-1">Auto-calculated: date + 283 days</p>
            )}
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea className="input min-h-[60px] resize-y" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>

        <div className="pt-2 flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center h-11 disabled:opacity-60">
            {loading ? <><span className="spinner" /> Saving…</> : "Record Event"}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center h-11">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
