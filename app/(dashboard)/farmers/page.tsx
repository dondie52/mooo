"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import FarmersClient from "@/components/farmers/FarmersClient";

type FarmerRow = {
  farmer_id: string;
  full_name: string;
  farm_name: string | null;
  district: string | null;
  animal_count: number;
  coverage_pct: number;
  overdue_count: number;
  last_visit_date: string | null;
};

export default function FarmersPage() {
  const router = useRouter();
  const [farmers, setFarmers] = useState<FarmerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = (await supabase.rpc("get_vet_assigned_farmers", {
        vet_uuid: user.id,
      })) as { data: FarmerRow[] | null };

      setFarmers(data ?? []);
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-2 border-forest-mid border-t-transparent rounded-full" />
      </div>
    );
  }

  return <FarmersClient farmers={farmers} />;
}
