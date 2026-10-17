// One-off: the Adults "real-quiz" lesson ended up with 85 questions after
// the admin bulk-uploaded 25 new real-quiz questions on top of the 60
// original baseline questions (imported earlier this session from
// REAL_ADULTS_QUIZ.json) — the same root cause as the YAYA real-quiz
// mix-up fixed earlier today (see scripts/swap-yaya-real-quiz.js).
//
// Moves the 60 old questions (created_at 2026-10-16T12:02, the baseline
// import batch) to a new "Practice Entire Year" pool, leaving only the
// 25 new ones (created_at 2026-10-16T22:19) in the real-quiz lesson —
// not deleting anything, just relocating.
//
// Usage:
//   node --env-file=.env.staging.local scripts/swap-adults-real-quiz.js      # staging
//   $env:SUPABASE_URL = 'https://eubroxxcchuozvpcwbdv.supabase.co'
//   node --env-file=.env.scripts.local scripts/swap-adults-real-quiz.js      # production

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

  const { data: realLesson, error: realLessonError } = await supabase
    .from("lessons")
    .select("id")
    .eq("org_id", orgId)
    .eq("category", "adults")
    .eq("difficulty", "real")
    .eq("lesson_key", "real-quiz")
    .single();
  if (realLessonError || !realLesson) throw new Error("adults real-quiz lesson not found: " + (realLessonError?.message || ""));
  console.log("Real-quiz lesson id:", realLesson.id);

  const { data: targetAy, error: targetAyError } = await supabase
    .from("academic_years")
    .select("id")
    .eq("org_id", orgId)
    .eq("category", "adults")
    .eq("year", "2025-2026")
    .single();
  if (targetAyError || !targetAy) throw new Error("adults 2025-2026 academic_year not found: " + (targetAyError?.message || ""));

  const { data: practiceLesson, error: practiceLessonError } = await supabase
    .from("lessons")
    .upsert(
      {
        academic_year_id: targetAy.id,
        org_id: orgId,
        category: "adults",
        difficulty: "practice",
        lesson_key: "practice-entire-year",
        title: "Adults Practice Entire Year",
      },
      { onConflict: "academic_year_id,difficulty,lesson_key" }
    )
    .select()
    .single();
  if (practiceLessonError) throw new Error("Failed to upsert practice-entire-year lesson: " + practiceLessonError.message);
  console.log("Practice Entire Year lesson id:", practiceLesson.id);

  // Move only the old batch (before the new upload happened today).
  const CUTOFF = "2026-10-16T13:00:00Z"; // between the 12:02 baseline batch and the 22:19 new batch
  const { data: movedRows, error: moveError } = await supabase
    .from("questions")
    .update({ lesson_id: practiceLesson.id })
    .eq("lesson_id", realLesson.id)
    .lt("created_at", CUTOFF)
    .select("id");
  if (moveError) throw new Error("Failed to move questions: " + moveError.message);
  console.log(`Moved ${movedRows.length} old questions to Practice Entire Year.`);

  const { count: remaining } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("lesson_id", realLesson.id);
  console.log(`Real-quiz lesson now has ${remaining} questions remaining.`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
