// Diagnostic only — logs in as the Province 20 admin and makes the exact
// same request the dashboard makes, dumping raw response headers and
// body so we can see what's actually coming back from Supabase for this
// specific authenticated session.
//
// Usage (PowerShell, run in your own terminal — password stays local):
//   $env:TEST_PASSWORD = "the real password for eventtrybe2025@gmail.com"
//   node --env-file=.env.local scripts/diag-raw-request.js

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PASSWORD = process.env.TEST_PASSWORD;

if (!PASSWORD) {
  console.error("Set $env:TEST_PASSWORD first (in your own terminal, not shared).");
  process.exit(1);
}

async function main() {
  const supabase = createClient(SUPABASE_URL, ANON_KEY);

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: "eventtrybe2025@gmail.com",
    password: PASSWORD,
  });
  if (signInError) {
    console.error("Sign-in failed:", signInError.message);
    process.exit(1);
  }
  console.log("Signed in as:", signInData.user.email, signInData.user.id);
  console.log("JWT role claim:", JSON.parse(Buffer.from(signInData.session.access_token.split(".")[1], "base64").toString()).role);

  const accessToken = signInData.session.access_token;

  // Raw fetch, exact same URL shape the dashboard uses.
  const url = `${SUPABASE_URL}/rest/v1/users_profile?select=*&role=eq.student`;
  const res = await fetch(url, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  console.log("\n--- Raw fetch response ---");
  console.log("status:", res.status);
  console.log("headers:");
  for (const [k, v] of res.headers.entries()) {
    console.log(" ", k + ":", v);
  }
  const body = await res.json();
  console.log("\nrow count:", Array.isArray(body) ? body.length : "n/a");
  console.log("distinct org_ids:", [...new Set((body || []).map((r) => r.org_id))]);

  // Also via the normal supabase-js client, for comparison.
  const { data: sdkData, error: sdkError } = await supabase.from("users_profile").select("*").eq("role", "student");
  console.log("\n--- supabase-js client (same session) ---");
  console.log("error:", sdkError);
  console.log("row count:", sdkData ? sdkData.length : null);
  console.log("distinct org_ids:", [...new Set((sdkData || []).map((r) => r.org_id))]);

  // New: via the scoped RPC function (explicit filtering, not table RLS).
  const { data: rpcData, error: rpcError } = await supabase.rpc("get_scoped_students");
  console.log("\n--- get_scoped_students() RPC (same session) ---");
  console.log("error:", rpcError);
  console.log("row count:", rpcData ? rpcData.length : null);
  console.log("distinct org_ids:", [...new Set((rpcData || []).map((r) => r.org_id))]);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
