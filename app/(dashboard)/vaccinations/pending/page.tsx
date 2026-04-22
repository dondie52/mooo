"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PendingValidationsClient, {
  type PendingRow,
} from "@/components/vaccinations/PendingValidationsClient";

export default function PendingValidationsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<PendingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- codebase-wide pattern: profile query types resolve to `never`
    if (!profile || (profile as any).role !== "vet") {
      router.push("/vaccinations");
      return;
    }

    const { data } = await supabase.rpc("get_pending_vaccinations_for_vet");
    setRows((data as PendingRow[] | null) ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-2 border-forest-mid border-t-transparent rounded-full" />
      </div>
    );
  }

  return <PendingValidationsClient rows={rows} onRefresh={load} />;
}
