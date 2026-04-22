"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Beef,
  HeartPulse,
  Syringe,
  Users,
  Loader2,
  CornerDownLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

type Role = Tables<"profiles">["role"];

const MAX_PER_GROUP = 3;
const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

type AnimalHit = {
  animal_id: string;
  tag_number: string;
  breed: string;
  location: string | null;
};
type HealthHit = {
  event_id: string;
  condition_name: string;
  animals: { animal_id: string; tag_number: string };
};
type VaccHit = {
  vacc_id: string;
  vaccine_name: string;
  animals: { animal_id: string; tag_number: string };
};
type ProfileHit = {
  id: string;
  full_name: string;
  role: string;
  farm_name: string | null;
  district: string | null;
};

interface Props {
  role: Role;
}

function getPlaceholder(role: Role): string {
  switch (role) {
    case "farmer":
      return "Search your animals, events, vaccinations…";
    case "vet":
      return "Search assigned farms, animals, events…";
    case "admin":
      return "Search users, farmers, animals, alerts…";
    default:
      return "Search…";
  }
}

export default function GlobalSearch({ role }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [animals, setAnimals] = useState<AnimalHit[]>([]);
  const [healthEvents, setHealthEvents] = useState<HealthHit[]>([]);
  const [vaccinations, setVaccinations] = useState<VaccHit[]>([]);
  const [profiles, setProfiles] = useState<ProfileHit[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Debounced live-suggestion fetch
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setAnimals([]);
      setHealthEvents([]);
      setVaccinations([]);
      setProfiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const requestId = ++requestIdRef.current;

    const timer = setTimeout(async () => {
      const sanitized = trimmed.replace(/[,()]/g, " ").trim();
      if (!sanitized) {
        if (requestIdRef.current === requestId) setLoading(false);
        return;
      }
      const pattern = `%${sanitized}%`;
      const supabase = createClient();

      const [animalsRes, healthRes, vaccRes] = await Promise.all([
        supabase
          .from("animals")
          .select("animal_id, tag_number, breed, location")
          .or(
            `tag_number.ilike.${pattern},breed.ilike.${pattern},location.ilike.${pattern}`
          )
          .limit(MAX_PER_GROUP),
        supabase
          .from("health_events")
          .select(
            "event_id, condition_name, animals!inner(animal_id, tag_number)"
          )
          .ilike("condition_name", pattern)
          .limit(MAX_PER_GROUP),
        supabase
          .from("vaccinations")
          .select(
            "vacc_id, vaccine_name, animals!inner(animal_id, tag_number)"
          )
          .ilike("vaccine_name", pattern)
          .limit(MAX_PER_GROUP),
      ]);

      let profilesHits: ProfileHit[] = [];
      if (role === "admin") {
        const profilesRes = await supabase
          .from("profiles")
          .select("id, full_name, role, farm_name, district")
          .or(`full_name.ilike.${pattern},district.ilike.${pattern}`)
          .limit(MAX_PER_GROUP);
        if (!profilesRes.error) {
          profilesHits = (profilesRes.data as ProfileHit[]) ?? [];
        }
      }

      // Discard stale responses — only the latest request wins
      if (requestIdRef.current !== requestId) return;

      setAnimals(
        animalsRes.error ? [] : ((animalsRes.data as AnimalHit[]) ?? [])
      );
      setHealthEvents(
        healthRes.error ? [] : ((healthRes.data as HealthHit[]) ?? [])
      );
      setVaccinations(
        vaccRes.error ? [] : ((vaccRes.data as VaccHit[]) ?? [])
      );
      setProfiles(profilesHits);
      setLoading(false);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, role]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const totalHits =
    animals.length +
    healthEvents.length +
    vaccinations.length +
    profiles.length;

  const showDropdown = open && query.trim().length >= MIN_QUERY_LENGTH;
  const trimmedQuery = query.trim();
  const seeAllHref = `/search?q=${encodeURIComponent(trimmedQuery)}`;

  const closeAndNavigate = () => setOpen(false);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 flex justify-center max-w-[480px] mx-auto sm:mx-0 sm:flex-initial sm:w-full lg:max-w-[480px] lg:mx-auto"
    >
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted animate-spin" />
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={getPlaceholder(role)}
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls="global-search-listbox"
            aria-autocomplete="list"
            className="w-full bg-white border border-border rounded-lg pl-10 pr-10 py-2 text-sm text-forest-deep placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-forest-accent/30 focus:border-forest-accent transition-colors"
          />
        </div>
      </form>

      {showDropdown && (
        <div
          id="global-search-listbox"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-lg shadow-lg py-2 z-50 max-h-[70vh] overflow-y-auto"
        >
          {loading && totalHits === 0 ? (
            <div className="flex items-center justify-center py-6 text-xs text-muted gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching…
            </div>
          ) : totalHits === 0 ? (
            <div className="px-4 py-4 text-sm text-muted">
              No matches for &ldquo;{trimmedQuery}&rdquo;.
            </div>
          ) : (
            <>
              {animals.length > 0 && (
                <Group
                  icon={<Beef className="h-3.5 w-3.5" />}
                  title="Animals"
                >
                  {animals.map((a) => (
                    <Link
                      key={a.animal_id}
                      href={`/animals/detail?id=${a.animal_id}`}
                      role="option"
                      onClick={closeAndNavigate}
                      className="flex items-center justify-between px-3 py-2 text-sm hover:bg-earth-sand/40 transition-colors"
                    >
                      <span>
                        <span className="font-medium text-forest-deep">
                          {a.tag_number}
                        </span>
                        <span className="text-muted ml-2">{a.breed}</span>
                      </span>
                      {a.location && (
                        <span className="text-xs text-muted">
                          {a.location}
                        </span>
                      )}
                    </Link>
                  ))}
                </Group>
              )}

              {healthEvents.length > 0 && (
                <Group
                  icon={<HeartPulse className="h-3.5 w-3.5" />}
                  title="Health events"
                >
                  {healthEvents.map((e) => (
                    <Link
                      key={e.event_id}
                      href={`/animals/detail?id=${e.animals.animal_id}`}
                      role="option"
                      onClick={closeAndNavigate}
                      className="flex items-center justify-between px-3 py-2 text-sm hover:bg-earth-sand/40 transition-colors"
                    >
                      <span>
                        <span className="font-medium text-forest-deep">
                          {e.condition_name}
                        </span>
                        <span className="text-muted ml-2">
                          on {e.animals.tag_number}
                        </span>
                      </span>
                    </Link>
                  ))}
                </Group>
              )}

              {vaccinations.length > 0 && (
                <Group
                  icon={<Syringe className="h-3.5 w-3.5" />}
                  title="Vaccinations"
                >
                  {vaccinations.map((v) => (
                    <Link
                      key={v.vacc_id}
                      href={`/animals/detail?id=${v.animals.animal_id}`}
                      role="option"
                      onClick={closeAndNavigate}
                      className="flex items-center justify-between px-3 py-2 text-sm hover:bg-earth-sand/40 transition-colors"
                    >
                      <span>
                        <span className="font-medium text-forest-deep">
                          {v.vaccine_name}
                        </span>
                        <span className="text-muted ml-2">
                          for {v.animals.tag_number}
                        </span>
                      </span>
                    </Link>
                  ))}
                </Group>
              )}

              {profiles.length > 0 && (
                <Group
                  icon={<Users className="h-3.5 w-3.5" />}
                  title="Users"
                >
                  {profiles.map((p) => (
                    <Link
                      key={p.id}
                      href="/admin/users"
                      role="option"
                      onClick={closeAndNavigate}
                      className="flex items-center justify-between px-3 py-2 text-sm hover:bg-earth-sand/40 transition-colors"
                    >
                      <span>
                        <span className="font-medium text-forest-deep">
                          {p.full_name}
                        </span>
                        <span className="text-muted ml-2 capitalize">
                          {p.role}
                        </span>
                      </span>
                      {p.district && (
                        <span className="text-xs text-muted">
                          {p.district}
                        </span>
                      )}
                    </Link>
                  ))}
                </Group>
              )}
            </>
          )}

          <Link
            href={seeAllHref}
            onClick={closeAndNavigate}
            className="flex items-center justify-between border-t border-border mt-1 px-3 py-2 text-xs font-medium text-forest-accent hover:text-forest-mid hover:bg-earth-sand/30 transition-colors"
          >
            <span>
              See all results for &ldquo;{trimmedQuery}&rdquo;
            </span>
            <span className="flex items-center gap-1 text-muted">
              <CornerDownLeft className="h-3 w-3" />
              Enter
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}

function Group({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-1">
      <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted flex items-center gap-1.5">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}
