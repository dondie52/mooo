import { z } from "zod";

export const breedingSchema = z.object({
  animal_id: z.string().min(1, "Select an animal"),
  event_type: z.enum(["mating", "pregnant", "calving", "abortion", "weaning"], { required_error: "Select event type" }),
  event_date: z.string().min(1, "Date is required"),
  mate_tag_number: z.string().optional().or(z.literal("")),
  expected_calving_date: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type BreedingFormData = z.infer<typeof breedingSchema>;
