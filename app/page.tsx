"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LandingPage from "./(marketing)/page";

export default function RootPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          router.push("/dashboard");
          return;
        }
      } catch {
        // Supabase not configured — treat as unauthenticated
      }
      setChecking(false);
    };
    check();
  }, [router]);

  if (checking) return null;

  return <LandingPage />;
}
