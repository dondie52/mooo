import { z } from "zod";

export const healthEventSchema = z.object({
  animal_id: z.string().min(1, "Select an animal"),
  event_date: z.string().min(1, "Date is required"),
  event_type: z.enum(["disease", "injury", "treatment", "vaccination", "checkup", "other"], { required_error: "Select event type" }),
  condition_name: z.string().optional().or(z.literal("")),
  severity: z.enum(["mild", "moderate", "severe", "critical"]).optional(),
  symptoms: z.string().optional().or(z.literal("")),
  treatment_given: z.string().optional().or(z.literal("")),
  vet_name: z.string().optional().or(z.literal("")),
  outcome: z.enum(["recovering", "recovered", "ongoing", "referred", "deceased"]).optional(),
  followup_date: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type HealthEventFormData = z.infer<typeof healthEventSchema>;
