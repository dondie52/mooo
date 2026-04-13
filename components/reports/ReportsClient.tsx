"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Syringe, MapPin, HeartPulse, Beef, Download, Printer, FileText } from "lucide-react";
import { downloadCsv } from "@/lib/utils/csv";
import type { Tables } from "@/lib/supabase/database.types";
import type { LucideIcon } from "lucide-react";

type Animal = Tables<"animals">;
type Vaccination = Tables<"vaccinations"> & { animals: { tag_number: string } | null };
type HealthEvent = Tables<"health_events"> & { animals: { tag_number: string } | null };
type Movement = Tables<"movements"> & { animals: { tag_number: string } | null };

interface ReportsClientProps {
  animals: Animal[];
  vaccinations: Vaccination[];
  healthEvents: HealthEvent[];
  movements: Movement[];
}

interface ReportCard {
  title: string;
  description: string;
  icon: LucideIcon;
  hasDateFilter: boolean;
  dateKey: string;
  stats: { label: string; value: string | number }[];
  onExport: (from: string, to: string) => void;
  onPrint: (from: string, to: string) => void;
}

function filterByDateRange<T extends Record<string, any>>(
  items: T[],
  dateField: string,
  from: string,
  to: string
): T[] {
  return items.filter((item) => {
    const d = item[dateField] as string | null;
    if (!d) return true;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });
}

function printReport(title: string, headers: string[], rows: Record<string, string>[]) {
  const win = window.open("", "_blank");
  if (!win) return;

  // Build the document safely using DOM APIs
  const doc = win.document;
  doc.open();

  const style = doc.createElement("style");
  style.textContent = `
    body{font-family:Inter,system-ui,sans-serif;margin:0;padding:24px;color:#1c3829}
    h1{font-size:20px;margin:0 0 4px}
    .sub{font-size:12px;color:#6b7564;margin-bottom:16px}
    table{width:100%;border-collapse:collapse}
    th{text-align:left;padding:8px 10px;border-bottom:2px solid #0f2318;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7564}
    td{padding:6px 10px;border-bottom:1px solid #e5e0d2;font-size:13px}
    .header{background:#0f2318;color:#c8861a;padding:16px 24px;margin:-24px -24px 24px}
    .header h1{color:#c8861a} .header .sub{color:#e8dfc8}
    .footer{margin-top:24px;text-align:center;font-size:10px;color:#6b7564}
    @media print{.header{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  `;
  doc.head.appendChild(style);
  doc.title = `${title} — LMHTS`;

  // Header
  const headerDiv = doc.createElement("div");
  headerDiv.className = "header";
  const h1 = doc.createElement("h1");
  h1.textContent = `LMHTS — ${title}`;
  const sub = doc.createElement("div");
  sub.className = "sub";
  sub.textContent = `Generated ${new Date().toLocaleDateString()} · Livestock Management & Health Tracking System`;
  headerDiv.appendChild(h1);
  headerDiv.appendChild(sub);
  doc.body.appendChild(headerDiv);

  // Table
  const table = doc.createElement("table");
  const thead = doc.createElement("thead");
  const headerRow = doc.createElement("tr");
  for (const h of headers) {
    const th = doc.createElement("th");
    th.textContent = h;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = doc.createElement("tbody");
  for (const row of rows) {
    const tr = doc.createElement("tr");
    for (const h of headers) {
      const td = doc.createElement("td");
      td.textContent = row[h] ?? "";
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  doc.body.appendChild(table);

  // Footer
  const footer = doc.createElement("div");
  footer.className = "footer";
  footer.textContent = "LMHTS — BMC Compliance Report · University of Botswana";
  doc.body.appendChild(footer);

  doc.close();
  win.print();
}

export default function ReportsClient({ animals, vaccinations, healthEvents, movements }: ReportsClientProps) {
  const router = useRouter();
  const [selectedAnimalId, setSelectedAnimalId] = useState("");
  const [dateRanges, setDateRanges] = useState<Record<string, { from: string; to: string }>>({
    vaccination: { from: "", to: "" },
    traceability: { from: "", to: "" },
    health: { from: "", to: "" },
  });

  function setRange(key: string, field: "from" | "to", value: string) {
    setDateRanges((r) => ({ ...r, [key]: { ...r[key], [field]: value } }));
  }

  const today = new Date().toISOString().split("T")[0];
  const activeAnimals = animals.filter((a) => a.status === "active");
  const overdueVacc = vaccinations.filter((v) => v.next_due_date && v.next_due_date < today);
  const uniqueVaccAnimals = new Set(
    vaccinations
      .filter((v) => !v.next_due_date || v.next_due_date >= today)
      .map((v) => v.animal_id)
  );
  const coveragePct = activeAnimals.length > 0
    ? Math.round((uniqueVaccAnimals.size / activeAnimals.length) * 100)
    : 0;

  const topCondition = healthEvents.reduce<Record<string, number>>((acc, e) => {
    const name = e.condition_name || e.event_type;
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  const topConditionName = Object.entries(topCondition).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const reports: ReportCard[] = [
    {
      title: "Vaccination Compliance",
      description: "BMC vaccination coverage, overdue records, and compliance status",
      icon: Syringe,
      hasDateFilter: true,
      dateKey: "vaccination",
      stats: [
        { label: "Total Vaccinations", value: vaccinations.length },
        { label: "Overdue", value: overdueVacc.length },
        { label: "Coverage", value: `${coveragePct}%` },
        { label: "Status", value: coveragePct >= 80 ? "Compliant" : "Below minimum" },
      ],
      onExport: (from, to) => {
        const filtered = filterByDateRange(vaccinations, "date_given", from, to);
        const headers = ["animal_tag", "vaccine_name", "date_given", "next_due_date", "vet_name", "batch_number", "status"];
        downloadCsv("vaccination_compliance.csv", headers,
          filtered.map((v) => ({
            animal_tag: v.animals?.tag_number ?? "",
            vaccine_name: v.vaccine_name,
            date_given: v.date_given,
            next_due_date: v.next_due_date ?? "",
            vet_name: v.vet_name ?? "",
            batch_number: v.batch_number ?? "",
            status: v.next_due_date && v.next_due_date < today ? "Overdue" : "Current",
          }))
        );
      },
      onPrint: (from, to) => {
        const filtered = filterByDateRange(vaccinations, "date_given", from, to);
        const headers = ["animal_tag", "vaccine_name", "date_given", "next_due_date", "status"];
        printReport("Vaccination Compliance Certificate", headers,
          filtered.map((v) => ({
            animal_tag: v.animals?.tag_number ?? "",
            vaccine_name: v.vaccine_name,
            date_given: v.date_given,
            next_due_date: v.next_due_date ?? "",
            status: v.next_due_date && v.next_due_date < today ? "Overdue" : "Current",
          }))
        );
      },
    },
    {
      title: "Animal Traceability",
      description: "Movement history and location tracking for BAITS compliance",
      icon: MapPin,
      hasDateFilter: true,
      dateKey: "traceability",
      stats: [
        { label: "Total Movements", value: movements.length },
        { label: "Animals Tracked", value: new Set(movements.map((m) => m.animal_id)).size },
      ],
      onExport: (from, to) => {
        const filtered = filterByDateRange(movements, "movement_date", from, to);
        const headers = ["animal_tag", "movement_date", "movement_type", "from_location", "to_location", "permit_number", "notes"];
        downloadCsv("animal_traceability.csv", headers,
          filtered.map((m) => ({
            animal_tag: m.animals?.tag_number ?? "",
            movement_date: m.movement_date,
            movement_type: m.movement_type,
            from_location: m.from_location ?? "",
            to_location: m.to_location ?? "",
            permit_number: m.permit_number ?? "",
            notes: m.notes ?? "",
          }))
        );
      },
      onPrint: (from, to) => {
        const filtered = filterByDateRange(movements, "movement_date", from, to);
        const headers = ["animal_tag", "movement_date", "movement_type", "from_location", "to_location", "permit_number"];
        printReport("Animal Traceability Report (BAITS)", headers,
          filtered.map((m) => ({
            animal_tag: m.animals?.tag_number ?? "",
            movement_date: m.movement_date,
            movement_type: m.movement_type,
            from_location: m.from_location ?? "",
            to_location: m.to_location ?? "",
            permit_number: m.permit_number ?? "",
          }))
        );
      },
    },
    {
      title: "Health Summary",
      description: "Disease and treatment records across your herd",
      icon: HeartPulse,
      hasDateFilter: true,
      dateKey: "health",
      stats: [
        { label: "Total Events", value: healthEvents.length },
        { label: "Top Condition", value: topConditionName },
        { label: "Critical Cases", value: healthEvents.filter((e) => e.severity === "critical").length },
      ],
      onExport: (from, to) => {
        const filtered = filterByDateRange(healthEvents, "event_date", from, to);
        const headers = ["animal_tag", "event_date", "event_type", "condition_name", "severity", "treatment_given", "outcome"];
        downloadCsv("health_summary.csv", headers,
          filtered.map((e) => ({
            animal_tag: e.animals?.tag_number ?? "",
            event_date: e.event_date,
            event_type: e.event_type,
            condition_name: e.condition_name ?? "",
            severity: e.severity ?? "",
            treatment_given: e.treatment_given ?? "",
            outcome: e.outcome ?? "",
          }))
        );
      },
      onPrint: (from, to) => {
        const filtered = filterByDateRange(healthEvents, "event_date", from, to);
        const headers = ["animal_tag", "event_date", "event_type", "condition_name", "severity", "treatment_given", "outcome"];
        printReport("Health Events Summary", headers,
          filtered.map((e) => ({
            animal_tag: e.animals?.tag_number ?? "",
            event_date: e.event_date,
            event_type: e.event_type,
            condition_name: e.condition_name ?? "",
            severity: e.severity ?? "",
            treatment_given: e.treatment_given ?? "",
            outcome: e.outcome ?? "",
          }))
        );
      },
    },
    {
      title: "Herd Inventory",
      description: "Complete animal register with breed, status, and location data",
      icon: Beef,
      hasDateFilter: false,
      dateKey: "inventory",
      stats: [
        { label: "Total Animals", value: animals.length },
        { label: "Active", value: activeAnimals.length },
        { label: "Sold", value: animals.filter((a) => a.status === "sold").length },
        { label: "Deceased", value: animals.filter((a) => a.status === "deceased").length },
      ],
      onExport: () => {
        const headers = ["tag_number", "breed", "gender", "location", "status", "date_of_birth", "acquired_date"];
        downloadCsv("herd_inventory.csv", headers,
          animals.map((a) => ({
            tag_number: a.tag_number,
            breed: a.breed,
            gender: a.gender,
            location: a.location ?? "",
            status: a.status,
            date_of_birth: a.date_of_birth ?? "",
            acquired_date: a.acquired_date,
          }))
        );
      },
      onPrint: () => {
        const headers = ["tag_number", "breed", "gender", "location", "status", "acquired_date"];
        printReport("Herd Inventory Report", headers,
          animals.map((a) => ({
            tag_number: a.tag_number,
            breed: a.breed,
            gender: a.gender,
            location: a.location ?? "",
            status: a.status,
            acquired_date: a.acquired_date,
          }))
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">Reports</h1>
        <p className="text-sm text-muted mt-1">BMC compliance and herd analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reports.map((report) => {
          const Icon = report.icon;
          const range = dateRanges[report.dateKey] ?? { from: "", to: "" };
          return (
            <div key={report.title} className="card card-hover">
              <div className="accent-bar w-12 mb-4" />

              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-gold-dark" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">{report.title}</h3>
                  <p className="text-xs text-muted mt-0.5">{report.description}</p>
                </div>
              </div>

              {report.hasDateFilter && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="label">From</label>
                    <input
                      type="date"
                      className="input"
                      value={range.from}
                      onChange={(e) => setRange(report.dateKey, "from", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">To</label>
                    <input
                      type="date"
                      className="input"
                      value={range.to}
                      onChange={(e) => setRange(report.dateKey, "to", e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-2 mb-5">
                {report.stats.map((stat) => (
                  <div key={stat.label}>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">{stat.label}</div>
                    <div className="text-sm font-semibold text-forest-deep">{stat.value}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => report.onExport(range.from, range.to)}
                  className="btn-gold flex-1 justify-center"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
                <button
                  onClick={() => report.onPrint(range.from, range.to)}
                  className="btn-secondary flex-1 justify-center"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
              </div>
            </div>
          );
        })}

        {/* Vaccination Certificate card */}
        <div className="card card-hover">
          <div className="accent-bar w-12 mb-4" />
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-gold-dark" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">Vaccination Certificate</h3>
              <p className="text-xs text-muted mt-0.5">
                Per-animal printable certificate with vaccination &amp; movement history for BMC/BAITS compliance
              </p>
            </div>
          </div>

          <div className="mb-5">
            <label className="label">Select animal</label>
            <select
              className="input"
              value={selectedAnimalId}
              onChange={(e) => setSelectedAnimalId(e.target.value)}
            >
              <option value="">Choose an animal...</option>
              {animals
                .filter((a) => a.status === "active")
                .sort((a, b) => a.tag_number.localeCompare(b.tag_number))
                .map((a) => (
                  <option key={a.animal_id} value={a.animal_id}>
                    {a.tag_number} — {a.breed} ({a.gender})
                  </option>
                ))}
            </select>
          </div>

          <button
            onClick={() => {
              if (selectedAnimalId) router.push(`/reports/certificate?id=${selectedAnimalId}`);
            }}
            disabled={!selectedAnimalId}
            className="btn-gold w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" /> Generate Certificate
          </button>
        </div>
      </div>
    </div>
  );
}
