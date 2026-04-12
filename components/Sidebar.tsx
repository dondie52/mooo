"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Beef,
  HeartPulse,
  Syringe,
  HeartHandshake,
  FileText,
  Bell,
  Users,
  LogOut,
  Menu,
  X,
  Link2,
  ScrollText,
  UserPlus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { CowIcon } from "@/components/ui/CowIcon";
import { cn, initials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

type Profile = Tables<"profiles">;

interface SidebarProps {
  profile: Profile;
  unreadAlerts: number;
}

const navGroups = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Livestock",
    items: [
      { name: "Animals", href: "/animals", icon: Beef },
      { name: "Health Events", href: "/health", icon: HeartPulse },
      { name: "Vaccinations", href: "/vaccinations", icon: Syringe },
      { name: "Breeding", href: "/breeding", icon: HeartHandshake },
    ],
  },
  {
    label: "Compliance",
    items: [
      { name: "Reports", href: "/reports", icon: FileText },
      { name: "Alerts", href: "/alerts", icon: Bell },
    ],
  },
];

const vetNavGroups = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "My Practice",
    items: [
      { name: "Assigned Farmers", href: "/farmers", icon: Users },
      { name: "Animals", href: "/animals", icon: Beef },
      { name: "Health Events", href: "/health", icon: HeartPulse },
      { name: "Vaccinations", href: "/vaccinations", icon: Syringe },
    ],
  },
  {
    label: "Compliance",
    items: [
      { name: "Reports", href: "/reports", icon: FileText },
      { name: "Alerts", href: "/alerts", icon: Bell },
    ],
  },
];

const adminNavGroups = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Vet Assignments", href: "/admin/vet-assignments", icon: Link2 },
      { name: "Audit Log", href: "/admin/audit-log", icon: ScrollText },
    ],
  },
  {
    label: "Livestock",
    items: [
      { name: "All Animals", href: "/animals", icon: Beef },
      { name: "Health Events", href: "/health", icon: HeartPulse },
      { name: "Vaccinations", href: "/vaccinations", icon: Syringe },
    ],
  },
  {
    label: "Compliance",
    items: [
      { name: "Reports", href: "/reports", icon: FileText },
      { name: "Alerts", href: "/alerts", icon: Bell },
    ],
  },
];

export default function Sidebar({ profile, unreadAlerts }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const groups =
    profile.role === "admin"
      ? adminNavGroups
      : profile.role === "vet"
      ? vetNavGroups
      : navGroups;

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo + user */}
      <div className="p-5 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gold flex items-center justify-center shrink-0">
            <CowIcon className="w-5 h-5 text-forest-deep" size={20} />
          </div>
          <div className="min-w-0">
            <div className="font-display text-lg font-semibold text-earth-cream leading-tight">
              LMHTS
            </div>
            <div className="text-[10px] text-earth-stone/50 uppercase tracking-widest">
              Botswana
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-forest-light flex items-center justify-center text-xs font-semibold text-earth-cream shrink-0">
            {initials(profile.full_name || "U")}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-earth-cream truncate">
              {profile.full_name}
            </div>
            <div className="text-xs text-earth-stone/60 capitalize">
              {profile.role}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex-1 px-3 space-y-6 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-earth-stone/40">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href, (item as any).exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 py-2 rounded-lg text-sm transition-colors",
                      active
                        ? "bg-forest-light/80 text-gold-light font-medium border-l-[3px] border-l-gold pl-[9px] pr-3"
                        : "text-earth-stone/70 hover:text-earth-cream hover:bg-forest-mid/50 px-3"
                    )}
                  >
                    <item.icon className="w-[18px] h-[18px] shrink-0" />
                    <span>{item.name}</span>
                    {item.name === "Alerts" && unreadAlerts > 0 && (
                      <span className="ml-auto text-[10px] font-bold bg-alert-red text-white rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadAlerts > 9 ? "9+" : unreadAlerts}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Vet CTA + Logout */}
      <div className="p-3 mt-auto">
        {profile.role === "vet" && (
          <Link
            href="/health"
            className="btn-gold w-full justify-center text-sm mb-3 flex items-center gap-2"
          >
            <HeartPulse className="w-4 h-4" />
            Log Health Event
          </Link>
        )}
        {profile.role === "admin" && (
          <Link
            href="/admin/users/new"
            className="btn-gold w-full justify-center text-sm mb-3 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-earth-stone/60 hover:text-earth-cream hover:bg-forest-mid/50 transition-colors w-full"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-lg bg-forest-deep/90 backdrop-blur-sm text-earth-cream flex items-center justify-center shadow-lg ring-1 ring-white/10"
        aria-label="Open navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay — always mounted, animated via opacity */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 bg-black/40 z-40 transition-opacity duration-300",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile drawer */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-[260px] bg-forest-deep transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-earth-stone/60 hover:text-earth-cream"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-[240px] bg-forest-deep shrink-0 fixed inset-y-0 left-0">
        {sidebarContent}
      </aside>
    </>
  );
}
