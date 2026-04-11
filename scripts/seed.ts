/**
 * seed.ts — Populates the database with demo data for defense presentation
 *
 * Creates 3 users (admin, farmer, vet), 10 animals, vaccinations,
 * health events, breeding records, movements, and vet assignments.
 *
 * Idempotent — checks for existing data before inserting.
 *
 * Run: npx tsx scripts/seed.ts
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing env vars. Run from project root.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "Password@1234";

// ── Date helpers ──────────────────────────────────────────────────────
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

// ── Create or find user ───────────────────────────────────────────────
async function ensureUser(
  email: string,
  meta: Record<string, string>
): Promise<string> {
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const found = list?.users?.find((u) => u.email === email);
  if (found) {
    console.log(`  ✓ ${email} exists (${found.id})`);
    return found.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: meta,
  });
  if (error) throw new Error(`Create ${email}: ${error.message}`);
  console.log(`  + ${email} created (${data.user.id})`);
  return data.user.id;
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🌱 LMHTS Seed Script\n");

  // ── 1. Users ────────────────────────────────────────────────────────
  console.log("Creating users...");
  const adminId = await ensureUser("admin@lmhts.bw", {
    full_name: "Kabo Mosweu",
    role: "admin",
    phone: "+267 71 234 567",
    district: "Gaborone",
  });
  const farmerId = await ensureUser("refilwe@sengatefarm.bw", {
    full_name: "Refilwe Sengate",
    role: "farmer",
    phone: "+267 74 567 890",
    farm_name: "Sengate Cattle Farm",
    district: "Kweneng",
  });
  const vetId = await ensureUser("dr.mogale@vetservices.bw", {
    full_name: "Dr. Thabo Mogale",
    role: "vet",
    phone: "+267 72 345 678",
    district: "Southern",
  });

  // Ensure roles are correct
  await supabase.from("profiles").update({ role: "admin" } as any).eq("id", adminId);
  await supabase.from("profiles").update({ role: "farmer", farm_name: "Sengate Cattle Farm" } as any).eq("id", farmerId);
  await supabase.from("profiles").update({ role: "vet" } as any).eq("id", vetId);

  // ── 2. Vet assignment ───────────────────────────────────────────────
  console.log("\nAssigning vet to farmer...");
  const { data: existingAssign } = await supabase
    .from("vet_assignments")
    .select("assignment_id")
    .eq("vet_id", vetId)
    .eq("farmer_id", farmerId)
    .maybeSingle();
  if (!existingAssign) {
    await supabase.from("vet_assignments").insert({
      vet_id: vetId,
      farmer_id: farmerId,
      is_active: true,
    });
    console.log("  + Assignment created");
  } else {
    console.log("  ✓ Already assigned");
  }

  // ── 3. Animals ──────────────────────────────────────────────────────
  console.log("\nCreating animals...");
  const { count } = await supabase
    .from("animals")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", farmerId);

  if ((count ?? 0) >= 10) {
    console.log("  ✓ Animals already seeded");
  } else {
    const animals = [
      { tag_number: "BW-KW-0042", lits_tag: "LITS-9920", breed: "Tswana", gender: "female", date_of_birth: "2021-03-15", colour: "Brown", location: "Molepolole", acquired_date: "2021-03-15", notes: "Lead cow, good temperament" },
      { tag_number: "BW-KW-0018", lits_tag: "LITS-4411", breed: "Brahman", gender: "male", date_of_birth: "2020-07-22", colour: "Grey", location: "Molepolole", acquired_date: "2020-07-22", notes: null },
      { tag_number: "BW-KW-0031", lits_tag: null, breed: "Bonsmara", gender: "female", date_of_birth: "2022-01-10", colour: "Red-brown", location: "Gabane", acquired_date: "2022-06-01", notes: null },
      { tag_number: "BW-KW-0005", lits_tag: "LITS-2203", breed: "Simmental", gender: "male", date_of_birth: "2019-11-03", colour: "Yellow-white", location: "Thamaga", acquired_date: "2019-11-03", notes: "Breeding bull" },
      { tag_number: "BW-KW-0009", lits_tag: "LITS-7781", breed: "Tswana", gender: "female", date_of_birth: "2023-04-20", colour: "Black", location: "Molepolole", acquired_date: "2023-04-20", notes: null },
      { tag_number: "BW-KW-0055", lits_tag: "LITS-3304", breed: "Nguni", gender: "female", date_of_birth: "2022-08-14", colour: "Multi-colour", location: "Ramotswa", acquired_date: "2023-01-15", notes: null },
      { tag_number: "BW-KW-0063", lits_tag: null, breed: "Brahman", gender: "female", date_of_birth: "2021-12-01", colour: "White", location: "Gabane", acquired_date: "2022-03-20", notes: null },
      { tag_number: "BW-KW-0071", lits_tag: "LITS-5590", breed: "Tswana", gender: "male", date_of_birth: "2023-09-05", colour: "Brown-white", location: "Molepolole", acquired_date: "2023-09-05", notes: null },
      { tag_number: "BW-KW-0080", lits_tag: null, breed: "Bonsmara", gender: "female", date_of_birth: "2024-01-12", colour: "Red", location: "Molepolole", acquired_date: "2024-01-12", notes: "Young heifer" },
      { tag_number: "BW-KW-0088", lits_tag: "LITS-6612", breed: "Simmental", gender: "female", date_of_birth: "2022-05-30", colour: "Brown-white", location: "Thamaga", acquired_date: "2022-05-30", notes: null },
    ];

    for (const a of animals) {
      await supabase.from("animals").insert({
        owner_id: farmerId,
        animal_type: "cattle",
        acquired_how: "born",
        status: "active",
        ...a,
      } as any);
    }
    console.log(`  + ${animals.length} animals created`);
  }

  // Get animal IDs for subsequent inserts
  const { data: allAnimals } = await supabase
    .from("animals")
    .select("animal_id, tag_number")
    .eq("owner_id", farmerId)
    .order("tag_number");

  const animalMap = new Map((allAnimals ?? []).map((a) => [a.tag_number, a.animal_id]));
  const aId = (tag: string) => animalMap.get(tag) ?? "";

  // ── 4. Vaccinations ─────────────────────────────────────────────────
  console.log("\nCreating vaccinations...");
  const { count: vaccCount } = await supabase
    .from("vaccinations")
    .select("*", { count: "exact", head: true })
    .eq("logged_by", farmerId);

  if ((vaccCount ?? 0) >= 10) {
    console.log("  ✓ Vaccinations already seeded");
  } else {
    const vaccinations = [
      // Current vaccinations
      { animal: "BW-KW-0042", vaccine_name: "FMD", date_given: daysAgo(60), next_due_date: daysFromNow(120), vet_name: "Dr. Mogale", batch_number: "FMD-2026-A1" },
      { animal: "BW-KW-0018", vaccine_name: "FMD", date_given: daysAgo(45), next_due_date: daysFromNow(135), vet_name: "Dr. Mogale", batch_number: "FMD-2026-A1" },
      { animal: "BW-KW-0005", vaccine_name: "Anthrax", date_given: daysAgo(30), next_due_date: daysFromNow(335), vet_name: "Dr. Mogale", batch_number: "ANT-2026-B2" },
      { animal: "BW-KW-0009", vaccine_name: "Blackleg", date_given: daysAgo(90), next_due_date: daysFromNow(90), vet_name: "Dr. Mogale", batch_number: "BLK-2025-C1" },
      { animal: "BW-KW-0055", vaccine_name: "FMD", date_given: daysAgo(50), next_due_date: daysFromNow(130), vet_name: "Dr. Mogale", batch_number: "FMD-2026-A1" },
      { animal: "BW-KW-0088", vaccine_name: "CBPP", date_given: daysAgo(100), next_due_date: daysFromNow(265), vet_name: "Dr. Mogale", batch_number: "CBPP-2025-D1" },
      // Upcoming (due in 5 days — triggers Rule 1)
      { animal: "BW-KW-0071", vaccine_name: "FMD", date_given: daysAgo(175), next_due_date: daysFromNow(5), vet_name: "Dr. Mogale", batch_number: "FMD-2025-Z9" },
      // Overdue vaccinations (triggers Rule 2)
      { animal: "BW-KW-0031", vaccine_name: "FMD", date_given: daysAgo(200), next_due_date: daysAgo(20), vet_name: "Dr. Mogale", batch_number: "FMD-2025-X7" },
      { animal: "BW-KW-0063", vaccine_name: "Anthrax", date_given: daysAgo(400), next_due_date: daysAgo(35), vet_name: null, batch_number: null },
      { animal: "BW-KW-0080", vaccine_name: "Blackleg", date_given: daysAgo(250), next_due_date: daysAgo(5), vet_name: null, batch_number: null },
      // Extra current ones for coverage trend
      { animal: "BW-KW-0042", vaccine_name: "Anthrax", date_given: daysAgo(150), next_due_date: daysFromNow(215), vet_name: "Dr. Mogale", batch_number: "ANT-2025-A1" },
      { animal: "BW-KW-0018", vaccine_name: "Blackleg", date_given: daysAgo(120), next_due_date: daysFromNow(245), vet_name: "Dr. Mogale", batch_number: "BLK-2025-B1" },
      { animal: "BW-KW-0055", vaccine_name: "Brucellosis", date_given: daysAgo(80), next_due_date: daysFromNow(285), vet_name: "Dr. Mogale", batch_number: "BRC-2026-E1" },
    ];

    for (const v of vaccinations) {
      const animalId = aId(v.animal);
      if (!animalId) continue;
      await supabase.from("vaccinations").insert({
        animal_id: animalId,
        vaccine_name: v.vaccine_name,
        date_given: v.date_given,
        next_due_date: v.next_due_date,
        vet_name: v.vet_name,
        batch_number: v.batch_number,
        logged_by: farmerId,
      } as any);
    }
    console.log(`  + ${vaccinations.length} vaccinations created`);
  }

  // ── 5. Health events ────────────────────────────────────────────────
  console.log("\nCreating health events...");
  const { count: heCount } = await supabase
    .from("health_events")
    .select("*", { count: "exact", head: true })
    .eq("logged_by", farmerId);

  if ((heCount ?? 0) >= 5) {
    console.log("  ✓ Health events already seeded");
  } else {
    const events = [
      { animal: "BW-KW-0042", event_type: "disease", condition_name: "Lumpy Skin Disease", severity: "moderate", symptoms: "Skin nodules, fever, reduced appetite", treatment_given: "Antibiotics + anti-inflammatory", vet_name: "Dr. Mogale", outcome: "recovered", event_date: daysAgo(45) },
      { animal: "BW-KW-0031", event_type: "disease", condition_name: "Lumpy Skin Disease", severity: "mild", symptoms: "Few skin lesions", treatment_given: "Topical treatment", vet_name: "Dr. Mogale", outcome: "recovered", event_date: daysAgo(42) },
      { animal: "BW-KW-0055", event_type: "injury", condition_name: "Wire cut", severity: "moderate", symptoms: "Laceration on right foreleg", treatment_given: "Wound cleaning, stitches, antibiotics", vet_name: "Dr. Mogale", outcome: "recovering", event_date: daysAgo(14) },
      { animal: "BW-KW-0063", event_type: "disease", condition_name: "Anaplasmosis", severity: "severe", symptoms: "Fever, anaemia, jaundice", treatment_given: "Oxytetracycline injection", vet_name: "Dr. Mogale", outcome: "recovering", event_date: daysAgo(10) },
      { animal: "BW-KW-0018", event_type: "checkup", condition_name: null, severity: null, symptoms: null, treatment_given: null, vet_name: "Dr. Mogale", outcome: null, event_date: daysAgo(30) },
      { animal: "BW-KW-0009", event_type: "disease", condition_name: "Foot & Mouth", severity: "moderate", symptoms: "Blisters on mouth and hooves, drooling", treatment_given: "Supportive care, isolation", vet_name: "Dr. Mogale", outcome: "recovered", event_date: daysAgo(80) },
      { animal: "BW-KW-0080", event_type: "disease", condition_name: "Tick Fever", severity: "mild", symptoms: "Fever, lethargy", treatment_given: "Diminazene aceturate", vet_name: null, outcome: "recovered", event_date: daysAgo(60) },
    ];

    for (const e of events) {
      const animalId = aId(e.animal);
      if (!animalId) continue;
      await supabase.from("health_events").insert({
        animal_id: animalId,
        event_type: e.event_type,
        event_date: e.event_date,
        condition_name: e.condition_name,
        severity: e.severity,
        symptoms: e.symptoms,
        treatment_given: e.treatment_given,
        vet_name: e.vet_name,
        outcome: e.outcome,
        logged_by: farmerId,
      } as any);
    }
    console.log(`  + ${events.length} health events created`);
  }

  // ── 6. Breeding records ─────────────────────────────────────────────
  console.log("\nCreating breeding records...");
  const { count: brCount } = await supabase
    .from("breeding_records")
    .select("*", { count: "exact", head: true })
    .eq("logged_by", farmerId);

  if ((brCount ?? 0) >= 3) {
    console.log("  ✓ Breeding records already seeded");
  } else {
    const breeding = [
      // Upcoming calving (triggers Rule 4 — within 14 days)
      { animal: "BW-KW-0042", event_type: "mating", event_date: daysAgo(273), mate_tag: "BW-KW-0005", sire_breed: "Simmental", notes: "Natural mating" },
      // Pregnant — calving in ~45 days
      { animal: "BW-KW-0009", event_type: "pregnant", event_date: daysAgo(15), mate_tag: "BW-KW-0018", sire_breed: "Brahman", notes: "Confirmed by vet palpation" },
      // Completed calving
      { animal: "BW-KW-0055", event_type: "calving", event_date: daysAgo(90), mate_tag: "BW-KW-0005", sire_breed: "Simmental", notes: "Healthy heifer calf" },
      // Recent mating
      { animal: "BW-KW-0063", event_type: "mating", event_date: daysAgo(30), mate_tag: "BW-KW-0005", sire_breed: "Simmental", notes: null },
    ];

    for (const b of breeding) {
      const animalId = aId(b.animal);
      if (!animalId) continue;
      await supabase.from("breeding_records").insert({
        animal_id: animalId,
        event_type: b.event_type,
        event_date: b.event_date,
        mate_tag: b.mate_tag,
        sire_breed: b.sire_breed,
        notes: b.notes,
        logged_by: farmerId,
      } as any);
    }
    console.log(`  + ${breeding.length} breeding records created`);
  }

  // ── 7. Movements ────────────────────────────────────────────────────
  console.log("\nCreating movements...");
  const { count: mvCount } = await supabase
    .from("movements")
    .select("*", { count: "exact", head: true })
    .eq("logged_by", farmerId);

  if ((mvCount ?? 0) >= 3) {
    console.log("  ✓ Movements already seeded");
  } else {
    const movements = [
      { animal: "BW-KW-0031", movement_type: "transfer", from_location: "Molepolole", to_location: "Gabane", movement_date: daysAgo(120), permit_number: null, notes: "Grazing rotation" },
      { animal: "BW-KW-0055", movement_type: "purchase", from_location: "Ramotswa Market", to_location: "Ramotswa", movement_date: "2023-01-15", permit_number: "MOV-2023-0892", notes: "Purchase from market" },
      { animal: "BW-KW-0005", movement_type: "transfer", from_location: "Molepolole", to_location: "Thamaga", movement_date: daysAgo(200), permit_number: null, notes: "Breeding programme relocation" },
    ];

    for (const m of movements) {
      const animalId = aId(m.animal);
      if (!animalId) continue;
      await supabase.from("movements").insert({
        animal_id: animalId,
        movement_type: m.movement_type,
        from_location: m.from_location,
        to_location: m.to_location,
        movement_date: m.movement_date,
        permit_number: m.permit_number,
        notes: m.notes,
        logged_by: farmerId,
      } as any);
    }
    console.log(`  + ${movements.length} movements created`);
  }

  // ── Summary ─────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════");
  console.log("  Seed complete!");
  console.log("═══════════════════════════════════════════════");
  console.log(`\n  Login credentials (all use password: ${PASSWORD}):`);
  console.log(`    Admin:  admin@lmhts.bw`);
  console.log(`    Farmer: refilwe@sengatefarm.bw`);
  console.log(`    Vet:    dr.mogale@vetservices.bw\n`);
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
