"use client";

import Link from "next/link";
import { UserPlus, Link2, ScrollText, Settings } from "lucide-react";

const actions = [
  {
    label: "Add User",
    href: "/admin/users/new",
    icon: UserPlus,
    description: "Create a new farmer or vet account",
  },
  {
    label: "Assign Vet to Farmer",
    href: "/admin/vet-assignments/new",
    icon: Link2,
    description: "Link a vet to a farmer for oversight",
  },
  {
    label: "View Audit Log",
    href: "/admin/audit-log",
    icon: ScrollText,
    description: "Review all system activity",
  },
  {
    label: "Configuration Settings",
    href: "/admin/settings",
    icon: Settings,
    description: "Manage thresholds, email settings, and system parameters",
  },
];

export default function AdminQuickActions() {
  return (
    <div className="card">
      <h2 className="font-display text-lg font-semibold text-forest-deep mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-white p-5 text-center transition-all hover:border-gold hover:shadow-sm"
          >
            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
              <a.icon className="w-5 h-5 text-gold-dark" />
            </div>
            <span className="text-sm font-semibold text-forest-deep">
              {a.label}
            </span>
            <span className="text-[11px] text-muted leading-snug">
              {a.description}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
