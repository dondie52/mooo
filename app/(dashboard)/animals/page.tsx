"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AnimalsClient from "@/components/animals/AnimalsClient";

export default function AnimalsPage() {
  const router = useRouter();
  const [animals, setAnimals] = useState<any[]>([]);
  const [role, setRole] = useState<"farmer" | "vet" | "admin">("farmer");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role) setRole(profile.role as typeof role);

      const { data } = await supabase
        .from("animals")
        .select("*")
        .order("created_at", { ascending: false });

      setAnimals(data ?? []);
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-8 w-8 border-2 border-forest-mid border-t-transparent rounded-full" /></div>;

  return <AnimalsClient animals={animals} role={role} />;
}
