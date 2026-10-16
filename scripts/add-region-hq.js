// One-off: adds "Region 70 Headquarters" as a level='province' org (sibling
// of Province 20/21/23/25/26 under Region 70), per the project owner and
// their coordinator. Conceptually it sits above the provinces, but using
// level='province' is what makes it show up in the same first-dropdown
// slot in ParishPicker with zero code changes, and gives it its own
// content pool for free (content is owned at the province level
// throughout this app — see 20240101000018's design note).
//
// Usage:
//   node --env-file=.env.staging.local scripts/add-region-hq.js       # staging
//   $env:SUPABASE_URL = 'https://eubroxxcchuozvpcwbdv.supabase.co'
//   node --env-file=.env.scripts.local scripts/add-region-hq.js       # production

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

  const { data: hq, error: hqError } = await supabase
    .from("organizations")
    .upsert(
      {
        parent_id: region.id,
        level: "province",
        code: "HQ",
        name: "Region 70 Headquarters",
      },
      { onConflict: "parent_id,code" }
    )
    .select()
    .single();
  if (hqError) throw new Error("Failed to add Region 70 Headquarters: " + hqError.message);
  console.log("Region 70 Headquarters:", hq);

  console.log("Done.");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
