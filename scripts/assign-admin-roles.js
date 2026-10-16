// One-off: promotes the 3 real admin accounts (currently all legacy
// role='admin', which bypasses org-scoping entirely via is_admin()) into
// the actual scoped role system that's been built but never applied to a
// real account (roadmap task t14).
//
//   oyasikelly2000@gmail.com          -> super_admin, org_id = Region 70 (root)
//   quizmasterofficial2024@gmail.com  -> province_admin, org_id = Province 23
//   rccgdelta23sundayschool@gmail.com -> province_admin, org_id = Province 23
//
// Safe per 20240101000016's own design note: my_scoped_org_ids() already
// supports all 5 scoped roles via org_subtree_ids(), so a super_admin
// assigned the region root sees every province beneath it automatically
// — no RLS changes needed, just correct role + org_id.
//
// Usage:
//   node --env-file=.env.staging.local scripts/assign-admin-roles.js       # staging
//   $env:SUPABASE_URL = 'https://eubroxxcchuozvpcwbdv.supabase.co'
//   node --env-file=.env.scripts.local scripts/assign-admin-roles.js       # production

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

  const { data: region, error: regionError } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("level", "region")
    .single();
  if (regionError || !region) throw new Error("Region root not found: " + (regionError?.message || ""));
  console.log("Region root:", region.name, region.id);

  const { data: province, error: provinceError } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("level", "province")
    .eq("code", "23")
    .single();
  if (provinceError || !province) throw new Error("Province 23 not found: " + (provinceError?.message || ""));
  console.log("Province 23:", province.name, province.id);

  const { data: superAdmin, error: superAdminError } = await supabase
    .from("users_profile")
    .update({ role: "super_admin", org_id: region.id })
    .eq("email", "oyasikelly2000@gmail.com")
    .select("name, email, role, org_id");
  if (superAdminError) throw new Error("Super admin update failed: " + superAdminError.message);
  console.log("Super admin:", superAdmin);

  const { data: provinceAdmins, error: provinceAdminsError } = await supabase
    .from("users_profile")
    .update({ role: "province_admin", org_id: province.id })
    .in("email", ["quizmasterofficial2024@gmail.com", "rccgdelta23sundayschool@gmail.com"])
    .select("name, email, role, org_id");
  if (provinceAdminsError) throw new Error("Province admin update failed: " + provinceAdminsError.message);
  console.log("Province admins:", provinceAdmins);

  console.log("Done.");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
