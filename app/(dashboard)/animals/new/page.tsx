"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { animalSchema, type AnimalFormData } from "@/lib/validators/animal";
import { createClient } from "@/lib/supabase/client";

const CATTLE_BREEDS = ["Brahman", "Tswana", "Cross", "Angus", "Hereford", "Simmental", "Other"];
const GOAT_BREEDS = ["Tswana", "Boer", "Kalahari Red", "Saanen", "Cross", "Other"];
const SHEEP_BREEDS = ["Dorper", "Karakul", "Merino", "Tswana", "Cross", "Other"];

function breedsForType(type: string) {
  if (type === "goat") return GOAT_BREEDS;
  if (type === "sheep") return SHEEP_BREEDS;
  return CATTLE_BREEDS;
}

const initial: AnimalFormData = {
  tag_number: "",
  animal_type: "cattle",
  breed: "",
  gender: "female",
  date_of_birth: "",
  colour: "",
  location: "",
  acquired_date: "",
  acquired_how: "born",
  notes: "",
};

export default function NewAnimalPage() {
  const router = useRouter();
  const [form, setForm] = useState<AnimalFormData>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof AnimalFormData, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [breedSelection, setBreedSelection] = useState("");

  function set<K extends keyof AnimalFormData>(key: K, value: AnimalFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = animalSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.issues.forEach((i) => {
        const key = i.path[0] as keyof AnimalFormData;
        if (!fieldErrors[key]) fieldErrors[key] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in");
      setLoading(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- insert types resolve to `never` due to generated type mismatch; safe at runtime
    const { error: insertError } = await (supabase.from("animals") as any).insert({
      tag_number: result.data.tag_number,
      animal_type: result.data.animal_type,
      breed: result.data.breed,
      gender: result.data.gender,
      date_of_birth: result.data.date_of_birth || null,
      colour: result.data.colour || null,
      location: result.data.location || null,
      acquired_date: result.data.acquired_date,
      acquired_how: result.data.acquired_how,
      notes: result.data.notes || null,
      owner_id: user.id,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push("/animals");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Link href="/animals" className="inline-flex items-center gap-2 text-sm text-muted hover:text-forest-mid">
        <ArrowLeft className="w-4 h-4" /> Back to animals
      </Link>

      <div className="animate-fade-up">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">Register Animal</h1>
        <p className="text-sm text-muted mt-1">Add a new animal to your herd</p>
      </div>

      <div className="card max-w-3xl">
        <div className="accent-bar w-16 mb-6" />

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-alert-red text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Tag Number *" error={errors.tag_number}>
              <input className="input" value={form.tag_number} onChange={(e) => set("tag_number", e.target.value)} placeholder="e.g. BW-KW-0001" />
            </Field>
            <Field label="Animal Type *" error={errors.animal_type}>
              <select className="input" value={form.animal_type} onChange={(e) => {
                set("animal_type", e.target.value as AnimalFormData["animal_type"]);
                setBreedSelection("");
                set("breed", "");
              }}>
                <option value="cattle">Cattle</option>
                <option value="goat">Goat</option>
                <option value="sheep">Sheep</option>
              </select>
            </Field>
            <Field label="Breed *" error={errors.breed}>
              <select
                className="input"
                value={breedSelection}
                onChange={(e) => {
                  setBreedSelection(e.target.value);
                  if (e.target.value !== "Other") {
                    set("breed", e.target.value);
                  } else {
                    set("breed", "");
                  }
                }}
              >
                <option value="">— Select —</option>
                {breedsForType(form.animal_type).map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {breedSelection === "Other" && (
                <input
                  className="input mt-2"
                  value={form.breed}
                  onChange={(e) => set("breed", e.target.value)}
                  placeholder="Enter breed name"
                />
              )}
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Gender *" error={errors.gender}>
              <select className="input" value={form.gender} onChange={(e) => set("gender", e.target.value as AnimalFormData["gender"])}>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </Field>
            <Field label="Date of Birth" error={errors.date_of_birth}>
              <input type="date" className="input" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Colour" error={errors.colour}>
              <input className="input" value={form.colour} onChange={(e) => set("colour", e.target.value)} placeholder="e.g. Brown, Red-brown" />
            </Field>
            <Field label="Location" error={errors.location}>
              <input className="input" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Molepolole, Gabane" />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Acquired Date *" error={errors.acquired_date}>
              <input type="date" className="input" value={form.acquired_date} onChange={(e) => set("acquired_date", e.target.value)} />
            </Field>
            <Field label="Acquired How *" error={errors.acquired_how}>
              <select className="input" value={form.acquired_how} onChange={(e) => set("acquired_how", e.target.value as AnimalFormData["acquired_how"])}>
                <option value="born">Born on farm</option>
                <option value="purchased">Purchased</option>
                <option value="donated">Donated</option>
                <option value="inherited">Inherited</option>
                <option value="other">Other</option>
              </select>
            </Field>
          </div>

          <Field label="Notes" error={errors.notes}>
            <textarea className="input min-h-[80px] resize-y" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional notes..." />
          </Field>

          <div className="pt-2">
            <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto justify-center h-11 disabled:opacity-60">
              {loading ? "Registering..." : "Register Animal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-xs text-alert-red mt-1">{error}</p>}
    </div>
  );
}
