import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ── Auth — use service role key from env (auto-injected by Supabase) ─
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const brevoApiKey = Deno.env.get("BREVO_API_KEY") ?? "";
  const brevoSenderEmail = Deno.env.get("BREVO_SENDER_EMAIL") ?? "sengatejunior@gmail.com";
  const brevoSenderName = Deno.env.get("BREVO_SENDER_NAME") ?? "LMHTS";

  // Verify the caller passed a valid service-role or anon key
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const today = new Date().toISOString().split("T")[0];
  const errors: string[] = [];
  const counts = { rule1: 0, rule2: 0, rule3: 0, rule4: 0 };
  let vetNotifications = 0;

  // ── Load system settings (with fallbacks) ─────────────────────────
  let bmcThreshold = 80;
  let reminderDays = 7;
  let overdueEscalationDays = 15;
  let emailEnabled = true;
  let senderName = "LMHTS";

  try {
    const { data: s1 } = await supabase.rpc("get_system_setting", { p_key: "bmc_threshold" });
    if (s1 != null) bmcThreshold = typeof s1 === "number" ? s1 : Number(s1) || 80;

    const { data: s2 } = await supabase.rpc("get_system_setting", { p_key: "reminder_days" });
    if (s2 != null) reminderDays = typeof s2 === "number" ? s2 : Number(s2) || 7;

    const { data: s3 } = await supabase.rpc("get_system_setting", { p_key: "overdue_escalation_days" });
    if (s3 != null) overdueEscalationDays = typeof s3 === "number" ? s3 : Number(s3) || 15;

    const { data: s4 } = await supabase.rpc("get_system_setting", { p_key: "email_enabled" });
    if (s4 != null) emailEnabled = s4 === true || s4 === "true";

    const { data: s5 } = await supabase.rpc("get_system_setting", { p_key: "sender_name" });
    if (s5 != null && typeof s5 === "string" && s5.length > 0) senderName = s5;
  } catch (_) {
    // Settings table may not exist yet; use defaults
  }

  // ── Fetch user emails from auth.users ───────────────────────────────
  const emailMap = new Map<string, string>();
  const nameMap = new Map<string, string>();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("is_active", true);

  if (profiles) {
    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    for (const user of authData?.users ?? []) {
      if (user.email) emailMap.set(user.id, user.email);
    }
    for (const p of profiles) {
      nameMap.set(p.id, p.full_name);
    }
  }

  // ── Helper: send email via Brevo ────────────────────────────────────
  async function sendEmail(
    toEmail: string,
    toName: string,
    subject: string,
    body: string
  ): Promise<boolean> {
    if (!emailEnabled || !brevoApiKey || !toEmail) return false;
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name: brevoSenderName, email: brevoSenderEmail },
          to: [{ email: toEmail, name: toName }],
          subject,
          htmlContent: emailTemplate(toName, subject, body),
        }),
      });
      return res.ok;
    } catch (err) {
      errors.push(`Email to ${toEmail}: ${(err as Error).message}`);
      return false;
    }
  }

  // ── Helper: branded email template ──────────────────────────────────
  function emailTemplate(name: string, title: string, content: string): string {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#faf7f0;font-family:Inter,system-ui,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="background:#0f2318;padding:20px 24px;border-radius:12px 12px 0 0">
      <h1 style="margin:0;color:#c8861a;font-size:20px;font-weight:700">LMHTS</h1>
      <p style="margin:4px 0 0;color:#e8dfc8;font-size:12px">Livestock Management &amp; Health Tracking</p>
    </div>
    <div style="background:#ffffff;padding:24px;border:1px solid #e5e0d2;border-top:none">
      <p style="margin:0 0 16px;color:#1c3829;font-size:15px">Hello ${name},</p>
      <h2 style="margin:0 0 12px;color:#0f2318;font-size:17px">${title}</h2>
      <div style="color:#1c3829;font-size:14px;line-height:1.6">${content}</div>
      <div style="margin-top:24px">
        <a href="https://lmhts.vercel.app/dashboard" style="display:inline-block;background:#1c3829;color:#c8861a;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Open Dashboard</a>
      </div>
    </div>
    <div style="padding:16px 24px;text-align:center;border-radius:0 0 12px 12px;background:#f2ead6">
      <p style="margin:0;color:#6b7564;font-size:11px">LMHTS &mdash; BMC Compliance &amp; Herd Health for Botswana</p>
    </div>
  </div>
</body></html>`;
  }

  // ── Helper: insert alert ────────────────────────────────────────────
  async function insertAlert(
    userId: string,
    animalId: string | null,
    alertType: string,
    severity: string,
    title: string,
    message: string,
    emailSent: boolean
  ) {
    await supabase.from("alerts").insert({
      user_id: userId,
      animal_id: animalId,
      alert_type: alertType,
      severity,
      title,
      message,
      email_sent: emailSent,
    });
  }

  // ── Helper: check if alert already exists today ─────────────────────
  async function alertExistsToday(
    userId: string,
    alertType: string,
    animalId: string | null
  ): Promise<boolean> {
    let query = supabase
      .from("alerts")
      .select("alert_id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("alert_type", alertType)
      .gte("created_at", today);

    if (animalId) {
      query = query.eq("animal_id", animalId);
    }

    const { count } = await query;
    return (count ?? 0) > 0;
  }

  // ── Cache: vet assignments per farmer ───────────────────────────────
  const vetCache = new Map<string, Array<{ vet_id: string }>>();

  async function getAssignedVets(farmerId: string): Promise<Array<{ vet_id: string }>> {
    if (vetCache.has(farmerId)) return vetCache.get(farmerId)!;
    const { data } = await supabase
      .from("vet_assignments")
      .select("vet_id")
      .eq("farmer_id", farmerId)
      .eq("is_active", true);
    const vets = data ?? [];
    vetCache.set(farmerId, vets);
    return vets;
  }

  // ── Helper: notify assigned vets ──────────────────────────────────
  async function notifyAssignedVets(
    farmerId: string,
    animalId: string | null,
    alertType: string,
    severity: string,
    alertTitle: string,
    alertMessage: string,
    emailSubject: string,
    emailBody: string
  ) {
    const vets = await getAssignedVets(farmerId);
    const farmerName = nameMap.get(farmerId) ?? "Farmer";

    for (const { vet_id } of vets) {
      // Dedup: skip if vet already alerted today for this type+animal
      if (await alertExistsToday(vet_id, alertType, animalId)) continue;

      const vetEmail = emailMap.get(vet_id);
      const vetName = nameMap.get(vet_id) ?? "Vet";

      const vetBody = `<p style="color:#6b7564;font-size:13px;margin:0 0 12px;border-left:3px solid #c8861a;padding-left:10px">
        Regarding your assigned farmer <strong>${farmerName}</strong></p>${emailBody}`;

      const sent = vetEmail
        ? await sendEmail(vetEmail, vetName, `[LMHTS Vet Alert] ${emailSubject}`, vetBody)
        : false;

      await insertAlert(
        vet_id,
        animalId,
        alertType,
        severity,
        alertTitle,
        `[${farmerName}] ${alertMessage}`,
        sent
      );

      vetNotifications++;
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // RULE 1: 7-day advance vaccination reminder
  // ════════════════════════════════════════════════════════════════════
  try {
    const reminderWindow = new Date();
    reminderWindow.setDate(reminderWindow.getDate() + reminderDays);
    const sevenDaysStr = reminderWindow.toISOString().split("T")[0];

    const { data: dueVaccs } = await supabase
      .from("vaccinations")
      .select("vacc_id, animal_id, vaccine_name, next_due_date, animals(tag_number, owner_id)")
      .eq("reminder_sent", false)
      .gte("next_due_date", today)
      .lte("next_due_date", sevenDaysStr);

    for (const v of dueVaccs ?? []) {
      const animal = v.animals as unknown as { tag_number: string; owner_id: string } | null;
      if (!animal) continue;
      const email = emailMap.get(animal.owner_id);
      const name = nameMap.get(animal.owner_id) ?? "Farmer";

      const sent = email
        ? await sendEmail(
            email,
            name,
            `Vaccination Due: ${v.vaccine_name} for ${animal.tag_number}`,
            `<p>The <strong>${v.vaccine_name}</strong> vaccination for animal <strong>${animal.tag_number}</strong> is due on <strong>${v.next_due_date}</strong>.</p>
             <p>Please schedule the vaccination to maintain BMC compliance.</p>`
          )
        : false;

      await insertAlert(
        animal.owner_id,
        v.animal_id,
        "vaccination_due",
        "info",
        `${v.vaccine_name} due for ${animal.tag_number}`,
        `Vaccination due on ${v.next_due_date}. Schedule now to stay compliant.`,
        sent
      );

      // Notify assigned vets
      await notifyAssignedVets(
        animal.owner_id,
        v.animal_id,
        "vaccination_due",
        "info",
        `${v.vaccine_name} due for ${animal.tag_number}`,
        `Vaccination due on ${v.next_due_date}. Schedule now to stay compliant.`,
        `Vaccination Due: ${v.vaccine_name} for ${animal.tag_number}`,
        `<p>The <strong>${v.vaccine_name}</strong> vaccination for animal <strong>${animal.tag_number}</strong> is due on <strong>${v.next_due_date}</strong>.</p>
         <p>Please follow up with the farmer to ensure BMC compliance.</p>`
      );

      // Mark reminder as sent to prevent duplicates
      await supabase
        .from("vaccinations")
        .update({ reminder_sent: true })
        .eq("vacc_id", v.vacc_id);

      counts.rule1++;
    }
  } catch (err) {
    errors.push(`Rule 1: ${(err as Error).message}`);
  }

  // ════════════════════════════════════════════════════════════════════
  // RULE 2: Overdue vaccination alert
  // ════════════════════════════════════════════════════════════════════
  try {
    const { data: overdueVaccs } = await supabase
      .from("vaccinations")
      .select("vacc_id, animal_id, vaccine_name, next_due_date, animals(tag_number, owner_id)")
      .lt("next_due_date", today)
      .not("next_due_date", "is", null);

    for (const v of overdueVaccs ?? []) {
      const animal = v.animals as unknown as { tag_number: string; owner_id: string } | null;
      if (!animal) continue;

      // Dedup: skip if already alerted today
      if (await alertExistsToday(animal.owner_id, "vaccination_overdue", v.animal_id)) continue;

      const daysOverdue = Math.floor(
        (new Date(today).getTime() - new Date(v.next_due_date!).getTime()) / 86400000
      );
      const severity = daysOverdue >= overdueEscalationDays ? "critical" : "warning";

      const email = emailMap.get(animal.owner_id);
      const name = nameMap.get(animal.owner_id) ?? "Farmer";

      const sent = email
        ? await sendEmail(
            email,
            name,
            `OVERDUE: ${v.vaccine_name} for ${animal.tag_number} (${daysOverdue} days)`,
            `<p>The <strong>${v.vaccine_name}</strong> vaccination for <strong>${animal.tag_number}</strong> was due on <strong>${v.next_due_date}</strong> and is now <strong>${daysOverdue} days overdue</strong>.</p>
             <p style="color:#c0392b;font-weight:600">Your BMC compliance status may be affected. Please vaccinate as soon as possible.</p>`
          )
        : false;

      await insertAlert(
        animal.owner_id,
        v.animal_id,
        "vaccination_overdue",
        severity,
        `${v.vaccine_name} overdue for ${animal.tag_number}`,
        `${daysOverdue} days overdue. Was due ${v.next_due_date}. Vaccinate immediately.`,
        sent
      );

      // Notify assigned vets
      await notifyAssignedVets(
        animal.owner_id,
        v.animal_id,
        "vaccination_overdue",
        severity,
        `${v.vaccine_name} overdue for ${animal.tag_number}`,
        `${daysOverdue} days overdue. Was due ${v.next_due_date}. Vaccinate immediately.`,
        `OVERDUE: ${v.vaccine_name} for ${animal.tag_number} (${daysOverdue} days)`,
        `<p>The <strong>${v.vaccine_name}</strong> vaccination for <strong>${animal.tag_number}</strong> was due on <strong>${v.next_due_date}</strong> and is now <strong>${daysOverdue} days overdue</strong>.</p>
         <p style="color:#c0392b;font-weight:600">BMC compliance may be affected. Please follow up with the farmer.</p>`
      );

      counts.rule2++;
    }
  } catch (err) {
    errors.push(`Rule 2: ${(err as Error).message}`);
  }

  // ════════════════════════════════════════════════════════════════════
  // RULE 3: Coverage below 80% BMC threshold
  // ════════════════════════════════════════════════════════════════════
  try {
    // Get all active animals with their vaccination status
    const { data: animals } = await supabase
      .from("animals")
      .select("animal_id, owner_id, vaccinations(vacc_id, next_due_date)")
      .eq("status", "active");

    // Calculate per-farmer coverage
    const farmerStats = new Map<string, { total: number; covered: number }>();

    for (const a of animals ?? []) {
      const stats = farmerStats.get(a.owner_id) ?? { total: 0, covered: 0 };
      stats.total++;

      const vaccs = a.vaccinations as unknown as
        Array<{ vacc_id: string; next_due_date: string | null }> | null;

      const hasCurrent = (vaccs ?? []).some(
        (v) => v.next_due_date === null || v.next_due_date >= today
      );
      if (hasCurrent) stats.covered++;

      farmerStats.set(a.owner_id, stats);
    }

    for (const [ownerId, stats] of farmerStats) {
      if (stats.total === 0) continue;
      const coverage = Math.round((stats.covered / stats.total) * 100);
      if (coverage >= bmcThreshold) continue;

      // Dedup: one alert per farmer per day
      if (await alertExistsToday(ownerId, "disease_risk", null)) continue;

      const email = emailMap.get(ownerId);
      const name = nameMap.get(ownerId) ?? "Farmer";

      const sent = email
        ? await sendEmail(
            email,
            name,
            `BMC Warning: Vaccination coverage at ${coverage}%`,
            `<p>Your herd vaccination coverage is currently <strong>${coverage}%</strong>, which is below the <strong>${bmcThreshold}% BMC minimum</strong>.</p>
             <p>${stats.total - stats.covered} of ${stats.total} active animals have overdue or missing vaccinations.</p>
             <p style="color:#c0392b;font-weight:600">Please update your vaccination records to maintain compliance.</p>`
          )
        : false;

      await insertAlert(
        ownerId,
        null,
        "disease_risk",
        "warning",
        `Vaccination coverage at ${coverage}% (below ${bmcThreshold}% BMC minimum)`,
        `${stats.covered}/${stats.total} animals covered. ${stats.total - stats.covered} need attention.`,
        sent
      );

      // Notify assigned vets
      await notifyAssignedVets(
        ownerId,
        null,
        "disease_risk",
        "warning",
        `Vaccination coverage at ${coverage}% (below ${bmcThreshold}% BMC minimum)`,
        `${stats.covered}/${stats.total} animals covered. ${stats.total - stats.covered} need attention.`,
        `BMC Warning: ${name} at ${coverage}% coverage`,
        `<p>Herd vaccination coverage is currently <strong>${coverage}%</strong>, below the <strong>${bmcThreshold}% BMC minimum</strong>.</p>
         <p>${stats.total - stats.covered} of ${stats.total} active animals have overdue or missing vaccinations.</p>
         <p>Please coordinate with the farmer to improve compliance.</p>`
      );

      counts.rule3++;
    }
  } catch (err) {
    errors.push(`Rule 3: ${(err as Error).message}`);
  }

  // ════════════════════════════════════════════════════════════════════
  // RULE 4: Expected calving within 14 days
  // ════════════════════════════════════════════════════════════════════
  try {
    // Get breeding records that indicate pregnancy
    const { data: breeding } = await supabase
      .from("breeding_records")
      .select("breeding_id, animal_id, event_type, event_date, animals(tag_number, owner_id)")
      .in("event_type", ["mating", "pregnant", "ai"]);

    // Get all calving/abortion records to exclude completed pregnancies
    const { data: completed } = await supabase
      .from("breeding_records")
      .select("animal_id")
      .in("event_type", ["calving", "abortion"]);

    const completedAnimalIds = new Set((completed ?? []).map((c) => c.animal_id));

    const fourteenDays = new Date();
    fourteenDays.setDate(fourteenDays.getDate() + 14);

    for (const b of breeding ?? []) {
      // Skip if this animal already calved or aborted
      if (completedAnimalIds.has(b.animal_id)) continue;

      const animal = b.animals as unknown as { tag_number: string; owner_id: string } | null;
      if (!animal) continue;

      // Calculate expected calving date
      const eventDate = new Date(b.event_date);
      let expectedDate: Date;
      if (b.event_type === "mating" || b.event_type === "ai") {
        expectedDate = new Date(eventDate.getTime() + 283 * 86400000); // 283 days gestation
      } else {
        expectedDate = new Date(eventDate.getTime() + 60 * 86400000); // 60 days from pregnancy confirmation
      }

      // Check if within 14-day window
      const todayDate = new Date(today);
      if (expectedDate < todayDate || expectedDate > fourteenDays) continue;

      const expectedStr = expectedDate.toISOString().split("T")[0];

      // Dedup
      if (await alertExistsToday(animal.owner_id, "health_event", b.animal_id)) continue;

      const email = emailMap.get(animal.owner_id);
      const name = nameMap.get(animal.owner_id) ?? "Farmer";
      const daysUntil = Math.ceil(
        (expectedDate.getTime() - todayDate.getTime()) / 86400000
      );

      const sent = email
        ? await sendEmail(
            email,
            name,
            `Calving Expected: ${animal.tag_number} in ~${daysUntil} days`,
            `<p>Animal <strong>${animal.tag_number}</strong> is expected to calve around <strong>${expectedStr}</strong> (~${daysUntil} days from now).</p>
             <p>Please prepare calving facilities and monitor the animal closely. Consider having a veterinary contact available.</p>`
          )
        : false;

      await insertAlert(
        animal.owner_id,
        b.animal_id,
        "health_event",
        "info",
        `Expected calving: ${animal.tag_number} (~${daysUntil} days)`,
        `Estimated calving date: ${expectedStr}. Prepare facilities and monitor.`,
        sent
      );

      // Notify assigned vets
      await notifyAssignedVets(
        animal.owner_id,
        b.animal_id,
        "health_event",
        "info",
        `Expected calving: ${animal.tag_number} (~${daysUntil} days)`,
        `Estimated calving date: ${expectedStr}. Prepare facilities and monitor.`,
        `Calving Expected: ${animal.tag_number} in ~${daysUntil} days`,
        `<p>Animal <strong>${animal.tag_number}</strong> is expected to calve around <strong>${expectedStr}</strong> (~${daysUntil} days from now).</p>
         <p>Please ensure the farmer has veterinary support available.</p>`
      );

      counts.rule4++;
    }
  } catch (err) {
    errors.push(`Rule 4: ${(err as Error).message}`);
  }

  // ── Response ────────────────────────────────────────────────────────
  const summary = {
    timestamp: new Date().toISOString(),
    reminders_sent: counts,
    vet_notifications: vetNotifications,
    total: counts.rule1 + counts.rule2 + counts.rule3 + counts.rule4,
    errors,
  };

  console.log("send-reminders result:", JSON.stringify(summary));

  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
