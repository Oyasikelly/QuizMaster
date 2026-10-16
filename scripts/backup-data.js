// One-off safety-net backup: dumps the live rows of the tables that change
// day-to-day (signups, quiz attempts, settings) to JSON before the first
// migration push to production. Not a schema backup — pair with the most
// recent backups/prod_schema_*.sql, which is still valid since production
// has had zero CLI migrations applied until this push.
//
// Usage: node --env-file=.env.scripts.local scripts/backup-data.js

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const SUPABASE_URL = "https://eubroxxcchuozvpcwbdv.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY env var.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const TABLES = ["users_profile", "quiz_results", "quiz_settings"];

async function main() {
  const date = new Date().toISOString().slice(0, 10);
  const outDir = path.join(__dirname, "..", "backups");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) {
      console.error(`Failed to dump ${table}:`, error.message);
      process.exit(1);
    }
    const outPath = path.join(outDir, `prod_data_${table}_${date}.json`);
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
    console.log(`${table}: ${data.length} rows -> ${outPath}`);
  }

  console.log("Backup complete.");
}

main();
