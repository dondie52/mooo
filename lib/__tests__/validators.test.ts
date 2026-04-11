import { describe, it, expect } from "vitest";
import { animalSchema } from "../validators/animal";
import { healthEventSchema } from "../validators/health-event";
import { vaccinationSchema } from "../validators/vaccination";

// ── Animal Schema ──────────────────────────────────────────────────

describe("animalSchema", () => {
  const validAnimal = {
    tag_number: "BW-KW-0001",
    lits_tag: "LITS-1234",
    animal_type: "cattle",
    breed: "Tswana",
    gender: "female",
    date_of_birth: "2021-03-15",
    colour: "Brown",
    location: "Molepolole",
    acquired_date: "2021-03-15",
    acquired_how: "born",
    notes: "",
  };

  it("accepts valid animal data", () => {
    const result = animalSchema.safeParse(validAnimal);
    expect(result.success).toBe(true);
  });

  it("rejects missing tag_number", () => {
    const result = animalSchema.safeParse({ ...validAnimal, tag_number: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe("tag_number");
    }
  });

  it("rejects missing breed", () => {
    const result = animalSchema.safeParse({ ...validAnimal, breed: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing acquired_date", () => {
    const result = animalSchema.safeParse({ ...validAnimal, acquired_date: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid animal_type", () => {
    const result = animalSchema.safeParse({ ...validAnimal, animal_type: "horse" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid gender", () => {
    const result = animalSchema.safeParse({ ...validAnimal, gender: "unknown" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid acquired_how values", () => {
    for (const how of ["born", "purchased", "donated", "inherited", "other"]) {
      const result = animalSchema.safeParse({ ...validAnimal, acquired_how: how });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid acquired_how", () => {
    const result = animalSchema.safeParse({ ...validAnimal, acquired_how: "stolen" });
    expect(result.success).toBe(false);
  });

  it("allows optional fields to be empty strings", () => {
    const result = animalSchema.safeParse({
      ...validAnimal,
      lits_tag: "",
      date_of_birth: "",
      colour: "",
      location: "",
      notes: "",
    });
    expect(result.success).toBe(true);
  });

  it("enforces tag_number max length of 20", () => {
    const result = animalSchema.safeParse({ ...validAnimal, tag_number: "A".repeat(21) });
    expect(result.success).toBe(false);
  });
});

// ── Health Event Schema ────────────────────────────────────────────

describe("healthEventSchema", () => {
  const validEvent = {
    animal_id: "some-uuid",
    event_date: "2024-07-01",
    event_type: "disease",
    condition_name: "Lumpy Skin Disease",
    severity: "moderate",
    symptoms: "Skin nodules",
    treatment_given: "Antibiotics",
    vet_name: "Dr. Mogale",
    outcome: "recovered",
    followup_date: "2024-07-15",
    notes: "",
  };

  it("accepts valid health event data", () => {
    const result = healthEventSchema.safeParse(validEvent);
    expect(result.success).toBe(true);
  });

  it("rejects missing animal_id", () => {
    const result = healthEventSchema.safeParse({ ...validEvent, animal_id: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing event_date", () => {
    const result = healthEventSchema.safeParse({ ...validEvent, event_date: "" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid event types", () => {
    for (const t of ["disease", "injury", "treatment", "vaccination", "checkup", "other"]) {
      const result = healthEventSchema.safeParse({ ...validEvent, event_type: t });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid event_type", () => {
    const result = healthEventSchema.safeParse({ ...validEvent, event_type: "surgery" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid severity levels", () => {
    for (const s of ["mild", "moderate", "severe", "critical"]) {
      const result = healthEventSchema.safeParse({ ...validEvent, severity: s });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all valid outcomes", () => {
    for (const o of ["recovering", "recovered", "ongoing", "referred", "deceased"]) {
      const result = healthEventSchema.safeParse({ ...validEvent, outcome: o });
      expect(result.success).toBe(true);
    }
  });

  it("allows optional fields to be omitted", () => {
    const result = healthEventSchema.safeParse({
      animal_id: "uuid",
      event_date: "2024-07-01",
      event_type: "checkup",
    });
    expect(result.success).toBe(true);
  });
});

// ── Vaccination Schema ─────────────────────────────────────────────

describe("vaccinationSchema", () => {
  const validVacc = {
    animal_id: "some-uuid",
    vaccine_name: "FMD",
    date_given: "2024-06-01",
    next_due_date: "2024-12-01",
    vet_name: "Dr. Mogale",
    batch_number: "FMD-2024-A1",
    notes: "",
  };

  it("accepts valid vaccination data", () => {
    const result = vaccinationSchema.safeParse(validVacc);
    expect(result.success).toBe(true);
  });

  it("rejects missing animal_id", () => {
    const result = vaccinationSchema.safeParse({ ...validVacc, animal_id: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing vaccine_name", () => {
    const result = vaccinationSchema.safeParse({ ...validVacc, vaccine_name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing date_given", () => {
    const result = vaccinationSchema.safeParse({ ...validVacc, date_given: "" });
    expect(result.success).toBe(false);
  });

  it("allows optional fields to be empty strings", () => {
    const result = vaccinationSchema.safeParse({
      animal_id: "uuid",
      vaccine_name: "Anthrax",
      date_given: "2024-01-01",
      next_due_date: "",
      vet_name: "",
      batch_number: "",
      notes: "",
    });
    expect(result.success).toBe(true);
  });
});
