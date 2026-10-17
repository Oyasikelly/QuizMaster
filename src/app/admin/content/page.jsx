"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { isAdminRole } from "../../../lib/roles";
import AdminShell from "../../../components/AdminShell";
import {
	FaPlus,
	FaTrash,
	FaChevronRight,
	FaExclamationTriangle,
	FaBook,
} from "react-icons/fa";

const CATEGORIES = [
	{ value: "adults", label: "Adults" },
	{ value: "yaya", label: "Yaya" },
	{ value: "teenagers", label: "Teenagers" },
];

const DIFFICULTIES = [
	{ value: "normal", label: "Normal" },
	{ value: "medium", label: "Medium" },
	{ value: "hard", label: "Hard" },
];

// Shown as a permanent reference next to the bulk-import box (not just a
// placeholder, which disappears the moment the field is clicked into) —
// one real example of each question type, matching the validation rules
// in handleBulkAdd exactly.
const BULK_EXAMPLE = JSON.stringify(
	[
		{
			question: "The fruit of the Spirit is...",
			type: "multiple-choice",
			options: ["Love", "Hate", "Fear"],
			answer: "Love",
		},
		{
			question: "Complete: Love your ___ as yourself.",
			type: "fill-in-the-blank",
			answer: "neighbor, neighbour",
		},
	],
	null,
	2
);

const ContentManagement = () => {
	const router = useRouter();

	const [loading, setLoading] = useState(true);
	const [accessDenied, setAccessDenied] = useState(false);
	const [error, setError] = useState("");
	const [currentUser, setCurrentUser] = useState(null);

	// Which org this admin is managing content for. A legacy `admin`
	// isn't tied to one org (is_admin() bypasses scoping entirely), so
	// they pick a province. A scoped admin (province_admin etc.) is
	// locked to their own org_id — content is owned at province level,
	// and RLS only lets them write where their scope actually reaches.
	// True for any admin not directly tied to a single province: a legacy
	// `admin` (is_admin() bypasses scoping entirely) or a `super_admin`
	// (scoped to the Region root, not a province — their own org_id is
	// NOT a province, which previously hit the "not assigned to a
	// province" error below instead of giving them a picker).
	const [showProvincePicker, setShowProvincePicker] = useState(false);
	const [provinces, setProvinces] = useState([]);
	const [orgId, setOrgId] = useState(null);
	const [orgName, setOrgName] = useState("");

	const [category, setCategory] = useState("adults");

	// "lessons" = the normal Academic Year -> Lesson hierarchy (Normal/
	// Medium/Hard — genuinely multiple distinct lessons per year).
	// "practiceYear" = the "Practice Entire Year" pool: still tied to
	// whichever year is selected (unlike "real" below), but
	// src/components/SelectTime.jsx's handlePracticeEntireYear only ever
	// uses `availableLessons[0]` for that year+difficulty — i.e. this is
	// really a SINGLE pool per org+category+year, not a list. Exposing
	// it as "just another lesson difficulty" let an admin create more
	// than one, where every one past the first would be silently unused.
	// "real" = the Real Quiz bucket: a fixed, single pool per
	// org+category — academic_years.year = "real", lessons.lesson_key =
	// "real-quiz" — independent of any normal year at all.
	const [mode, setMode] = useState("lessons");

	const [academicYears, setAcademicYears] = useState([]);
	const [selectedYearId, setSelectedYearId] = useState(null);
	const [newYear, setNewYear] = useState("");

	const [difficulty, setDifficulty] = useState("normal");
	const [lessons, setLessons] = useState([]);
	const [selectedLessonId, setSelectedLessonId] = useState(null);
	const [newLessonKey, setNewLessonKey] = useState("");
	const [newLessonTitle, setNewLessonTitle] = useState("");

	const [questions, setQuestions] = useState([]);
	const [newQuestion, setNewQuestion] = useState({
		question: "",
		type: "multiple-choice",
		options: ["", "", "", ""],
		answer: "",
	});
	const [bulkText, setBulkText] = useState("");
	const [bulkError, setBulkError] = useState("");
	const [bulkSuccess, setBulkSuccess] = useState("");
	const [bulkBusy, setBulkBusy] = useState(false);
	const [addedFlash, setAddedFlash] = useState("");
	// Real Quiz only (see handleBulkAdd): a quarter's new real-quiz
	// content has twice now landed on top of the previous quarter's
	// questions instead of replacing them, because bulk import always
	// just adds. Defaults to off every time the lesson changes so a
	// Practice Lessons/Practice Entire Year import is never accidentally
	// destructive.
	const [replaceExisting, setReplaceExisting] = useState(false);

	// ---- Access check + resolve which org this admin manages ----
	useEffect(() => {
		const init = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) {
				router.push("/authenticate");
				return;
			}

			const { data: profile } = await supabase
				.from("users_profile")
				.select("role, org_id")
				.eq("id", user.id)
				.single();

			if (!isAdminRole(profile?.role)) {
				router.push("/authenticate");
				return;
			}
			setCurrentUser({ ...user, ...profile });

			if (profile.role === "admin" || profile.role === "super_admin") {
				// Not tied to one province — give them a picker instead of
				// assuming their own org_id (for super_admin, the Region
				// root) is a province to write content under directly.
				setShowProvincePicker(true);
				const { data: provinceList } = await supabase
					.from("organizations")
					.select("id, name")
					.eq("level", "province")
					.order("name");
				setProvinces(provinceList || []);
				if (provinceList && provinceList.length > 0) {
					setOrgId(provinceList[0].id);
					setOrgName(provinceList[0].name);
				} else {
					setAccessDenied(true);
					setError("No provinces exist yet — add one via the organizations table before managing content.");
				}
			} else if (profile.org_id) {
				setOrgId(profile.org_id);
				const { data: org } = await supabase
					.from("organizations")
					.select("name, level")
					.eq("id", profile.org_id)
					.maybeSingle();
				if (org?.level !== "province") {
					// Content is owned at the province level — a zone/area/
					// parish admin's own org_id isn't the right write target.
					setAccessDenied(true);
					setError("Content is managed at the province level. Your account isn't assigned directly to a province.");
				} else {
					setOrgName(org?.name || "");
				}
			} else {
				setAccessDenied(true);
				setError("Your account has no parish/province assigned yet — set one in your profile first.");
			}

			setLoading(false);
		};
		init();
	}, [router]);

	// ---- Academic years for the chosen org + category ----
	const loadAcademicYears = useCallback(async () => {
		if (!orgId) return;
		const { data } = await supabase
			.from("academic_years")
			.select("id, year")
			.eq("org_id", orgId)
			.eq("category", category)
			.neq("year", "real")
			.order("year", { ascending: false });
		setAcademicYears(data || []);
		setSelectedYearId(null);
		setLessons([]);
		setSelectedLessonId(null);
		setQuestions([]);
	}, [orgId, category]);

	useEffect(() => {
		loadAcademicYears();
	}, [loadAcademicYears]);

	const handleAddYear = async () => {
		const year = newYear.trim();
		if (!year) return;
		const { error: insertError } = await supabase
			.from("academic_years")
			.insert({ org_id: orgId, category, year });
		if (insertError) {
			setError(`Couldn't add year: ${insertError.message}`);
			return;
		}
		setNewYear("");
		loadAcademicYears();
	};

	// ---- Real Quiz: resolves (creating on first use if needed) the one
	// fixed question pool for this org + category, bypassing the normal
	// year/lesson pickers entirely. ----
	const resolveRealQuizLesson = useCallback(async () => {
		if (!orgId) return;

		let { data: ay } = await supabase
			.from("academic_years")
			.select("id")
			.eq("org_id", orgId)
			.eq("category", category)
			.eq("year", "real")
			.maybeSingle();

		if (!ay) {
			const { data: newAy, error: ayError } = await supabase
				.from("academic_years")
				.insert({ org_id: orgId, category, year: "real" })
				.select("id")
				.single();
			if (ayError) {
				setError(`Couldn't set up Real Quiz bucket: ${ayError.message}`);
				return;
			}
			ay = newAy;
		}

		let { data: lesson } = await supabase
			.from("lessons")
			.select("id")
			.eq("academic_year_id", ay.id)
			.eq("difficulty", "real")
			.eq("lesson_key", "real-quiz")
			.maybeSingle();

		if (!lesson) {
			const { data: newLesson, error: lessonError } = await supabase
				.from("lessons")
				.insert({
					academic_year_id: ay.id,
					org_id: orgId,
					category,
					difficulty: "real",
					lesson_key: "real-quiz",
					title: `${category} Real Quiz`,
				})
				.select("id")
				.single();
			if (lessonError) {
				setError(`Couldn't set up Real Quiz bucket: ${lessonError.message}`);
				return;
			}
			lesson = newLesson;
		}

		setSelectedLessonId(lesson.id);
	}, [orgId, category]);

	useEffect(() => {
		if (mode === "real") {
			setSelectedLessonId(null);
			setQuestions([]);
			resolveRealQuizLesson();
		}
	}, [mode, resolveRealQuizLesson]);

	// ---- Practice Entire Year: one fixed pool per org+category+year —
	// same reasoning as Real Quiz above, except this one still depends
	// on which academic year is selected. ----
	const resolvePracticeYearLesson = useCallback(async () => {
		if (!selectedYearId) return;
		let { data: lesson } = await supabase
			.from("lessons")
			.select("id")
			.eq("academic_year_id", selectedYearId)
			.eq("difficulty", "practice")
			.eq("lesson_key", "practice-entire-year")
			.maybeSingle();

		if (!lesson) {
			const { data: newLesson, error: lessonError } = await supabase
				.from("lessons")
				.insert({
					academic_year_id: selectedYearId,
					org_id: orgId,
					category,
					difficulty: "practice",
					lesson_key: "practice-entire-year",
					title: "Practice Entire Year",
				})
				.select("id")
				.single();
			if (lessonError) {
				setError(`Couldn't set up Practice Entire Year pool: ${lessonError.message}`);
				return;
			}
			lesson = newLesson;
		}

		setSelectedLessonId(lesson.id);
	}, [selectedYearId, orgId, category]);

	useEffect(() => {
		if (mode === "practiceYear") {
			setSelectedLessonId(null);
			setQuestions([]);
			if (selectedYearId) resolvePracticeYearLesson();
		}
	}, [mode, selectedYearId, resolvePracticeYearLesson]);

	// ---- Lessons for the chosen year + difficulty ----
	const loadLessons = useCallback(async () => {
		if (!selectedYearId) return;
		const { data } = await supabase
			.from("lessons")
			.select("id, lesson_key, title")
			.eq("academic_year_id", selectedYearId)
			.eq("difficulty", difficulty)
			.order("title");
		setLessons(data || []);
		setSelectedLessonId(null);
		setQuestions([]);
	}, [selectedYearId, difficulty]);

	useEffect(() => {
		loadLessons();
	}, [loadLessons]);

	const handleAddLesson = async () => {
		const key = newLessonKey.trim();
		const title = newLessonTitle.trim();
		if (!key || !title) return;
		const { error: insertError } = await supabase.from("lessons").insert({
			academic_year_id: selectedYearId,
			org_id: orgId,
			category,
			difficulty,
			lesson_key: key,
			title,
		});
		if (insertError) {
			setError(`Couldn't add lesson: ${insertError.message}`);
			return;
		}
		setNewLessonKey("");
		setNewLessonTitle("");
		loadLessons();
	};

	const handleDeleteLesson = async (lessonId) => {
		if (!window.confirm("Delete this lesson and all its questions? This can't be undone.")) return;
		const { error: deleteError } = await supabase.from("lessons").delete().eq("id", lessonId);
		if (deleteError) {
			setError(`Couldn't delete lesson: ${deleteError.message}`);
			return;
		}
		loadLessons();
	};

	const handleDeleteYear = async (yearId) => {
		if (!window.confirm("Delete this entire academic year, all its lessons, and all their questions? This can't be undone.")) return;
		const { error: deleteError } = await supabase.from("academic_years").delete().eq("id", yearId);
		if (deleteError) {
			setError(`Couldn't delete year: ${deleteError.message}`);
			return;
		}
		loadAcademicYears();
	};

	// ---- Questions for the chosen lesson ----
	const loadQuestions = useCallback(async () => {
		if (!selectedLessonId) return;
		const { data } = await supabase
			.from("questions")
			.select("id, question, options, type, answer")
			.eq("lesson_id", selectedLessonId)
			.order("id");
		setQuestions(data || []);
	}, [selectedLessonId]);

	useEffect(() => {
		loadQuestions();
		setReplaceExisting(false);
	}, [loadQuestions]);

	const handleAddQuestion = async () => {
		if (!newQuestion.question.trim() || !newQuestion.answer.trim()) {
			setError("Question text and answer are required.");
			return;
		}
		const trimmedAnswer = newQuestion.answer.trim();
		const trimmedOptions =
			newQuestion.type === "multiple-choice"
				? newQuestion.options.map((o) => o.trim()).filter(Boolean)
				: null;
		if (newQuestion.type === "multiple-choice") {
			if (trimmedOptions.length < 2) {
				setError("Multiple choice needs at least 2 options filled in.");
				return;
			}
			if (!trimmedOptions.includes(trimmedAnswer)) {
				setError('The correct answer must exactly match the text of one of the options — otherwise a student can never select it as correct.');
				return;
			}
		}
		const row = {
			lesson_id: selectedLessonId,
			org_id: orgId,
			category,
			question: newQuestion.question.trim(),
			type: newQuestion.type,
			answer: trimmedAnswer,
			options: trimmedOptions,
		};
		const { error: insertError } = await supabase.from("questions").insert(row);
		if (insertError) {
			setError(`Couldn't add question: ${insertError.message}`);
			return;
		}
		setNewQuestion({ question: "", type: "multiple-choice", options: ["", "", "", ""], answer: "" });
		setAddedFlash("Question added.");
		setTimeout(() => setAddedFlash(""), 3000);
		loadQuestions();
	};

	const handleDeleteQuestion = async (id) => {
		if (!window.confirm("Delete this question?")) return;
		const { error: deleteError } = await supabase.from("questions").delete().eq("id", id);
		if (deleteError) {
			setError(`Couldn't delete question: ${deleteError.message}`);
			return;
		}
		loadQuestions();
	};

	const handleBulkAdd = async () => {
		setBulkError("");
		let parsed;
		try {
			parsed = JSON.parse(bulkText);
		} catch {
			setBulkError("Not valid JSON — paste an array like [{\"question\":\"...\",\"type\":\"multiple-choice\",\"options\":[\"a\",\"b\"],\"answer\":\"a\"}].");
			return;
		}
		if (!Array.isArray(parsed) || parsed.length === 0) {
			setBulkError("Expected a JSON array of question objects.");
			return;
		}

		// Checked client-side, not left to the database: one bad "type"
		// value would otherwise fail the table's CHECK constraint and
		// reject the WHOLE batch, including every valid entry in it —
		// better to point at the exact broken entry before sending anything.
		for (let i = 0; i < parsed.length; i++) {
			const q = parsed[i];
			if (!q.question || !q.answer) {
				setBulkError(`Entry ${i + 1} is missing "question" or "answer".`);
				return;
			}
			if (q.type !== "multiple-choice" && q.type !== "fill-in-the-blank") {
				setBulkError(`Entry ${i + 1}: "type" must be exactly "multiple-choice" or "fill-in-the-blank" (got ${JSON.stringify(q.type)}).`);
				return;
			}
			if (q.type === "multiple-choice") {
				if (!Array.isArray(q.options) || q.options.length < 2) {
					setBulkError(`Entry ${i + 1}: multiple-choice needs an "options" array with at least 2 choices.`);
					return;
				}
				if (!q.options.includes(q.answer)) {
					setBulkError(`Entry ${i + 1}: "answer" (${JSON.stringify(q.answer)}) must exactly match one of the "options" — students pick from those options, a mismatched answer can never be selected as correct.`);
					return;
				}
			}
		}

		// Real Quiz only: replacing means the previous batch is gone for
		// good, so this is the one bulk-import path that gets its own
		// explicit confirmation on top of the checkbox already being an
		// opt-in — see the replaceExisting state declaration for why this
		// exists at all.
		if (mode === "real" && replaceExisting && questions.length > 0) {
			const confirmed = window.confirm(
				`This will permanently delete the existing ${questions.length} Real Quiz question(s) before adding the new ${parsed.length}. This can't be undone. Continue?`
			);
			if (!confirmed) return;
		}

		setBulkBusy(true);

		if (mode === "real" && replaceExisting && questions.length > 0) {
			const { error: deleteError } = await supabase.from("questions").delete().eq("lesson_id", selectedLessonId);
			if (deleteError) {
				setBulkBusy(false);
				setBulkError(`Couldn't clear the existing questions first: ${deleteError.message}`);
				return;
			}
		}

		const rows = parsed.map((q) => ({
			lesson_id: selectedLessonId,
			org_id: orgId,
			category,
			question: q.question,
			type: q.type,
			answer: q.answer,
			options: q.type === "multiple-choice" ? q.options || [] : null,
		}));
		const { error: insertError } = await supabase.from("questions").insert(rows);
		setBulkBusy(false);
		if (insertError) {
			setBulkError(`Import failed: ${insertError.message}`);
			return;
		}
		setBulkText("");
		setReplaceExisting(false);
		setBulkSuccess(
			mode === "real" && replaceExisting
				? `Replaced the old pool — now ${rows.length} question${rows.length === 1 ? "" : "s"}.`
				: `Imported ${rows.length} question${rows.length === 1 ? "" : "s"} successfully.`
		);
		setTimeout(() => setBulkSuccess(""), 4000);
		loadQuestions();
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">Loading content management...</p>
				</div>
			</div>
		);
	}

	if (accessDenied) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
					<FaExclamationTriangle className="text-amber-500 text-5xl mx-auto mb-4" />
					<h2 className="font-display text-2xl font-bold text-gray-800 mb-2">Can't manage content yet</h2>
					<p className="text-gray-600 mb-6">{error}</p>
					<button
						onClick={() => router.push("/admin/dashboard")}
						className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium">
						Back to Dashboard
					</button>
				</div>
			</div>
		);
	}

	return (
		<AdminShell user={currentUser} orgName={orgName} active="content">
			<div className="max-w-5xl mx-auto p-4 sm:p-8">
				<div className="flex items-center gap-3 mb-6">
					<div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center">
						<FaBook className="text-white" size={16} />
					</div>
					<div>
						<h1 className="font-display text-xl font-semibold text-gray-900">Content Management</h1>
						<p className="text-sm text-gray-500">
							Managing: <span className="font-medium">{orgName || "—"}</span>
						</p>
					</div>
				</div>

				{showProvincePicker && provinces.length > 0 && (
					<div className="bg-white rounded-xl shadow p-4 mb-4">
						<label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
						<select
							value={orgId || ""}
							onChange={(e) => {
								const p = provinces.find((pr) => pr.id === e.target.value);
								setOrgId(p?.id || null);
								setOrgName(p?.name || "");
							}}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500">
							{provinces.map((p) => (
								<option key={p.id} value={p.id}>
									{p.name}
								</option>
							))}
						</select>
					</div>
				)}

				{error && (
					<div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4">
						<span className="text-sm">{error}</span>
						<button onClick={() => setError("")} className="text-red-400 hover:text-red-600">✕</button>
					</div>
				)}

				{/* Category tabs */}
				<div className="flex gap-2 mb-4">
					{CATEGORIES.map((c) => (
						<button
							key={c.value}
							onClick={() => setCategory(c.value)}
							className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
								category === c.value
									? "bg-brand-600 text-white"
									: "bg-white text-gray-600 hover:bg-gray-50"
							}`}>
							{c.label}
						</button>
					))}
				</div>

				{/* Mode: "lessons" (Normal/Medium/Hard — genuinely multiple
				    lessons per year) vs. "practiceYear" and "real" (each a
				    single auto-resolved pool, not a list — see the resolver
				    functions above for why they can't share the lessons flow). */}
				<div className="flex gap-2 mb-4 flex-wrap">
					<button
						onClick={() => setMode("lessons")}
						className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
							mode === "lessons" ? "bg-brand-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
						}`}>
						Practice Lessons
					</button>
					<button
						onClick={() => setMode("practiceYear")}
						className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
							mode === "practiceYear" ? "bg-brand-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
						}`}>
						Practice Entire Year
					</button>
					<button
						onClick={() => setMode("real")}
						className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
							mode === "real" ? "bg-brand-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
						}`}>
						Real Quiz
					</button>
				</div>

				{mode === "practiceYear" && (
					<div className="bg-brand-50 border border-brand-200 text-brand-800 rounded-lg p-3 mb-4 text-sm">
						One shared question pool per academic year for the "Practice Entire Year" button — pick a year on the left, then add questions on the right. No separate lessons here.
					</div>
				)}
				{mode === "real" && (
					<div className="bg-brand-50 border border-brand-200 text-brand-800 rounded-lg p-3 mb-4 text-sm">
						One shared question pool for the official timed quiz in this category — no years or lessons here, just the question list on the right.
					</div>
				)}

				<div className={`grid grid-cols-1 gap-4 ${mode === "lessons" ? "md:grid-cols-3" : mode === "practiceYear" ? "md:grid-cols-2" : "md:grid-cols-1 max-w-2xl"}`}>
					{(mode === "lessons" || mode === "practiceYear") && (
					<>
					{/* Academic Years */}
					<div className="bg-white rounded-xl shadow p-4">
						<h3 className="font-semibold text-gray-800 mb-3">Academic Years</h3>
						<div className="space-y-1 mb-3">
							{academicYears.length === 0 && (
								<p className="text-sm text-gray-400">None yet.</p>
							)}
							{academicYears.map((y) => (
								<div
									key={y.id}
									className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm ${
										selectedYearId === y.id ? "bg-brand-100 text-brand-800" : "hover:bg-gray-50"
									}`}
									onClick={() => setSelectedYearId(y.id)}>
									<span className="flex items-center gap-1">
										<FaChevronRight size={10} />
										{y.year}
									</span>
									<button
										onClick={(e) => {
											e.stopPropagation();
											handleDeleteYear(y.id);
										}}
										className="text-red-400 hover:text-red-600">
										<FaTrash size={12} />
									</button>
								</div>
							))}
						</div>
						<div className="flex gap-1">
							<input
								type="text"
								value={newYear}
								onChange={(e) => setNewYear(e.target.value)}
								placeholder="e.g. 2027-2028"
								className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
							/>
							<button
								onClick={handleAddYear}
								className="px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700">
								<FaPlus size={12} />
							</button>
						</div>
					</div>

					</>
					)}

					{mode === "lessons" && (
					<>
					{/* Lessons */}
					<div className="bg-white rounded-xl shadow p-4">
						<h3 className="font-semibold text-gray-800 mb-3">Lessons</h3>
						{!selectedYearId ? (
							<p className="text-sm text-gray-400">Select a year first.</p>
						) : (
							<>
								<select
									value={difficulty}
									onChange={(e) => setDifficulty(e.target.value)}
									className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm mb-3">
									{DIFFICULTIES.map((d) => (
										<option key={d.value} value={d.value}>
											{d.label}
										</option>
									))}
								</select>
								<div className="space-y-1 mb-3">
									{lessons.length === 0 && <p className="text-sm text-gray-400">None yet.</p>}
									{lessons.map((l) => (
										<div
											key={l.id}
											className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm ${
												selectedLessonId === l.id ? "bg-brand-100 text-brand-800" : "hover:bg-gray-50"
											}`}
											onClick={() => setSelectedLessonId(l.id)}>
											<span className="flex items-center gap-1 truncate">
												<FaChevronRight size={10} />
												{l.title}
											</span>
											<button
												onClick={(e) => {
													e.stopPropagation();
													handleDeleteLesson(l.id);
												}}
												className="text-red-400 hover:text-red-600 flex-shrink-0">
												<FaTrash size={12} />
											</button>
										</div>
									))}
								</div>
								<div className="space-y-1">
									<input
										type="text"
										value={newLessonKey}
										onChange={(e) =>
											setNewLessonKey(e.target.value.replace(/[^A-Za-z0-9_]/g, "_"))
										}
										placeholder="Lesson key (e.g. Lesson_12)"
										className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
									/>
									<p className="text-xs text-gray-400 -mt-0.5 mb-1">
										Letters, numbers, underscores only — must be unique within this
										year + difficulty. Avoid renaming later if students have
										already taken it.
									</p>
									<input
										type="text"
										value={newLessonTitle}
										onChange={(e) => setNewLessonTitle(e.target.value)}
										placeholder='Lesson title (e.g. "Lesson 12: Forgiveness")'
										className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
									/>
									<button
										onClick={handleAddLesson}
										className="w-full px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm flex items-center justify-center gap-1">
										<FaPlus size={12} /> Add Lesson
									</button>
								</div>
							</>
						)}
					</div>
					</>
					)}

					{/* Questions */}
					<div className="bg-white rounded-xl shadow p-4">
						<h3 className="font-semibold text-gray-800 mb-3">
							{mode === "real" ? `Real Quiz Questions — ${CATEGORIES.find((c) => c.value === category)?.label}` : "Questions"}
						</h3>
						{!selectedLessonId ? (
							<p className="text-sm text-gray-400">
								{mode === "real" ? "Setting up..." : "Select a lesson first."}
							</p>
						) : (
							<>
								<div className="space-y-1 mb-3 max-h-64 overflow-y-auto">
									{questions.length === 0 && <p className="text-sm text-gray-400">None yet.</p>}
									{questions.map((q) => (
										<div key={q.id} className="flex items-start justify-between px-3 py-2 rounded-lg bg-gray-50 text-sm gap-2">
											<div className="min-w-0">
												<p className="truncate">{q.question}</p>
												<p className="text-xs text-gray-400 truncate">Answer: {q.answer}</p>
											</div>
											<button
												onClick={() => handleDeleteQuestion(q.id)}
												className="text-red-400 hover:text-red-600 flex-shrink-0">
												<FaTrash size={12} />
											</button>
										</div>
									))}
								</div>

								<div className="border-t pt-3 space-y-1">
									<input
										type="text"
										value={newQuestion.question}
										onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
										placeholder="Question text"
										className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
									/>
									<select
										value={newQuestion.type}
										onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value })}
										className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm">
										<option value="multiple-choice">Multiple choice</option>
										<option value="fill-in-the-blank">Fill in the blank</option>
									</select>
									{newQuestion.type === "multiple-choice" ? (
										<>
											{newQuestion.options.map((opt, i) => (
												<input
													key={i}
													type="text"
													value={opt}
													onChange={(e) => {
														const options = [...newQuestion.options];
														options[i] = e.target.value;
														setNewQuestion({ ...newQuestion, options });
													}}
													placeholder={`Option ${i + 1}`}
													className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
												/>
											))}
											<p className="text-xs text-gray-400 -mt-0.5">
												The correct answer below must be typed to exactly match one of these options, word for word — a mismatch means no option a student picks will ever count as correct.
											</p>
										</>
									) : (
										<p className="text-xs text-gray-400">
											For more than one acceptable answer, put them all in the single answer field below, separated by a comma, a slash, or "or" — e.g. <span className="font-mono">forgiveness, mercy</span> — not separate entries.
										</p>
									)}
									<input
										type="text"
										value={newQuestion.answer}
										onChange={(e) => setNewQuestion({ ...newQuestion, answer: e.target.value })}
										placeholder={
											newQuestion.type === "multiple-choice"
												? "Correct answer (must match an option above)"
												: 'Correct answer(s), e.g. "forgiveness, mercy"'
										}
										className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
									/>
									<button
										onClick={handleAddQuestion}
										className="w-full px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm flex items-center justify-center gap-1">
										<FaPlus size={12} /> Add Question
									</button>
									{addedFlash && (
										<p className="text-xs text-green-600 font-medium">{addedFlash}</p>
									)}
								</div>

								<div className="border-t pt-3 mt-3">
									{mode === "real" && questions.length > 0 && (
										<div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-2">
											<label className="flex items-start gap-2 text-xs text-amber-800 cursor-pointer">
												<input
													type="checkbox"
													checked={replaceExisting}
													onChange={(e) => setReplaceExisting(e.target.checked)}
													className="mt-0.5"
												/>
												<span>
													<strong>This Real Quiz pool already has {questions.length} question{questions.length === 1 ? "" : "s"}.</strong>{" "}
													By default, a bulk import <strong>adds</strong> to them, not replaces them — check this box
													to delete the existing {questions.length} first (e.g. when uploading a brand new quarter's quiz).
												</span>
											</label>
										</div>
									)}
									<p className="text-xs font-medium text-gray-600 mb-1">
										Bulk add (paste a JSON array)
									</p>
									<div className="text-xs text-gray-400 mb-1.5 space-y-0.5">
										<p>
											<span className="font-medium text-gray-500">"type"</span> must be exactly{" "}
											<span className="font-mono">"multiple-choice"</span> or{" "}
											<span className="font-mono">"fill-in-the-blank"</span> — nothing else.
										</p>
										<p>
											Multiple choice: <span className="font-mono">"answer"</span> must exactly
											match one entry in <span className="font-mono">"options"</span>.
										</p>
										<p>
											Fill in the blank: omit <span className="font-mono">"options"</span>; for
											several acceptable answers use one string like{" "}
											<span className="font-mono">"forgiveness, mercy"</span>, not an array.
										</p>
										<p className="text-amber-600">
											One bad entry stops the whole batch — nothing gets added until every entry is valid.
										</p>
									</div>

									{/* A placeholder disappears the moment you click into the
									    field — exactly when you'd want to check the format. This
									    stays visible the whole time you're composing your JSON. */}
									<div className="bg-gray-50 border border-gray-200 rounded-lg p-2 mb-2">
										<div className="flex items-center justify-between mb-1">
											<p className="text-xs font-medium text-gray-500">Format reference</p>
											<button
												type="button"
												onClick={async () => {
													try {
														await navigator.clipboard.writeText(BULK_EXAMPLE);
													} catch {
														// clipboard unavailable — the text is still right
														// there to select and copy manually.
													}
												}}
												className="text-xs text-brand-600 hover:text-brand-800">
												Copy
											</button>
										</div>
										<pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap break-words">
											{BULK_EXAMPLE}
										</pre>
									</div>

									<textarea
										value={bulkText}
										onChange={(e) => setBulkText(e.target.value)}
										rows={5}
										placeholder='Paste your JSON array here (see the format reference above)'
										className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-mono"
									/>
									{bulkError && <p className="text-xs text-red-600 mt-1">{bulkError}</p>}
									<button
										onClick={handleBulkAdd}
										disabled={bulkBusy || !bulkText.trim()}
										className={`w-full mt-1 px-3 py-1.5 text-white rounded-lg text-sm disabled:opacity-50 ${
											mode === "real" && replaceExisting
												? "bg-red-600 hover:bg-red-700"
												: "bg-gray-700 hover:bg-gray-800"
										}`}>
										{bulkBusy
											? mode === "real" && replaceExisting
												? "Replacing..."
												: "Importing..."
											: mode === "real" && replaceExisting
											? `Replace ${questions.length} Question${questions.length === 1 ? "" : "s"}`
											: "Bulk Import"}
									</button>
									{bulkSuccess && (
										<p className="text-xs text-green-600 font-medium mt-1">{bulkSuccess}</p>
									)}
								</div>
							</>
						)}
					</div>
				</div>
			</div>
		</AdminShell>
	);
};

export default ContentManagement;
