// One-off: creates a dedicated, non-human "monitoring bot" admin account,
// scoped to Province 23, used only by the scheduled scope-check Edge
// Function (supabase/functions/scope-check) to verify that a real
// authenticated province_admin session only ever gets back data within
// its own province — the exact invariant that silently broke in
// production on 2026-10-16 (see PROJECT_HANDOFF.md).
//
// Deliberately a SEPARATE account from any real human admin, so the
// check's own activity doesn't show up as a real person's actions, and
// so its credentials can live in Edge Function secrets without being
// anyone's real login.
//
// Usage:
//   $env:SUPABASE_URL = 'https://eubroxxcchuozvpcwbdv.supabase.co'
//   node --env-file=.env.scripts.local scripts/create-monitor-account.js

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://ciqvukvorajxhiqmwkbj.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MONITOR_EMAIL = "scope-monitor@quizmaster.internal";
const MONITOR_PASSWORD = process.env.MONITOR_PASSWORD;

if (!SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY env var.");
  process.exit(1);
}
if (!MONITOR_PASSWORD) {
  console.error("Set $env:MONITOR_PASSWORD to a strong random password first (you'll also put this in the Edge Function secret).");
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

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: MONITOR_EMAIL,
    password: MONITOR_PASSWORD,
    email_confirm: true,
  });
  if (createError) throw new Error("Failed to create auth user: " + createError.message);
  console.log("Created auth user:", created.user.id);

  const { error: profileError } = await supabase.from("users_profile").insert({
    id: created.user.id,
    email: MONITOR_EMAIL,
    name: "Scope Monitor (automated)",
    role: "province_admin",
    org_id: province.id,
  });
  if (profileError) throw new Error("Failed to create profile: " + profileError.message);

  console.log("Done. Monitor account ready, scoped to Province 23.");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
