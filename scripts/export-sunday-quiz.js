// One-off: pulls the already-confirmed 2026 YAYA Real Quiz (26 questions,
// bulk-uploaded and verified against staging via the admin Content UI)
// back out as JSON, so it can be re-seeded into production without
// re-deriving the answer key by hand a second time.
//
// Usage: node --env-file=.env.staging.local scripts/export-sunday-quiz.js

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://ciqvukvorajxhiqmwkbj.supabase.co"; // staging
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY env var.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, title, org_id, academic_years(year)")
    .eq("category", "yaya")
    .eq("lesson_key", "real-quiz")
    .single();

  if (lessonError || !lesson) {
    throw new Error("Could not find YAYA real-quiz lesson on staging: " + (lessonError?.message || "not found"));
  }
  console.log("Found lesson:", lesson.title, "id:", lesson.id);

  const { data: questions, error: qError } = await supabase
    .from("questions")
    .select("question, type, options, answer")
    .eq("lesson_id", lesson.id)
    .order("created_at");

  if (qError) throw new Error("Failed to read questions: " + qError.message);

  console.log(`Exporting ${questions.length} questions.`);
  const outPath = path.join(__dirname, "..", "backups", "sunday-yaya-quiz.json");
  fs.writeFileSync(outPath, JSON.stringify(questions, null, 2));
  console.log("Written to", outPath);
}

main().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
