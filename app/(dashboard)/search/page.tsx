"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Beef, HeartPulse, Syringe, Users, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const MAX_PER_GROUP = 5;

type AnimalResult = {
  animal_id: string;
  tag_number: string;
  breed: string;
  location: string | null;
  status: string;
};
type HealthResult = {
  event_id: string;
  condition_name: string;
  event_type: string;
  event_date: string;
  animals: { tag_number: string; animal_id: string };
};
type VaccResult = {
  vacc_id: string;
  vaccine_name: string;
  date_given: string;
  animals: { tag_number: string; animal_id: string };
};
type ProfileResult = {
  id: string;
  full_name: string;
  role: string;
  farm_name: string | null;
  district: string | null;
};

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";

  const [loading, setLoading] = useState(false);
  const [animals, setAnimals] = useState<AnimalResult[]>([]);
  const [healthEvents, setHealthEvents] = useState<HealthResult[]>([]);
  const [vaccinations, setVaccinations] = useState<VaccResult[]>([]);
  const [profiles, setProfiles] = useState<ProfileResult[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setAnimals([]);
      setHealthEvents([]);
      setVaccinations([]);
      setProfiles([]);
      setError(null);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setError("You must be logged in to search.");
          return;
        }

        // Get role
        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        const userRole = prof?.role ?? "farmer";
        setRole(userRole);

        // Sanitize query for PostgREST .or() filter syntax safety
        const sanitized = query.replace(/[,()]/g, " ").trim();
        if (!sanitized) return;
        const pattern = `%${sanitized}%`;

        const [animalsRes, healthRes, vaccRes] = await Promise.all([
          supabase
            .from("animals")
            .select("animal_id, tag_number, breed, location, status")
            .or(
              `tag_number.ilike.${pattern},breed.ilike.${pattern},location.ilike.${pattern}`
            )
            .limit(MAX_PER_GROUP + 1),
          supabase
            .from("health_events")
            .select(
              "event_id, condition_name, event_type, event_date, animals!inner(tag_number, animal_id)"
            )
            .ilike("condition_name", pattern)
            .limit(MAX_PER_GROUP + 1),
          supabase
            .from("vaccinations")
            .select(
              "vacc_id, vaccine_name, date_given, animals!inner(tag_number, animal_id)"
            )
            .ilike("vaccine_name", pattern)
            .limit(MAX_PER_GROUP + 1),
        ]);

        const queryError = animalsRes.error || healthRes.error || vaccRes.error;
        if (queryError) {
          console.error("Search query error:", queryError);
          setError("Search failed. Please try a simpler search term.");
          return;
        }

        setAnimals((animalsRes.data as AnimalResult[]) ?? []);
        setHealthEvents((healthRes.data as HealthResult[]) ?? []);
        setVaccinations((vaccRes.data as VaccResult[]) ?? []);

        // Admin-only: search profiles
        if (userRole === "admin") {
          const profilesRes = await supabase
            .from("profiles")
            .select("id, full_name, role, farm_name, district")
            .or(`full_name.ilike.${pattern},district.ilike.${pattern}`)
            .limit(MAX_PER_GROUP + 1);
          if (!profilesRes.error) {
            setProfiles((profilesRes.data as ProfileResult[]) ?? []);
          }
        } else {
          setProfiles([]);
        }
      } catch (err) {
        console.error("Search error:", err);
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Search className="h-12 w-12 text-muted/40 mb-4" />
        <h1 className="text-xl font-semibold text-forest-deep font-display">
          Search
        </h1>
        <p className="text-sm text-muted mt-1">
          Enter a search term to find animals, events, and vaccinations.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-3 border-forest-mid border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-alert-red/40 mb-4" />
        <h1 className="text-xl font-semibold text-forest-deep font-display">
          Search error
        </h1>
        <p className="text-sm text-muted mt-1">{error}</p>
      </div>
    );
  }

  const totalResults =
    Math.min(animals.length, MAX_PER_GROUP) +
    Math.min(healthEvents.length, MAX_PER_GROUP) +
    Math.min(vaccinations.length, MAX_PER_GROUP) +
    Math.min(profiles.length, MAX_PER_GROUP);

  if (totalResults === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Search className="h-12 w-12 text-muted/40 mb-4" />
        <h1 className="text-xl font-semibold text-forest-deep font-display">
          No results for &ldquo;{query}&rdquo;
        </h1>
        <p className="text-sm text-muted mt-1">
          Try a different search term or check the spelling.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-forest-deep font-display mb-1">
        Search results for &ldquo;{query}&rdquo;
      </h1>
      <p className="text-sm text-muted mb-6">
        Showing top results across your accessible data.
      </p>

      <div className="space-y-8">
        {/* Animals */}
        {animals.length > 0 && (
          <ResultGroup
            icon={<Beef className="h-5 w-5" />}
            title="Animals"
            hasMore={animals.length > MAX_PER_GROUP}
            moreHref={`/animals?search=${encodeURIComponent(query)}`}
          >
            <div className="divide-y divide-border">
              {animals.slice(0, MAX_PER_GROUP).map((a) => (
                <Link
                  key={a.animal_id}
                  href={`/animals/detail?id=${a.animal_id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-earth-sand/40 transition-colors"
                >
                  <div>
                    <span className="text-sm font-medium text-forest-deep">
                      {a.tag_number}
                    </span>
                    <span className="text-sm text-muted ml-2">{a.breed}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.location && (
                      <span className="text-xs text-muted">{a.location}</span>
                    )}
                    <span
                      className={`badge text-xs ${
                        a.status === "active"
                          ? "badge-green"
                          : a.status === "deceased"
                            ? "badge-red"
                            : "badge-amber"
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </ResultGroup>
        )}

        {/* Health Events */}
        {healthEvents.length > 0 && (
          <ResultGroup
            icon={<HeartPulse className="h-5 w-5" />}
            title="Health Events"
            hasMore={healthEvents.length > MAX_PER_GROUP}
            moreHref={`/health?search=${encodeURIComponent(query)}`}
          >
            <div className="divide-y divide-border">
              {healthEvents.slice(0, MAX_PER_GROUP).map((e) => (
                <Link
                  key={e.event_id}
                  href={`/animals/detail?id=${e.animals.animal_id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-earth-sand/40 transition-colors"
                >
                  <div>
                    <span className="text-sm font-medium text-forest-deep">
                      {e.condition_name}
                    </span>
                    <span className="text-sm text-muted ml-2">
                      on {e.animals.tag_number}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-muted text-xs">
                      {e.event_type}
                    </span>
                    <span className="text-xs text-muted">{e.event_date}</span>
                  </div>
                </Link>
              ))}
            </div>
          </ResultGroup>
        )}

        {/* Vaccinations */}
        {vaccinations.length > 0 && (
          <ResultGroup
            icon={<Syringe className="h-5 w-5" />}
            title="Vaccinations"
            hasMore={vaccinations.length > MAX_PER_GROUP}
            moreHref={`/vaccinations?search=${encodeURIComponent(query)}`}
          >
            <div className="divide-y divide-border">
              {vaccinations.slice(0, MAX_PER_GROUP).map((v) => (
                <Link
                  key={v.vacc_id}
                  href={`/animals/detail?id=${v.animals.animal_id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-earth-sand/40 transition-colors"
                >
                  <div>
                    <span className="text-sm font-medium text-forest-deep">
                      {v.vaccine_name}
                    </span>
                    <span className="text-sm text-muted ml-2">
                      for {v.animals.tag_number}
                    </span>
                  </div>
                  <span className="text-xs text-muted">{v.date_given}</span>
                </Link>
              ))}
            </div>
          </ResultGroup>
        )}

        {/* Profiles (admin only) */}
        {profiles.length > 0 && (
          <ResultGroup
            icon={<Users className="h-5 w-5" />}
            title="Users"
            hasMore={profiles.length > MAX_PER_GROUP}
            moreHref={`/admin/users?search=${encodeURIComponent(query)}`}
          >
            <div className="divide-y divide-border">
              {profiles.slice(0, MAX_PER_GROUP).map((p) => (
                <Link
                  key={p.id}
                  href="/admin/users"
                  className="flex items-center justify-between px-4 py-3 hover:bg-earth-sand/40 transition-colors"
                >
                  <div>
                    <span className="text-sm font-medium text-forest-deep">
                      {p.full_name}
                    </span>
                    <span className="text-sm text-muted ml-2 capitalize">
                      {p.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.farm_name && (
                      <span className="text-xs text-muted">{p.farm_name}</span>
                    )}
                    {p.district && (
                      <span className="text-xs text-muted">{p.district}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </ResultGroup>
        )}
      </div>
    </div>
  );
}

function ResultGroup({
  icon,
  title,
  hasMore,
  moreHref,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hasMore: boolean;
  moreHref: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-earth-sand/20">
        <div className="flex items-center gap-2 text-forest-deep">
          {icon}
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        {hasMore && (
          <Link
            href={moreHref}
            className="text-xs font-medium text-forest-accent hover:text-forest-mid transition-colors"
          >
            See more &rarr;
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-3 border-forest-mid border-t-transparent rounded-full" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
