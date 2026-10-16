// One-off: assigns org_id = Province 23 to real Adult students who were
// deliberately left unassigned when the YAYA Sunday quiz went live (Adult
// content wasn't ready yet). Confirmed by the project owner that these
// Adult students also belong to Province 23.
//
// Usage:
//   $env:SUPABASE_URL = 'https://eubroxxcchuozvpcwbdv.supabase.co'
//   node --env-file=.env.scripts.local scripts/assign-province23-adults.js

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

  const { data: students, error: studentsError } = await supabase
    .from("users_profile")
    .update({ org_id: orgId })
    .eq("role", "student")
    .ilike("class", "adult")
    .is("org_id", null)
    .select("id, name, email");
  if (studentsError) throw new Error("Student update failed: " + studentsError.message);
  console.log(`Updated ${students.length} adult student(s):`);
  students.forEach((s) => console.log("  -", s.name, s.email));

  console.log("Done.");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
