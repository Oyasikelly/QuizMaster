// One-off: creates a matching province_admin account on staging for the
// real production account that's showing the province-scoping leak, so
// it can be reproduced and debugged against localhost:3000 (which points
// at staging via .env.development.local) instead of only on the live
// production site.
//
// Usage: node --env-file=.env.staging.local scripts/clone-admin-to-staging.js

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://ciqvukvorajxhiqmwkbj.supabase.co"; // staging
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY env var.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const EMAIL = "eventtrybe2025@gmail.com";
const TEMP_PASSWORD = "StagingDebug-2026!";

async function main() {
  const { data: province, error: provinceError } = await supabase
    .from("organizations")
    .select("id")
    .eq("level", "province")
    .eq("code", "20")
    .single();
  if (provinceError || !province) throw new Error("Province 20 not found on staging: " + (provinceError?.message || ""));

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: TEMP_PASSWORD,
    email_confirm: true,
  });
  if (createError) throw new Error("Failed to create auth user: " + createError.message);
  console.log("Created auth user:", created.user.id);

  const { error: profileError } = await supabase.from("users_profile").insert({
    id: created.user.id,
    email: EMAIL,
    name: "Oyasi Kelly",
    role: "province_admin",
    org_id: province.id,
  });
  if (profileError) throw new Error("Failed to create profile: " + profileError.message);

  console.log("Done. Log in locally with:");
  console.log("  email:", EMAIL);
  console.log("  password:", TEMP_PASSWORD);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
