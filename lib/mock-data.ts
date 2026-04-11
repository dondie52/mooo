import type { Tables } from "@/lib/supabase/database.types";

type Animal = Tables<"animals">;
type Vaccination = Tables<"vaccinations">;
type HealthEvent = Tables<"health_events">;
type BreedingRecord = Tables<"breeding_records">;
type Movement = Tables<"movements">;
type Alert = Tables<"alerts">;
type Profile = Tables<"profiles">;

// ── Helpers ────────────────────────────────────────────────────────
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}
function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}
const ts = (date: string) => `${date}T08:00:00Z`;

// ── Users ──────────────────────────────────────────────────────────
const FARMER_ID = "user-farmer-001";
const VET_ID = "user-vet-001";
const ADMIN_ID = "user-admin-001";

export const mockUsers: (Profile & { email: string })[] = [
  {
    id: ADMIN_ID,
    full_name: "Kabo Mosweu",
    role: "admin",
    phone: "+267 71 234 567",
    farm_name: null,
    district: "Gaborone",
    is_active: true,
    created_at: "2024-01-01T08:00:00Z",
    updated_at: "2024-01-01T08:00:00Z",
    email: "admin@lmhts.bw",
  },
  {
    id: FARMER_ID,
    full_name: "Refilwe Sengate",
    role: "farmer",
    phone: "+267 74 567 890",
    farm_name: "Sengate Cattle Farm",
    district: "Kweneng",
    is_active: true,
    created_at: "2024-01-05T08:00:00Z",
    updated_at: "2024-01-05T08:00:00Z",
    email: "refilwe@sengatefarm.bw",
  },
  {
    id: VET_ID,
    full_name: "Dr. Thabo Mogale",
    role: "vet",
    phone: "+267 72 345 678",
    farm_name: null,
    district: "Southern",
    is_active: true,
    created_at: "2024-01-03T08:00:00Z",
    updated_at: "2024-01-03T08:00:00Z",
    email: "dr.mogale@vetservices.bw",
  },
];

// ── Animals ────────────────────────────────────────────────────────
export const mockAnimals: Animal[] = [
  {
    animal_id: "a1",
    owner_id: FARMER_ID,
    tag_number: "BW-KW-0042",
    lits_tag: "LITS-9920",
    animal_type: "cattle",
    breed: "Tswana",
    gender: "female",
    date_of_birth: "2021-03-15",
    colour: "Brown",
    location: "Molepolole",
    acquired_date: "2021-03-15",
    status: "active",
    acquired_how: "born",
    notes: "Lead cow, good temperament",
    created_at: ts("2024-01-10"),
    updated_at: ts("2024-01-10"),
  },
  {
    animal_id: "a2",
    owner_id: FARMER_ID,
    tag_number: "BW-KW-0018",
    lits_tag: "LITS-4411",
    animal_type: "cattle",
    breed: "Brahman",
    gender: "male",
    date_of_birth: "2020-07-22",
    colour: "Grey",
    location: "Molepolole",
    acquired_date: "2020-07-22",
    status: "active",
    acquired_how: "born",
    notes: null,
    created_at: ts("2024-01-08"),
    updated_at: ts("2024-01-08"),
  },
  {
    animal_id: "a3",
    owner_id: FARMER_ID,
    tag_number: "BW-KW-0031",
    lits_tag: null,
    animal_type: "cattle",
    breed: "Bonsmara",
    gender: "female",
    date_of_birth: "2022-01-10",
    colour: "Red-brown",
    location: "Gabane",
    acquired_date: "2022-06-01",
    status: "active",
    acquired_how: "born",
    notes: null,
    created_at: ts("2024-01-05"),
    updated_at: ts("2024-01-05"),
  },
  {
    animal_id: "a4",
    owner_id: FARMER_ID,
    tag_number: "BW-KW-0005",
    lits_tag: "LITS-2203",
    animal_type: "cattle",
    breed: "Simmental",
    gender: "male",
    date_of_birth: "2019-11-03",
    colour: "Yellow-white",
    location: "Thamaga",
    acquired_date: "2019-11-03",
    status: "active",
    acquired_how: "born",
    notes: "Breeding bull",
    created_at: ts("2024-01-02"),
    updated_at: ts("2024-01-02"),
  },
  {
    animal_id: "a5",
    owner_id: FARMER_ID,
    tag_number: "BW-KW-0009",
    lits_tag: "LITS-7781",
    animal_type: "cattle",
    breed: "Tswana",
    gender: "female",
    date_of_birth: "2023-04-20",
    colour: "Black",
    location: "Molepolole",
    acquired_date: "2023-04-20",
    status: "active",
    acquired_how: "born",
    notes: null,
    created_at: ts("2024-01-01"),
    updated_at: ts("2024-01-01"),
  },
  {
    animal_id: "a6",
    owner_id: FARMER_ID,
    tag_number: "BW-KW-0055",
    lits_tag: "LITS-3304",
    animal_type: "cattle",
    breed: "Nguni",
    gender: "female",
    date_of_birth: "2022-08-14",
    colour: "Multi-colour",
    location: "Ramotswa",
    acquired_date: "2023-01-15",
    status: "active",
    acquired_how: "born",
    notes: null,
    created_at: ts("2024-02-10"),
    updated_at: ts("2024-02-10"),
  },
  {
    animal_id: "a7",
    owner_id: FARMER_ID,
    tag_number: "BW-KW-0063",
    lits_tag: null,
    animal_type: "cattle",
    breed: "Brahman",
    gender: "female",
    date_of_birth: "2021-12-01",
    colour: "White",
    location: "Gabane",
    acquired_date: "2022-03-20",
    status: "active",
    acquired_how: "born",
    notes: null,
    created_at: ts("2024-02-15"),
    updated_at: ts("2024-02-15"),
  },
  {
    animal_id: "a8",
    owner_id: FARMER_ID,
    tag_number: "BW-KW-0071",
    lits_tag: "LITS-5502",
    animal_type: "cattle",
    breed: "Tswana",
    gender: "male",
    date_of_birth: "2020-05-10",
    colour: "Dark brown",
    location: "Lobatse",
    acquired_date: "2020-05-10",
    status: "sold",
    acquired_how: "born",
    notes: "Sold to Lobatse abattoir",
    created_at: ts("2024-03-01"),
    updated_at: ts("2024-09-15"),
  },
  {
    animal_id: "a9",
    owner_id: FARMER_ID,
    tag_number: "BW-KW-0078",
    lits_tag: "LITS-8817",
    animal_type: "cattle",
    breed: "Bonsmara",
    gender: "male",
    date_of_birth: "2023-09-05",
    colour: "Red",
    location: "Molepolole",
    acquired_date: "2023-09-05",
    status: "active",
    acquired_how: "born",
    notes: "Young bull, promising genetics",
    created_at: ts("2024-03-10"),
    updated_at: ts("2024-03-10"),
  },
  {
    animal_id: "a10",
    owner_id: FARMER_ID,
    tag_number: "BW-KW-0082",
    lits_tag: null,
    animal_type: "cattle",
    breed: "Simmental",
    gender: "female",
    date_of_birth: "2018-02-20",
    colour: "Yellow",
    location: "Thamaga",
    acquired_date: "2018-02-20",
    status: "deceased",
    acquired_how: "born",
    notes: "Died of old age, 2024-08",
    created_at: ts("2024-01-15"),
    updated_at: ts("2024-08-01"),
  },
];

// ── Vaccinations ───────────────────────────────────────────────────
export const mockVaccinations: Vaccination[] = [
  // Overdue
  { vacc_id: "v1", animal_id: "a1", logged_by: VET_ID, vaccine_name: "FMD", date_given: daysAgo(200), next_due_date: daysAgo(20), vet_name: "Dr. Mogale", batch_number: "FMD-2024-A1", notes: null, reminder_sent: true, created_at: ts(daysAgo(200)) },
  { vacc_id: "v2", animal_id: "a2", logged_by: VET_ID, vaccine_name: "Anthrax", date_given: daysAgo(380), next_due_date: daysAgo(15), vet_name: "Dr. Mogale", batch_number: "ANT-2024-B3", notes: null, reminder_sent: true, created_at: ts(daysAgo(380)) },
  { vacc_id: "v3", animal_id: "a3", logged_by: VET_ID, vaccine_name: "FMD", date_given: daysAgo(210), next_due_date: daysAgo(30), vet_name: "Dr. Mogale", batch_number: "FMD-2024-A2", notes: null, reminder_sent: false, created_at: ts(daysAgo(210)) },
  { vacc_id: "v4", animal_id: "a6", logged_by: VET_ID, vaccine_name: "Blackleg", date_given: daysAgo(370), next_due_date: daysAgo(5), vet_name: "Dr. Mogale", batch_number: "BLK-2024-C1", notes: null, reminder_sent: true, created_at: ts(daysAgo(370)) },
  // Upcoming (within 14 days)
  { vacc_id: "v5", animal_id: "a4", logged_by: VET_ID, vaccine_name: "CBPP", date_given: daysAgo(170), next_due_date: daysFromNow(7), vet_name: "Dr. Mogale", batch_number: "CBP-2024-D2", notes: null, reminder_sent: false, created_at: ts(daysAgo(170)) },
  { vacc_id: "v6", animal_id: "a5", logged_by: VET_ID, vaccine_name: "FMD", date_given: daysAgo(173), next_due_date: daysFromNow(10), vet_name: "Dr. Mogale", batch_number: "FMD-2024-A3", notes: null, reminder_sent: false, created_at: ts(daysAgo(173)) },
  { vacc_id: "v7", animal_id: "a7", logged_by: VET_ID, vaccine_name: "Brucellosis", date_given: daysAgo(350), next_due_date: daysFromNow(12), vet_name: "Dr. Mogale", batch_number: "BRU-2024-E1", notes: "Heifer vaccination", reminder_sent: false, created_at: ts(daysAgo(350)) },
  // Current (not due yet)
  { vacc_id: "v8", animal_id: "a1", logged_by: VET_ID, vaccine_name: "Blackleg", date_given: daysAgo(60), next_due_date: daysFromNow(305), vet_name: "Dr. Mogale", batch_number: "BLK-2025-C2", notes: null, reminder_sent: false, created_at: ts(daysAgo(60)) },
  { vacc_id: "v9", animal_id: "a2", logged_by: VET_ID, vaccine_name: "FMD", date_given: daysAgo(30), next_due_date: daysFromNow(150), vet_name: "Dr. Mogale", batch_number: "FMD-2025-A4", notes: null, reminder_sent: false, created_at: ts(daysAgo(30)) },
  { vacc_id: "v10", animal_id: "a4", logged_by: VET_ID, vaccine_name: "Anthrax", date_given: daysAgo(90), next_due_date: daysFromNow(275), vet_name: "Dr. Mogale", batch_number: "ANT-2025-B4", notes: null, reminder_sent: false, created_at: ts(daysAgo(90)) },
  { vacc_id: "v11", animal_id: "a9", logged_by: VET_ID, vaccine_name: "FMD", date_given: daysAgo(45), next_due_date: daysFromNow(135), vet_name: "Dr. Mogale", batch_number: "FMD-2025-A5", notes: "First vaccination", reminder_sent: false, created_at: ts(daysAgo(45)) },
  { vacc_id: "v12", animal_id: "a5", logged_by: VET_ID, vaccine_name: "LSD", date_given: daysAgo(80), next_due_date: daysFromNow(285), vet_name: "Dr. Mogale", batch_number: "LSD-2025-F1", notes: null, reminder_sent: false, created_at: ts(daysAgo(80)) },
  { vacc_id: "v13", animal_id: "a6", logged_by: VET_ID, vaccine_name: "FMD", date_given: daysAgo(20), next_due_date: daysFromNow(160), vet_name: "Dr. Mogale", batch_number: "FMD-2025-A6", notes: null, reminder_sent: false, created_at: ts(daysAgo(20)) },
];

// ── Health Events ──────────────────────────────────────────────────
export const mockHealthEvents: HealthEvent[] = [
  { event_id: "h1", animal_id: "a1", logged_by: VET_ID, event_date: daysAgo(45), event_type: "disease", condition_name: "Lumpy Skin Disease", severity: "moderate", symptoms: "Skin nodules, fever, reduced appetite", treatment_given: "Antibiotic injection, anti-inflammatory", vet_name: "Dr. Mogale", outcome: "recovered", followup_date: daysAgo(30), notes: null, created_at: ts(daysAgo(45)) },
  { event_id: "h2", animal_id: "a2", logged_by: VET_ID, event_date: daysAgo(30), event_type: "disease", condition_name: "Foot & Mouth", severity: "severe", symptoms: "Blisters on mouth and hooves, drooling, lameness", treatment_given: "Quarantine, supportive care", vet_name: "Dr. Mogale", outcome: "recovering", followup_date: daysFromNow(7), notes: "Keep isolated from herd", created_at: ts(daysAgo(30)) },
  { event_id: "h3", animal_id: "a3", logged_by: FARMER_ID, event_date: daysAgo(60), event_type: "injury", condition_name: "Wire Cut", severity: "mild", symptoms: "Laceration on left foreleg", treatment_given: "Wound cleaning, topical antibiotic", vet_name: null, outcome: "recovered", followup_date: null, notes: "Caused by broken fence", created_at: ts(daysAgo(60)) },
  { event_id: "h4", animal_id: "a4", logged_by: VET_ID, event_date: daysAgo(15), event_type: "checkup", condition_name: null, severity: null, symptoms: null, treatment_given: null, vet_name: "Dr. Mogale", outcome: null, followup_date: null, notes: "Routine annual checkup — all clear", created_at: ts(daysAgo(15)) },
  { event_id: "h5", animal_id: "a6", logged_by: VET_ID, event_date: daysAgo(90), event_type: "disease", condition_name: "Brucellosis", severity: "severe", symptoms: "Abortion, reduced milk yield", treatment_given: "Antibiotic course, isolation", vet_name: "Dr. Mogale", outcome: "ongoing", followup_date: daysAgo(60), notes: "Test positive, notified DVS", created_at: ts(daysAgo(90)) },
  { event_id: "h6", animal_id: "a7", logged_by: FARMER_ID, event_date: daysAgo(120), event_type: "treatment", condition_name: "Tick Fever", severity: "moderate", symptoms: "High temperature, pale mucous membranes", treatment_given: "Berenil injection", vet_name: "Dr. Mogale", outcome: "recovered", followup_date: daysAgo(105), notes: null, created_at: ts(daysAgo(120)) },
  { event_id: "h7", animal_id: "a9", logged_by: VET_ID, event_date: daysAgo(7), event_type: "disease", condition_name: "Blackleg", severity: "critical", symptoms: "Sudden lameness, swollen leg, high fever", treatment_given: "Penicillin injection, emergency care", vet_name: "Dr. Mogale", outcome: "recovering", followup_date: daysFromNow(7), notes: "Caught early, prognosis good", created_at: ts(daysAgo(7)) },
];

// ── Breeding Records ──────────────────────────────────────────────
// Extended with fields used by the breeding page that aren't in the DB schema yet
type MockBreedingRecord = BreedingRecord & {
  mate_animal_id?: string | null;
  mate_tag_number?: string | null;
  expected_calving_date?: string | null;
  actual_calving_date?: string | null;
  offspring_id?: string | null;
};
export const mockBreedingRecords: MockBreedingRecord[] = [
  { breeding_id: "b1", animal_id: "a1", logged_by: FARMER_ID, event_type: "mating", event_date: daysAgo(250), mate_tag: "BW-KW-0005", sire_breed: "Simmental", mate_animal_id: "a4", mate_tag_number: "BW-KW-0005", expected_calving_date: daysFromNow(33), actual_calving_date: null, offspring_id: null, notes: "Natural mating", created_at: ts(daysAgo(250)) },
  { breeding_id: "b2", animal_id: "a3", logged_by: FARMER_ID, event_type: "pregnant", event_date: daysAgo(220), mate_tag: "BW-KW-0005", sire_breed: "Simmental", mate_animal_id: "a4", mate_tag_number: "BW-KW-0005", expected_calving_date: daysFromNow(15), actual_calving_date: null, offspring_id: null, notes: "Confirmed by vet palpation", created_at: ts(daysAgo(220)) },
  { breeding_id: "b3", animal_id: "a5", logged_by: FARMER_ID, event_type: "calving", event_date: daysAgo(90), mate_tag: "BW-KW-0018", sire_breed: "Brahman", mate_animal_id: "a2", mate_tag_number: "BW-KW-0018", expected_calving_date: daysAgo(85), actual_calving_date: daysAgo(90), offspring_id: "a9", notes: "Healthy bull calf", created_at: ts(daysAgo(90)) },
  { breeding_id: "b4", animal_id: "a7", logged_by: FARMER_ID, event_type: "mating", event_date: daysAgo(60), mate_tag: "BW-KW-0005", sire_breed: "Simmental", mate_animal_id: "a4", mate_tag_number: "BW-KW-0005", expected_calving_date: daysFromNow(223), actual_calving_date: null, offspring_id: null, notes: null, created_at: ts(daysAgo(60)) },
  { breeding_id: "b5", animal_id: "a6", logged_by: FARMER_ID, event_type: "abortion", event_date: daysAgo(85), mate_tag: null, sire_breed: null, mate_animal_id: null, mate_tag_number: null, expected_calving_date: daysAgo(60), actual_calving_date: null, offspring_id: null, notes: "Linked to brucellosis diagnosis", created_at: ts(daysAgo(85)) },
  { breeding_id: "b6", animal_id: "a5", logged_by: FARMER_ID, event_type: "weaning", event_date: daysAgo(10), mate_tag: null, sire_breed: null, mate_animal_id: null, mate_tag_number: null, expected_calving_date: null, actual_calving_date: null, offspring_id: "a9", notes: "Calf weaned at 80 days", created_at: ts(daysAgo(10)) },
];

// ── Movements ──────────────────────────────────────────────────────
export const mockMovements: Movement[] = [
  { movement_id: "m1", animal_id: "a3", logged_by: FARMER_ID, movement_type: "transfer", from_location: "Molepolole", to_location: "Gabane", movement_date: daysAgo(120), permit_number: null, notes: "Grazing rotation", created_at: ts(daysAgo(120)) },
  { movement_id: "m2", animal_id: "a8", logged_by: FARMER_ID, movement_type: "sale", from_location: "Molepolole", to_location: "Lobatse BMC", movement_date: daysAgo(60), permit_number: "MOV-2024-1547", notes: "Sale to abattoir — transport by licensed carrier", created_at: ts(daysAgo(60)) },
  { movement_id: "m3", animal_id: "a6", logged_by: FARMER_ID, movement_type: "purchase", from_location: "Ramotswa Market", to_location: "Ramotswa", movement_date: "2023-01-15", permit_number: "MOV-2023-0892", notes: "Purchase from market", created_at: ts("2023-01-15") },
  { movement_id: "m4", animal_id: "a4", logged_by: FARMER_ID, movement_type: "transfer", from_location: "Molepolole", to_location: "Thamaga", movement_date: daysAgo(200), permit_number: null, notes: "Breeding programme relocation", created_at: ts(daysAgo(200)) },
];

// ── Alerts ──────────────────────────────────────────────────────────
export const mockAlerts: Alert[] = [
  { alert_id: "al1", user_id: FARMER_ID, animal_id: "a1", alert_type: "vaccination_overdue", severity: "critical", title: "FMD Vaccination Overdue", message: "BW-KW-0042 (Tswana) FMD vaccination is 20 days overdue. BMC compliance at risk.", is_read: false, email_sent: true, created_at: ts(daysAgo(1)) },
  { alert_id: "al2", user_id: FARMER_ID, animal_id: null, alert_type: "outbreak", severity: "critical", title: "FMD Outbreak Alert — Kweneng District", message: "DVS has reported Foot & Mouth cases in the Kweneng region. Ensure all animals are vaccinated and monitor for symptoms.", is_read: false, email_sent: true, created_at: ts(daysAgo(2)) },
  { alert_id: "al3", user_id: FARMER_ID, animal_id: "a4", alert_type: "vaccination_due", severity: "warning", title: "CBPP Vaccination Due Soon", message: "BW-KW-0005 (Simmental) CBPP vaccination due in 7 days.", is_read: false, email_sent: false, created_at: ts(daysAgo(3)) },
  { alert_id: "al4", user_id: FARMER_ID, animal_id: "a3", alert_type: "disease_risk", severity: "warning", title: "Expected Calving — BW-KW-0031", message: "BW-KW-0031 (Bonsmara) expected to calve within 15 days. Prepare calving area and monitor closely.", is_read: false, email_sent: false, created_at: ts(daysAgo(3)) },
  { alert_id: "al5", user_id: FARMER_ID, animal_id: "a2", alert_type: "health_event", severity: "warning", title: "Follow-up Required — BW-KW-0018", message: "BW-KW-0018 (Brahman) Foot & Mouth follow-up scheduled. Check recovery progress.", is_read: true, email_sent: true, created_at: ts(daysAgo(5)) },
  { alert_id: "al6", user_id: FARMER_ID, animal_id: "a9", alert_type: "vaccination_due", severity: "info", title: "Vaccination Recorded", message: "FMD vaccination for BW-KW-0078 (Bonsmara) successfully recorded.", is_read: true, email_sent: false, created_at: ts(daysAgo(7)) },
  { alert_id: "al7", user_id: FARMER_ID, animal_id: null, alert_type: "system", severity: "info", title: "Monthly Herd Report Available", message: "Your March 2026 herd summary report is ready. View it in the Reports section.", is_read: true, email_sent: true, created_at: ts(daysAgo(10)) },
  { alert_id: "al8", user_id: FARMER_ID, animal_id: "a5", alert_type: "system", severity: "info", title: "Weaning Record Logged", message: "Weaning event for BW-KW-0009 (Tswana) calf has been recorded.", is_read: true, email_sent: false, created_at: ts(daysAgo(10)) },
  { alert_id: "al9", user_id: FARMER_ID, animal_id: null, alert_type: "system", severity: "info", title: "Welcome to LMHTS", message: "Your account has been activated. Start by registering your animals.", is_read: true, email_sent: true, created_at: ts(daysAgo(90)) },
  { alert_id: "al10", user_id: FARMER_ID, animal_id: "a6", alert_type: "disease_risk", severity: "info", title: "Brucellosis Test Reminder", message: "BW-KW-0055 (Nguni) is due for a follow-up brucellosis test.", is_read: false, email_sent: false, created_at: ts(daysAgo(4)) },
];

// ── Lookup helpers ─────────────────────────────────────────────────
export function getAnimalByTag(tag: string) {
  return mockAnimals.find((a) => a.tag_number === tag) ?? null;
}

export function getAnimalById(id: string) {
  return mockAnimals.find((a) => a.animal_id === id) ?? null;
}

export function getVaccinationsForAnimal(animalId: string) {
  return mockVaccinations.filter((v) => v.animal_id === animalId);
}

export function getHealthEventsForAnimal(animalId: string) {
  return mockHealthEvents.filter((e) => e.animal_id === animalId);
}

export function getBreedingRecordsForAnimal(animalId: string) {
  return mockBreedingRecords.filter((b) => b.animal_id === animalId);
}

export function getMovementsForAnimal(animalId: string) {
  return mockMovements.filter((m) => m.animal_id === animalId);
}
