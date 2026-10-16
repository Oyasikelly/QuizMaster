// DB-first content reads (Phase 5, roadmap task t25).
//
// Every function here returns `null` — never an error, never an empty
// array — when nothing is found, so every call site can fall back to the
// existing JSON-file server actions (src/app/actions/getQuestions.js,
// getLessons.js) exactly as before. That fallback is what keeps every
// student without an assigned org (still nearly everyone) working
// unchanged.
//
// No org_id is threaded through any of this on purpose: RLS already
// scopes every read to the signed-in user's own province ancestry (see
// 20240101000018's academic_years/lessons/questions policies) or an
// admin's managed orgs — the database does the scoping, not this code.

import { supabase } from "./supabase";

export async function getDbRealQuizQuestions(category) {
	const categoryLower = category.toLowerCase();

	const { data: ay } = await supabase
		.from("academic_years")
		.select("id")
		.eq("category", categoryLower)
		.eq("year", "real")
		.maybeSingle();
	if (!ay) return null;

	const { data: lesson } = await supabase
		.from("lessons")
		.select("id")
		.eq("academic_year_id", ay.id)
		.eq("difficulty", "real")
		.eq("lesson_key", "real-quiz")
		.maybeSingle();
	if (!lesson) return null;

	const { data: questions } = await supabase
		.from("questions")
		.select("question, options, type, answer")
		.eq("lesson_id", lesson.id);
	if (!questions || questions.length === 0) return null;

	return questions;
}

export async function getDbPracticeQuestions(category, year, difficulty, lessonKey) {
	const categoryLower = category.toLowerCase();

	const { data: ay } = await supabase
		.from("academic_years")
		.select("id")
		.eq("category", categoryLower)
		.eq("year", year)
		.maybeSingle();
	if (!ay) return null;

	const { data: lesson } = await supabase
		.from("lessons")
		.select("id")
		.eq("academic_year_id", ay.id)
		.eq("difficulty", difficulty)
		.eq("lesson_key", lessonKey)
		.maybeSingle();
	if (!lesson) return null;

	const { data: questions } = await supabase
		.from("questions")
		.select("question, options, type, answer")
		.eq("lesson_id", lesson.id);
	if (!questions || questions.length === 0) return null;

	return questions;
}

export async function getDbAcademicYears(category) {
	const categoryLower = category.toLowerCase();

	const { data } = await supabase
		.from("academic_years")
		.select("year")
		.eq("category", categoryLower)
		.neq("year", "real"); // "real" is an internal bucket, not a pickable academic year
	if (!data || data.length === 0) return null;

	return [...new Set(data.map((row) => row.year))];
}

export async function getDbLessons(category, year, difficulty) {
	const categoryLower = category.toLowerCase();

	const { data: ay } = await supabase
		.from("academic_years")
		.select("id")
		.eq("category", categoryLower)
		.eq("year", year)
		.maybeSingle();
	if (!ay) return null;

	const { data: lessons } = await supabase
		.from("lessons")
		.select("lesson_key, title")
		.eq("academic_year_id", ay.id)
		.eq("difficulty", difficulty);
	if (!lessons || lessons.length === 0) return null;

	return lessons.map((l) => ({ id: l.lesson_key, title: l.title }));
}

export async function getDbQuestionCount(category, year, difficulty, lessonKey) {
	const categoryLower = category.toLowerCase();

	const { data: ay } = await supabase
		.from("academic_years")
		.select("id")
		.eq("category", categoryLower)
		.eq("year", year)
		.maybeSingle();
	if (!ay) return null;

	const { data: lesson } = await supabase
		.from("lessons")
		.select("id")
		.eq("academic_year_id", ay.id)
		.eq("difficulty", difficulty)
		.eq("lesson_key", lessonKey)
		.maybeSingle();
	if (!lesson) return null;

	const { count } = await supabase
		.from("questions")
		.select("*", { count: "exact", head: true })
		.eq("lesson_id", lesson.id);
	return count ?? null;
}
