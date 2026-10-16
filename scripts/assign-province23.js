// One-off: assigns org_id = Province 23 to the real admin accounts and
// YAYA students on production, ahead of Sunday's quiz. Adult students are
// deliberately left with org_id = null — they keep using the existing
// JSON-file path unchanged, since this round only concerns the YAYA
// Sunday quiz.
//
// Usage:
//   $env:SUPABASE_URL = 'https://eubroxxcchuozvpcwbdv.supabase.co'
//   node --env-file=.env.scripts.local scripts/assign-province23.js

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://ciqvukvorajxhiqmwkbj.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY env var.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log("Target:", SUPABASE_URL);

  const { data: province, error: provinceError } = await supabase
    .from("organizations")
    .select("id")
    .eq("level", "province")
    .eq("code", "23")
    .single();
  if (provinceError || !province) throw new Error("Province 23 not found: " + (provinceError?.message || ""));
  const orgId = province.id;
  console.log("Province 23 org_id:", orgId);

  const { data: admins, error: adminsError } = await supabase
    .from("users_profile")
    .update({ org_id: orgId })
    .eq("role", "admin")
    .is("org_id", null)
    .select("id, name, email");
  if (adminsError) throw new Error("Admin update failed: " + adminsError.message);
  console.log(`Updated ${admins.length} admin(s):`);
  admins.forEach((a) => console.log("  -", a.name, a.email));

  const { data: students, error: studentsError } = await supabase
    .from("users_profile")
    .update({ org_id: orgId })
    .eq("role", "student")
    .eq("class", "yaya")
    .is("org_id", null)
    .select("id, name, email");
  if (studentsError) throw new Error("Student update failed: " + studentsError.message);
  console.log(`Updated ${students.length} yaya student(s):`);
  students.forEach((s) => console.log("  -", s.name, s.email));

  console.log("Done.");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
