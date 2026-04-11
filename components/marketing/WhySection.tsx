import { ArrowRight, Mail } from "lucide-react";

const reasons = [
  {
    title: "Stop missing vaccinations",
    desc: "Automated reminders mean you will never miss an FMD or Anthrax vaccination date. Maintain the 80% coverage required by BMC.",
  },
  {
    title: "Qualify for higher BMC grades",
    desc: "Animals with complete digital records qualify for Prime, Super, and Good grades \u2014 and correspondingly higher prices.",
  },
  {
    title: "Protect your herd with early alerts",
    desc: "Rule-based disease detection flags outbreaks before they spread. With FMD confirmed in Botswana in 2026, early detection is critical.",
  },
  {
    title: "Access premium export markets",
    desc: "EU and South African export markets require full traceability. Digital records make it easy to produce the required documentation.",
  },
];

const previewStats = [
  { label: "Total Animals", value: "45", color: "text-alert-green" },
  { label: "Vaccination Coverage", value: "88%", color: "text-alert-green" },
  { label: "Overdue Vaccinations", value: "1", color: "text-alert-red" },
  { label: "Due This Week", value: "2", color: "text-gold-light" },
  { label: "BMC Compliance", value: "Compliant", color: "text-alert-green" },
  { label: "Active Health Events", value: "3", color: "text-gold-light" },
];

export default function WhySection() {
  return (
    <section id="why" className="bg-forest-deep py-20 px-6">
      <div className="max-w-[1080px] mx-auto">
        {/* Header */}
        <div className="animate-fade-up">
          <p className="text-xs font-bold text-gold-light uppercase tracking-[1.5px] mb-2">
            Why use our system
          </p>
          <h2
            className="font-display text-white font-semibold leading-tight mb-3.5"
            style={{ fontSize: "clamp(26px, 4vw, 40px)" }}
          >
            Stop losing money to preventable problems
          </h2>
          <p className="text-white/60 text-base leading-relaxed max-w-lg">
            Poor record-keeping costs Botswana&rsquo;s smallholder farmers
            access to premium BMC markets, higher grades, and export
            opportunities.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-11">
          {/* Left: reasons */}
          <div className="space-y-3.5 stagger-children">
            {reasons.map((r) => (
              <div
                key={r.title}
                className="flex items-start gap-3.5 p-5 bg-white/[.06] border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-gold flex items-center justify-center flex-shrink-0 shadow-md shadow-gold/30">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white mb-1">
                    {r.title}
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed">
                    {r.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: dashboard preview */}
          <div className="bg-white/[.05] border border-white/10 rounded-2xl p-7 animate-fade-up">
            <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-4">
              Live Dashboard Preview
            </p>

            <div className="space-y-2">
              {previewStats.map((s) => (
                <div
                  key={s.label}
                  className="flex justify-between items-center px-3.5 py-2.5 bg-white/[.06] rounded-lg text-sm"
                >
                  <span className="text-white/60">{s.label}</span>
                  <span className={`font-bold ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 px-3.5 py-2.5 bg-gold/15 border border-gold/30 rounded-lg text-xs text-gold-light flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
              Email reminder sent for B003 &mdash; Anthrax overdue
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
