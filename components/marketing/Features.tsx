import {
  Tag,
  Syringe,
  AlertTriangle,
  BarChart3,
  FileText,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Tag,
    title: "Digital Animal Records",
    desc: "Register every animal with tag, breed, LITS bolus tag, location, and full history. Searchable and always accessible.",
  },
  {
    icon: Syringe,
    title: "Vaccination Tracking",
    desc: "Track all vaccinations with automated email reminders 7 days before due dates and immediate overdue alerts.",
  },
  {
    icon: AlertTriangle,
    title: "Disease Alerts",
    desc: "Rule-based risk detection flags potential disease clusters when multiple animals show similar symptoms within 7 days.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Interactive charts showing herd composition, vaccination coverage trends, disease frequency, and health outcomes.",
  },
  {
    icon: FileText,
    title: "BMC & BAITS Reports",
    desc: "Generate vaccination compliance certificates and traceability reports for BMC and BAITS submission \u2014 CSV or printable.",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    desc: "Farmers, veterinary officers, and administrators each have secure, appropriate access levels and permissions.",
  },
];

export default function Features() {
  return (
    <section id="features" className="bg-earth-cream py-20 px-6">
      <div className="max-w-[1080px] mx-auto">
        {/* Header */}
        <div className="animate-fade-up">
          <p className="text-xs font-bold text-gold uppercase tracking-[1.5px] mb-2">
            What it does
          </p>
          <h2 className="font-display text-forest-deep font-semibold leading-tight mb-3.5" style={{ fontSize: "clamp(26px, 4vw, 40px)" }}>
            Everything you need to manage your herd
          </h2>
          <p className="text-muted text-base leading-relaxed max-w-lg">
            From animal registration to BMC compliance reports &mdash; all your
            livestock management tools in one platform.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-11 stagger-children">
          {features.map((f) => (
            <div
              key={f.title}
              className="card card-hover group relative overflow-hidden"
            >
              {/* Top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gold scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />

              <div className="w-11 h-11 rounded-xl bg-earth-sand flex items-center justify-center mb-3.5">
                <f.icon className="w-5 h-5 text-forest-mid" />
              </div>
              <h3 className="font-bold text-[15px] text-forest-deep mb-1.5">
                {f.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
