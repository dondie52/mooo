import { z } from "zod";

export const animalSchema = z.object({
  tag_number: z.string().min(1, "Tag number is required").max(20),
  lits_tag: z.string().optional().or(z.literal("")),
  animal_type: z.enum(["cattle", "goat", "sheep"], { required_error: "Select animal type" }),
  breed: z.string().min(1, "Breed is required"),
  gender: z.enum(["male", "female"], { required_error: "Select gender" }),
  date_of_birth: z.string().optional().or(z.literal("")),
  colour: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  acquired_date: z.string().min(1, "Acquired date is required"),
  acquired_how: z.enum(["born", "purchased", "donated", "inherited", "other"], { required_error: "Select how acquired" }),
  notes: z.string().optional().or(z.literal("")),
});

export type AnimalFormData = z.infer<typeof animalSchema>;
