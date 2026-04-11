import {
  LayoutDashboard,
  Tag,
  Syringe,
  HeartPulse,
  AlertTriangle,
  BarChart3,
} from "lucide-react";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Tag, label: "My Animals", active: false },
  { icon: Syringe, label: "Vaccinations", active: false },
  { icon: HeartPulse, label: "Health", active: false },
  { icon: AlertTriangle, label: "Alerts", active: false },
  { icon: BarChart3, label: "Reports", active: false },
];

const vaccRows = [
  { tag: "B001", name: "FMD", badge: "Due Soon", cls: "badge-amber" },
  { tag: "B003", name: "Anthrax", badge: "Overdue", cls: "badge-red" },
  { tag: "B004", name: "FMD", badge: "Scheduled", cls: "badge-green" },
];

const healthRows = [
  { tag: "B001", event: "Fever", badge: "Mild", cls: "badge-green" },
  { tag: "B002", event: "Injury", badge: "Moderate", cls: "badge-amber" },
  { tag: "B005", event: "Vacc", badge: "Done", cls: "badge-green" },
];

export default function Preview() {
  return (
    <section id="preview" className="bg-earth-sand py-20 px-6">
      <div className="max-w-[1080px] mx-auto">
        {/* Header */}
        <div className="text-center animate-fade-up">
          <p className="text-xs font-bold text-gold uppercase tracking-[1.5px] mb-2">
            System preview
          </p>
          <h2
            className="font-display text-forest-deep font-semibold leading-tight mb-3.5"
            style={{ fontSize: "clamp(26px, 4vw, 40px)" }}
          >
            See what&rsquo;s inside
          </h2>
          <p className="text-muted text-base leading-relaxed max-w-lg mx-auto">
            A clean, intuitive interface designed for farmers with any level of
            digital experience. Works on any smartphone or computer.
          </p>
        </div>

        {/* Browser mockup */}
        <div className="mt-11 bg-white rounded-2xl shadow-lg border border-border overflow-hidden animate-fade-up" style={{ animationDelay: "150ms" }}>
          {/* Browser bar */}
          <div className="bg-forest-deep px-4 py-3 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            <div className="flex-1 mx-3 bg-white/10 rounded-md px-3 py-1 text-xs text-white/40 font-mono">
              localhost:3000/dashboard
            </div>
          </div>

          {/* Dashboard body */}
          <div className="grid grid-cols-1 md:grid-cols-[170px_1fr]">
            {/* Sidebar */}
            <div className="hidden md:block bg-forest-deep px-3 py-4">
              <p className="text-[10px] text-white/30 uppercase tracking-wider px-2.5 mb-2">
                Menu
              </p>
              {sidebarItems.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 px-2.5 py-[7px] rounded-md text-[12px] mb-0.5 ${
                    item.active
                      ? "bg-gold text-white font-semibold"
                      : "text-white/50"
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </div>
              ))}
            </div>

            {/* Main area */}
            <div className="p-4 bg-earth-cream">
              {/* Welcome bar */}
              <div className="bg-forest-mid rounded-lg px-4 py-3 mb-3.5 flex justify-between items-center">
                <div>
                  <p className="text-[12px] font-semibold text-white">
                    Good Morning, John Doe
                  </p>
                  <p className="text-[10px] text-white/50 mt-0.5">
                    Good Hope Farms &middot; Last login: 15 Mar 2026
                  </p>
                </div>
                <span className="bg-gold text-white text-[10px] font-semibold px-2.5 py-1 rounded-md">
                  + Add Animal
                </span>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3.5">
                {[
                  { v: "45", l: "Animals", c: "text-forest-deep" },
                  { v: "88%", l: "Coverage", c: "text-forest-mid" },
                  { v: "2", l: "Due Soon", c: "text-gold" },
                  { v: "1", l: "Overdue", c: "text-alert-red" },
                ].map((s) => (
                  <div
                    key={s.l}
                    className="bg-white rounded-lg p-2.5 border border-border"
                  >
                    <p className={`text-base font-bold ${s.c}`}>{s.v}</p>
                    <p className="text-[9px] text-muted uppercase tracking-wide mt-0.5">
                      {s.l}
                    </p>
                  </div>
                ))}
              </div>

              {/* Two list cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-white rounded-lg p-3 border border-border">
                  <p className="text-[10px] font-bold text-forest-deep mb-2 flex items-center gap-1.5">
                    <Syringe className="w-3 h-3" />
                    Upcoming Vaccinations
                  </p>
                  {vaccRows.map((r) => (
                    <div
                      key={r.tag + r.name}
                      className="flex justify-between items-center text-[10px] text-muted py-1 border-b border-border last:border-0"
                    >
                      <span>
                        {r.tag} &mdash; {r.name}
                      </span>
                      <span className={`badge text-[9px] py-0 ${r.cls}`}>
                        {r.badge}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-lg p-3 border border-border">
                  <p className="text-[10px] font-bold text-forest-deep mb-2 flex items-center gap-1.5">
                    <HeartPulse className="w-3 h-3" />
                    Recent Health Events
                  </p>
                  {healthRows.map((r) => (
                    <div
                      key={r.tag + r.event}
                      className="flex justify-between items-center text-[10px] text-muted py-1 border-b border-border last:border-0"
                    >
                      <span>
                        {r.tag} &mdash; {r.event}
                      </span>
                      <span className={`badge text-[9px] py-0 ${r.cls}`}>
                        {r.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
