import { Check, Smartphone, Lock, Mail, FileCheck } from "lucide-react";

const items = [
  { icon: Check, label: "Free to use" },
  { icon: Smartphone, label: "Mobile friendly" },
  { icon: Lock, label: "Secure & private" },
  { icon: Mail, label: "Automated email reminders" },
  { icon: FileCheck, label: "BMC & BAITS compliance" },
];

export default function TrustStrip() {
  return (
    <div className="bg-white border-b border-border py-4 px-6 flex items-center justify-center gap-8 lg:gap-11 flex-wrap">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-2 text-muted text-sm font-medium"
        >
          <item.icon className="w-4 h-4 text-forest-accent" />
          {item.label}
        </div>
      ))}
    </div>
  );
}
