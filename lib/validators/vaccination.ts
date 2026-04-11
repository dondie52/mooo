import { z } from "zod";

export const vaccinationSchema = z.object({
  animal_id: z.string().min(1, "Select an animal"),
  vaccine_name: z.string().min(1, "Vaccine name is required"),
  date_given: z.string().min(1, "Date is required"),
  next_due_date: z.string().optional().or(z.literal("")),
  vet_name: z.string().optional().or(z.literal("")),
  batch_number: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type VaccinationFormData = z.infer<typeof vaccinationSchema>;
