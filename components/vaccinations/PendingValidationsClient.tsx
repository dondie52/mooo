"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Check, X, MessageCircleQuestion, Syringe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";

export type PendingRow = {
  vacc_id: string;
  animal_id: string;
  tag_number: string;
  breed: string;
  vaccine_name: string;
  date_given: string;
  next_due_date: string | null;
  batch_number: string | null;
  notes: string | null;
  farmer_id: string;
  farmer_name: string;
  logged_at: string;
};

type ActionKind = "certify" | "reject" | "clarify";

interface PendingValidationsClientProps {
  rows: PendingRow[];
  onRefresh: () => void;
}

export default function PendingValidationsClient({
  rows,
  onRefresh,
}: PendingValidationsClientProps) {
  const toast = useToast();
  const [active, setActive] = useState<{ row: PendingRow; kind: ActionKind } | null>(
    null
  );
  const [noteValue, setNoteValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function openAction(row: PendingRow, kind: ActionKind) {
    setActive({ row, kind });
    setNoteValue("");
  }

  function closeAction() {
    if (submitting) return;
    setActive(null);
    setNoteValue("");
  }

  async function submitAction() {
    if (!active) return;
    const trimmed = noteValue.trim();

    if ((active.kind === "reject" || active.kind === "clarify") && !trimmed) {
      toast({ message: "Please provide a reason.", variant: "error" });
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    let rpcError;
    if (active.kind === "certify") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.rpc as any)("certify_vaccination", {
        p_vacc_id: active.row.vacc_id,
        p_vet_notes: trimmed || null,
      });
      rpcError = error;
    } else {
      // Reject and Clarify share the same backend path; the UI wording differs
      // so the vet can nudge the farmer toward a fix vs. a permanent no.
      const prefix = active.kind === "clarify" ? "Clarification needed: " : "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.rpc as any)("reject_vaccination", {
        p_vacc_id: active.row.vacc_id,
        p_reason: prefix + trimmed,
      });
      rpcError = error;
    }

    setSubmitting(false);

    if (rpcError) {
      toast({
        message: rpcError.message || "Action failed. Please try again.",
        variant: "error",
      });
      return;
    }

    const successMsg =
      active.kind === "certify"
        ? "Vaccination certified"
        : active.kind === "clarify"
        ? "Clarification requested"
        : "Vaccination rejected";
    toast({ message: successMsg, variant: "success" });
    setActive(null);
    setNoteValue("");
    onRefresh();
  }

  const modalTitle = !active
    ? ""
    : active.kind === "certify"
    ? "Certify vaccination"
    : active.kind === "clarify"
    ? "Request clarification"
    : "Reject vaccination";

  const modalSubtext = !active
    ? ""
    : active.kind === "certify"
    ? "Confirm this entry is accurate. Certification locks the record."
    : active.kind === "clarify"
    ? "The farmer can edit and resubmit the entry. Describe what they should clarify."
    : "Rejection is visible to the farmer. Explain why so they can correct the entry.";

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">
          Pending Validations
        </h1>
        <p className="text-sm text-muted mt-1">
          Review vaccination entries logged by your assigned farmers and certify or
          reject each one.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No pending validations"
          description="Farmer-logged vaccinations awaiting your review will appear here."
        />
      ) : (
        <div className="card">
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <caption className="sr-only">Pending vaccination validations</caption>
              <thead>
                <tr className="border-b border-border">
                  {["Farmer", "Animal", "Vaccine", "Date Given", "Batch", "Logged", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-6 pb-3 text-[11px] font-semibold uppercase tracking-wide text-muted"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.vacc_id}
                    className="border-b border-border/50 last:border-0 align-top"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-forest-deep">{r.farmer_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/animals/detail?id=${r.animal_id}`}
                        className="font-medium text-forest-deep hover:text-forest-accent"
                      >
                        {r.tag_number}
                      </Link>
                      <div className="text-xs text-muted">{r.breed}</div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {r.vaccine_name}
                      {r.notes && (
                        <div className="text-xs text-muted mt-1 max-w-xs">
                          &ldquo;{r.notes}&rdquo;
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted whitespace-nowrap">
                      {formatDate(r.date_given)}
                    </td>
                    <td className="px-6 py-4 text-muted">{r.batch_number || "—"}</td>
                    <td className="px-6 py-4 text-muted whitespace-nowrap">
                      {formatDate(r.logged_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openAction(r, "certify")}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-alert-green/10 text-alert-green hover:bg-alert-green/20 text-xs font-medium px-3 py-1.5 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" /> Certify
                        </button>
                        <button
                          onClick={() => openAction(r, "clarify")}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gold/10 text-gold-dark hover:bg-gold/20 text-xs font-medium px-3 py-1.5 transition-colors"
                        >
                          <MessageCircleQuestion className="w-3.5 h-3.5" /> Clarify
                        </button>
                        <button
                          onClick={() => openAction(r, "reject")}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-alert-red/10 text-alert-red hover:bg-alert-red/20 text-xs font-medium px-3 py-1.5 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={!!active} onClose={closeAction} title={modalTitle}>
        {active && (
          <div className="space-y-4">
            <p className="text-sm text-muted">{modalSubtext}</p>
            <div className="rounded-lg border border-border bg-earth-cream/50 p-3 text-sm">
              <div className="flex items-center gap-2 text-forest-deep font-medium">
                <Syringe className="w-4 h-4 text-forest-accent" />
                {active.row.vaccine_name}
              </div>
              <div className="text-xs text-muted mt-1">
                {active.row.tag_number} · {active.row.farmer_name} ·{" "}
                {formatDate(active.row.date_given)}
              </div>
            </div>
            <div>
              <label className="label">
                {active.kind === "certify" ? "Note (optional)" : "Reason *"}
              </label>
              <textarea
                className="input min-h-[90px] resize-y"
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                placeholder={
                  active.kind === "certify"
                    ? "Optional note attached to the certification."
                    : active.kind === "clarify"
                    ? "e.g. Please upload the batch label photo."
                    : "e.g. Vaccine name doesn't match the batch."
                }
              />
            </div>
            <div className="pt-2 flex gap-3">
              <button
                onClick={submitAction}
                disabled={submitting}
                className="btn-primary flex-1 justify-center h-11 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <span className="spinner" /> Saving…
                  </>
                ) : active.kind === "certify" ? (
                  "Certify"
                ) : active.kind === "clarify" ? (
                  "Request clarification"
                ) : (
                  "Reject"
                )}
              </button>
              <button
                type="button"
                onClick={closeAction}
                disabled={submitting}
                className="btn-secondary flex-1 justify-center h-11"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
