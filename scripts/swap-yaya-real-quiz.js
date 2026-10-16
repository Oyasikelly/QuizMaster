// One-off: the YAYA "real-quiz" lesson currently holds the 40-question
// 2026/2027 lesson-content set (Immanence/Atonement topics) instead of the
// actual quiz for this Sunday. Per the project owner:
//   1. Move those 40 questions to a new "Practice Entire Year" pool
//      (difficulty=practice, lesson_key=practice-entire-year) under the
//      2026-2027 academic year, so they aren't lost — just relocated.
//   2. Insert the real 26-question Sunday quiz (docs/recent question.txt,
//      already in bulk-upload JSON form) into the now-empty real-quiz
//      lesson.
//
// Targets Province 23, category yaya, on whichever project SUPABASE_URL
// points at.
//
// Usage (PowerShell):
//   node --env-file=.env.staging.local scripts/swap-yaya-real-quiz.js      # staging
//   $env:SUPABASE_URL = 'https://eubroxxcchuozvpcwbdv.supabase.co'
//   node --env-file=.env.scripts.local scripts/swap-yaya-real-quiz.js      # production

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://ciqvukvorajxhiqmwkbj.supabase.co"; // defaults to staging
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY env var.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const NEW_QUIZ = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "docs", "recent question.txt"), "utf-8"));

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

  // --- Step 1: move the 40 existing real-quiz questions to Practice Entire Year ---
  const { data: realAy, error: realAyError } = await supabase
    .from("academic_years")
    .select("id")
    .eq("org_id", orgId)
    .eq("category", "yaya")
    .eq("year", "real")
    .single();
  if (realAyError || !realAy) throw new Error("yaya 'real' academic_year not found: " + (realAyError?.message || ""));

  const { data: realLesson, error: realLessonError } = await supabase
    .from("lessons")
    .select("id")
    .eq("academic_year_id", realAy.id)
    .eq("difficulty", "real")
    .eq("lesson_key", "real-quiz")
    .single();
  if (realLessonError || !realLesson) throw new Error("real-quiz lesson not found: " + (realLessonError?.message || ""));
  console.log("Existing real-quiz lesson id:", realLesson.id);

  const { data: targetAy, error: targetAyError } = await supabase
    .from("academic_years")
    .select("id")
    .eq("org_id", orgId)
    .eq("category", "yaya")
    .eq("year", "2026-2027")
    .single();
  if (targetAyError || !targetAy) throw new Error("yaya 2026-2027 academic_year not found: " + (targetAyError?.message || ""));

  const { data: practiceLesson, error: practiceLessonError } = await supabase
    .from("lessons")
    .upsert(
      {
        academic_year_id: targetAy.id,
        org_id: orgId,
        category: "yaya",
        difficulty: "practice",
        lesson_key: "practice-entire-year",
        title: "YAYA Practice Entire Year",
      },
      { onConflict: "academic_year_id,difficulty,lesson_key" }
    )
    .select()
    .single();
  if (practiceLessonError) throw new Error("Failed to upsert practice-entire-year lesson: " + practiceLessonError.message);
  console.log("Practice Entire Year lesson id:", practiceLesson.id);

  const { data: movedRows, error: moveError } = await supabase
    .from("questions")
    .update({ lesson_id: practiceLesson.id })
    .eq("lesson_id", realLesson.id)
    .select("id");
  if (moveError) throw new Error("Failed to move questions: " + moveError.message);
  console.log(`Moved ${movedRows.length} questions to Practice Entire Year.`);

  // --- Step 2: insert the real Sunday quiz into the now-empty real-quiz lesson ---
  const rows = NEW_QUIZ.map((q) => ({
    lesson_id: realLesson.id,
    org_id: orgId,
    category: "yaya",
    question: q.question,
    options: q.options ?? null,
    type: q.type,
    answer: q.answer,
  }));
  const { data: inserted, error: insertError } = await supabase.from("questions").insert(rows).select("id");
  if (insertError) throw new Error("Failed to insert new real-quiz questions: " + insertError.message);
  console.log(`Inserted ${inserted.length} new real-quiz questions.`);

  console.log("Done.");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
