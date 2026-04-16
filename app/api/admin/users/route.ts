import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  email?: string;
  password?: string;
  full_name?: string;
  role?: string;
  phone?: string;
  farm_name?: string;
  district?: string;
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const full_name =
    typeof body.full_name === "string" ? body.full_name.trim() : "";
  const role = typeof body.role === "string" ? body.role : "";
  const phone =
    typeof body.phone === "string" && body.phone.trim()
      ? body.phone.trim()
      : undefined;
  const farm_name =
    typeof body.farm_name === "string" && body.farm_name.trim()
      ? body.farm_name.trim()
      : undefined;
  const district =
    typeof body.district === "string" && body.district.trim()
      ? body.district.trim()
      : undefined;

  if (!email || !password || password.length < 8 || !full_name) {
    return NextResponse.json(
      { error: "email, password (min 8 chars), and full_name are required" },
      { status: 400 },
    );
  }

  if (!["farmer", "vet", "admin"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Server missing SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 },
    );
  }

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name,
      role,
      ...(phone ? { phone } : {}),
      ...(farm_name ? { farm_name } : {}),
      ...(district ? { district } : {}),
    },
  });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? "Create failed" },
      { status: 400 },
    );
  }

  await supabase.rpc("log_audit_entry", {
    p_action: "create_user",
    p_table_name: "profiles",
    p_record_id: created.user.id,
    p_old_data: null,
    p_new_data: JSON.stringify({ email, full_name, role }),
  });

  return NextResponse.json({ ok: true, userId: created.user.id });
}
