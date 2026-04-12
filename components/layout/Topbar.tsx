"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, User, LogOut } from "lucide-react";
import Link from "next/link";
import { cn, initials, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

type Profile = Tables<"profiles">;

interface TopbarProps {
  profile: Profile;
  unreadCount: number;
}

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const firstName = name.split(" ")[0] || name;
  if (hour < 12) return `Good morning, ${firstName}`;
  if (hour < 17) return `Good afternoon, ${firstName}`;
  return `Good evening, ${firstName}`;
}

function getSearchPlaceholder(role: Profile["role"]): string {
  switch (role) {
    case "farmer":
      return "Search your animals, events, vaccinations\u2026";
    case "vet":
      return "Search assigned farms, animals, events\u2026";
    case "admin":
      return "Search users, farmers, animals, alerts\u2026";
    default:
      return "Search\u2026";
  }
}

export default function Topbar({ profile, unreadCount }: TopbarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const greeting = getGreeting(profile.full_name);
  const lastLogin = profile.last_login
    ? formatDate(profile.last_login, "dd MMM yyyy, HH:mm")
    : null;

  return (
    <header className="sticky top-0 z-40 bg-earth-cream/95 backdrop-blur border-b border-border">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop layout */}
        <div className="h-16 flex items-center gap-4 lg:gap-6">
          {/* Left: Greeting */}
          <div className="hidden sm:block flex-shrink-0 min-w-0">
            <p className="text-sm font-semibold text-forest-deep truncate">
              {greeting}
            </p>
            {lastLogin && (
              <p className="text-xs text-muted truncate">
                Last login: {lastLogin}
              </p>
            )}
          </div>

          {/* Center: Search */}
          <form
            onSubmit={handleSearch}
            className="flex-1 flex justify-center max-w-[480px] mx-auto sm:mx-0 sm:flex-initial sm:w-full lg:max-w-[480px] lg:mx-auto"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={getSearchPlaceholder(profile.role)}
                className="w-full bg-white border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-forest-deep placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-forest-accent/30 focus:border-forest-accent transition-colors"
              />
            </div>
          </form>

          {/* Right: Bell + Avatar */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Alerts bell */}
            <Link
              href="/alerts"
              className="relative p-2 rounded-lg text-muted hover:text-forest-deep hover:bg-earth-sand/60 transition-colors"
              aria-label={`Alerts${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-alert-red rounded-full">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Avatar dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-earth-sand/60 transition-colors"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <div className="h-8 w-8 rounded-full bg-forest-mid text-white flex items-center justify-center text-xs font-semibold">
                  {initials(profile.full_name)}
                </div>
                <span className="hidden md:block text-xs text-muted capitalize">
                  {profile.role}
                </span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-border rounded-lg shadow-lg py-1 z-50">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-medium text-forest-deep truncate">
                      {profile.full_name}
                    </p>
                    <p className="text-xs text-muted capitalize">
                      {profile.role}
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-forest-deep hover:bg-earth-sand/40 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-alert-red hover:bg-red-50 transition-colors w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile: greeting row below (visible only on small screens) */}
        <div className="sm:hidden pb-3 -mt-1">
          <p className="text-sm font-semibold text-forest-deep">
            {greeting}
          </p>
        </div>
      </div>
    </header>
  );
}
