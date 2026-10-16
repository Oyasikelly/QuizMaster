// One-off migration script — NOT part of the running app, never imported
// by it. Imports the existing JSON question banks (src/app/questions/)
// into the Phase 5 DB tables (academic_years/lessons/questions) under
// Province 23 — confirmed directly by the project owner as this
// content's real owner.
//
// Walks src/app/actions/lessonMap.json as the authoritative manifest
// (the same file src/app/actions/getLessons.js trusts), so what gets
// imported is exactly what the live app currently serves — not every
// file under src/app/questions/, since several are orphaned (not
// referenced by lessonMap.json at all: the "2024-2025" practice files,
// teenagersQuestions.json, randomQuestions.json) or superseded
// duplicates (REAL_ADULTS_QUIZ1.json / REAL_YAYA_QUIZ1.json — the "1"
// suffix files getQuestions.js never reads). None of those are touched.
//
// Targets staging by default. Pass SUPABASE_URL to target a different
// project (e.g. production) — the service role key must match whichever
// project SUPABASE_URL points at.
//
// Requires the service role key, which bypasses RLS — a bulk import
// legitimately needs that, same as any admin tooling would. Never
// hardcode it here, never commit it.
//
// Usage (PowerShell):
//   $env:SUPABASE_SERVICE_ROLE_KEY = 'your-service-role-key'
//   node scripts/import-content.js                 # staging (default)
//   $env:SUPABASE_URL = 'https://eubroxxcchuozvpcwbdv.supabase.co'
//   node scripts/import-content.js                 # production

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://ciqvukvorajxhiqmwkbj.supabase.co"; // defaults to staging
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
	console.error("Set SUPABASE_SERVICE_ROLE_KEY in your environment first — see the comment at the top of this file.");
	process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
	auth: { persistSession: false },
});

const QUESTIONS_ROOT = path.join(__dirname, "..", "src", "app", "questions");
const lessonMap = JSON.parse(
	fs.readFileSync(path.join(__dirname, "..", "src", "app", "actions", "lessonMap.json"), "utf-8")
);

function readJson(filePath) {
	if (!fs.existsSync(filePath)) return null;
	try {
		return JSON.parse(fs.readFileSync(filePath, "utf-8"));
	} catch (err) {
		console.warn(`  Could not parse ${filePath}: ${err.message}`);
		return null;
	}
}

async function upsertAcademicYear(orgId, category, year) {
	const { data, error } = await supabase
		.from("academic_years")
		.upsert({ org_id: orgId, category, year }, { onConflict: "org_id,category,year" })
		.select()
		.single();
	if (error) throw new Error(`academic_years upsert (${category}/${year}): ${error.message}`);
	return data;
}

async function upsertLesson(academicYearId, orgId, category, difficulty, lessonKey, title) {
	const { data, error } = await supabase
		.from("lessons")
		.upsert(
			{ academic_year_id: academicYearId, org_id: orgId, category, difficulty, lesson_key: lessonKey, title },
			{ onConflict: "academic_year_id,difficulty,lesson_key" }
		)
		.select()
		.single();
	if (error) throw new Error(`lessons upsert (${category}/${difficulty}/${lessonKey}): ${error.message}`);
	return data;
}

async function insertQuestions(lessonId, orgId, category, questionsArray) {
	const rows = questionsArray.map((q) => ({
		lesson_id: lessonId,
		org_id: orgId,
		category,
		question: q.question,
		options: q.options ?? null,
		type: q.type,
		answer: q.answer,
	}));
	if (rows.length === 0) return 0;
	const { error } = await supabase.from("questions").insert(rows);
	if (error) throw new Error(`questions insert (lesson ${lessonId}): ${error.message}`);
	return rows.length;
}

async function main() {
	const { data: province, error: provinceError } = await supabase
		.from("organizations")
		.select("id")
		.eq("level", "province")
		.eq("code", "23")
		.single();

	if (provinceError || !province) {
		throw new Error("Could not find Province 23 in organizations: " + (provinceError?.message || "not found"));
	}
	const orgId = province.id;
	console.log("Importing under Province 23, org_id:", orgId);

	let totalLessons = 0;
	let totalQuestions = 0;
	const warnings = [];

	const categories = Object.keys(lessonMap.academicYears);

	for (const category of categories) {
		// ---- Real quiz: one per category, not tied to a specific academic year ----
		const realFileName = `REAL_${category.toUpperCase()}_QUIZ.json`;
		const realData = readJson(path.join(QUESTIONS_ROOT, "real", category, realFileName));
		if (Array.isArray(realData) && realData.length > 0) {
			const ay = await upsertAcademicYear(orgId, category, "real");
			const lesson = await upsertLesson(ay.id, orgId, category, "real", "real-quiz", `${category} Real Quiz`);
			const count = await insertQuestions(lesson.id, orgId, category, realData);
			totalLessons += 1;
			totalQuestions += count;
			console.log(`  [real] ${category}: ${count} questions`);
		}

		// ---- Practice lessons, driven entirely by lessonMap.json ----
		const years = lessonMap.academicYears[category];
		for (const year of years) {
			for (const difficulty of ["normal", "medium", "hard", "practice"]) {
				const key = `${category}_${year}_${difficulty}`;
				const lessonList = lessonMap.lessons[key];
				if (!lessonList || lessonList.length === 0) continue;

				const ay = await upsertAcademicYear(orgId, category, year);

				for (const entry of lessonList) {
					const filePath = path.join(QUESTIONS_ROOT, "practice", category, year, difficulty, `${entry.id}.json`);
					const lessonData = readJson(filePath);
					if (!lessonData) {
						warnings.push(`Missing file, skipped: ${filePath}`);
						continue;
					}
					const questionsArray = Array.isArray(lessonData) ? lessonData : lessonData[difficulty] || [];
					if (questionsArray.length === 0) {
						warnings.push(`Empty/unrecognized shape, skipped: ${filePath}`);
						continue;
					}

					const lesson = await upsertLesson(ay.id, orgId, category, difficulty, entry.id, entry.title);
					const count = await insertQuestions(lesson.id, orgId, category, questionsArray);
					totalLessons += 1;
					totalQuestions += count;
				}
				console.log(`  [${difficulty}] ${category} ${year}: ${lessonList.length} lessons in manifest`);
			}
		}
	}

	console.log(`\nDone. Imported ${totalLessons} lessons, ${totalQuestions} questions total.`);
	if (warnings.length > 0) {
		console.log(`\n${warnings.length} warning(s):`);
		warnings.forEach((w) => console.log("  - " + w));
	}
}

main().catch((err) => {
	console.error("Import failed:", err);
	process.exit(1);
});
