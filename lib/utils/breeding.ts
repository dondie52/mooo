import type { Database } from "@/lib/supabase/database.types";

export type BreedingEventType = Database["public"]["Enums"]["breeding_event_type"];

export const BREEDING_EVENT_LABELS: Record<BreedingEventType, string> = {
  mating: "Mated",
  ai: "AI",
  pregnant: "In-calf",
  calving: "Calved",
  abortion: "Miscarriage",
  weaning: "Weaned",
};

export const BREEDING_EVENT_OPTIONS: { value: BreedingEventType; label: string }[] =
  (Object.entries(BREEDING_EVENT_LABELS) as [BreedingEventType, string][]).map(
    ([value, label]) => ({ value, label })
  );
