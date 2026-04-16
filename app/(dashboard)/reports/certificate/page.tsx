"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate, vaccinationStatus } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/database.types";

type Animal = Tables<"animals">;
type Vaccination = Tables<"vaccinations">;
type Movement = Tables<"movements">;
type Profile = Tables<"profiles">;

interface CertificateData {
  animal: Animal;
  owner: Profile;
  vaccinations: Vaccination[];
  movements: Movement[];
}

export default function CertificatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const animalId = searchParams.get("id");
  const [data, setData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!animalId) { router.push("/reports"); return; }
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: animal } = await supabase
        .from("animals")
        .select("*")
        .eq("animal_id", animalId)
        .single();

      if (!animal) { router.push("/reports"); return; }

      const [{ data: vaccinations }, { data: movements }, { data: owner }] = await Promise.all([
        supabase.from("vaccinations").select("*").eq("animal_id", animalId).order("date_given", { ascending: false }),
        supabase.from("movements").select("*").eq("animal_id", animalId).order("movement_date", { ascending: false }),
        supabase.from("profiles").select("*").eq("id", animal.owner_id).single(),
      ]);

      setData({
        animal,
        owner: owner!,
        vaccinations: vaccinations ?? [],
        movements: movements ?? [],
      });
      setLoading(false);
    };
    load();
  }, [animalId, router]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-2 border-forest-mid border-t-transparent rounded-full" />
      </div>
    );
  }

  const { animal, owner, vaccinations, movements } = data;
  const generatedDate = formatDate(new Date());
  const docRef = `CERT-${animal.tag_number}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          @page { margin: 15mm; size: A4; }
          .no-print { display: none !important; }
          body { background: white !important; }
          main { padding: 0 !important; }
          .certificate { box-shadow: none !important; border: none !important; }
          .print-colors { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Toolbar (hidden in print) */}
      <div className="no-print flex items-center justify-between mb-6 animate-fade-up">
        <Link href="/reports" className="inline-flex items-center gap-2 text-sm text-muted hover:text-forest-mid">
          <ArrowLeft className="w-4 h-4" /> Back to reports
        </Link>
        <button
          onClick={() => window.print()}
          className="btn-primary"
        >
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      {/* Certificate document */}
      <div className="certificate bg-white rounded-xl shadow-card overflow-hidden print-colors">
        {/* Header band */}
        <div className="bg-forest-mid px-8 py-6 print-colors">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl font-semibold text-white">LMHTS</h1>
              <p className="text-white/70 text-xs mt-0.5">
                Livestock Management &amp; Health Tracking System
              </p>
            </div>
          </div>
        </div>

        {/* Document title */}
        <div className="px-8 py-5 border-b-2 border-gold text-center">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.15em] text-forest-deep">
            Vaccination Certificate &amp; Traceability Record
          </h2>
        </div>

        {/* Animal profile block */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-2 gap-x-10 gap-y-4 border-b border-border pb-6">
            <ProfileField label="BAITS Tag ID" value={animal.tag_number} />
            <ProfileField label="Animal Type / Breed" value={`${animal.animal_type} — ${animal.breed}`} capitalize />
            <ProfileField label="Birth Date" value={animal.date_of_birth ? formatDate(animal.date_of_birth) : "Not recorded"} />
            <ProfileField label="Sex" value={animal.gender} capitalize />
            <ProfileField label="Owner / Farmer" value={owner.full_name} />
            <ProfileField label="Farm Location" value={[owner.farm_name, owner.district].filter(Boolean).join(", ") || "Not specified"} />
            <ProfileField label="Primary Location" value={animal.location || "Not specified"} />
          </div>
        </div>

        {/* Vaccination history table */}
        <div className="px-8 pb-6">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-forest-deep mb-3">
            Vaccination History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-forest-mid print-colors">
                  {["Vaccine", "Date Administered", "Batch No.", "Veterinarian", "Next Due", "Status"].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-white font-semibold uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vaccinations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-muted italic">
                      No vaccination records on file.
                    </td>
                  </tr>
                ) : (
                  vaccinations.map((v, i) => {
                    const status = vaccinationStatus(v.next_due_date);
                    return (
                      <tr key={v.vacc_id} className={cn(i % 2 === 1 && "bg-earth-cream/40", "print-colors")}>
                        <td className="px-3 py-2 font-medium">{v.vaccine_name}</td>
                        <td className="px-3 py-2">{formatDate(v.date_given)}</td>
                        <td className="px-3 py-2">{v.batch_number || "---"}</td>
                        <td className="px-3 py-2">{v.vet_name || "---"}</td>
                        <td className="px-3 py-2">{v.next_due_date ? formatDate(v.next_due_date) : "---"}</td>
                        <td className="px-3 py-2">
                          <span className={cn("badge text-[10px]", status.className)}>{status.label}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Movement history table */}
        <div className="px-8 pb-6">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-forest-deep mb-3">
            Movement History (BAITS Trace)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-forest-mid print-colors">
                  {["Date", "Movement Type", "From", "To", "Reason / Permit", "Documented By"].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-white font-semibold uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-muted italic">
                      No movement records on file.
                    </td>
                  </tr>
                ) : (
                  movements.map((m, i) => (
                    <tr key={m.movement_id} className={cn(i % 2 === 1 && "bg-earth-cream/40", "print-colors")}>
                      <td className="px-3 py-2">{formatDate(m.movement_date)}</td>
                      <td className="px-3 py-2 capitalize">{m.movement_type}</td>
                      <td className="px-3 py-2">{m.from_location || "---"}</td>
                      <td className="px-3 py-2">{m.to_location || "---"}</td>
                      <td className="px-3 py-2">{m.permit_number || m.notes || "---"}</td>
                      <td className="px-3 py-2">{owner.full_name}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer block */}
        <div className="px-8 py-6 border-t border-border">
          <div className="flex justify-between items-end mb-8">
            <div>
              <div className="w-[200px] border-t border-forest-deep mb-1" />
              <p className="text-[10px] text-muted">Authorised Signature</p>
            </div>
            <div>
              <div className="w-[200px] border-t border-forest-deep mb-1" />
              <p className="text-[10px] text-muted">Date</p>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-muted">
            <span>Generated on {generatedDate} &middot; Document reference: {docRef}</span>
          </div>
          <p className="text-[9px] text-muted/70 mt-2 leading-relaxed">
            This certificate is generated from farmer-maintained records in the LMHTS system. The format is aligned with BAITS documentation requirements and is intended to support BMC submission, but this document is not itself BMC-approved or independently verified. For official traceability, records should be cross-referenced with BAITS registration data held by the Department of Veterinary Services.
          </p>
        </div>
      </div>
    </>
  );
}

function ProfileField({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted mb-0.5">{label}</div>
      <div className={cn("text-sm font-medium text-forest-deep", capitalize && "capitalize")}>{value}</div>
    </div>
  );
}
