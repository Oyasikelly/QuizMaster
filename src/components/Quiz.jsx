"use client";
import { motion } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";
import { FiAward, FiLock } from "react-icons/fi";
import { isRealQuizActive } from "../lib/quiz-config";

const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

// ---------------------------------------------------------------------------
// Helpers — defined at module level so they are always available, even inside
// catch blocks and background async tasks.
// ---------------------------------------------------------------------------
const standardizeBibleReference = (text) => {
	if (!text) return text;
	let processed = text.replace(/\b(first|second|third)\b/gi, (match) => {
		const lower = match.toLowerCase();
		if (lower === "first") return "1";
		if (lower === "second") return "2";
		if (lower === "third") return "3";
		return match;
	});
	return processed.replace(
		/(?:([123]|i{1,3})\s*)?([a-z]{3})[a-z]*\.?\s+(\d+)(?:\s*[:v]\s*|\s+vs\.?\s+|\s+)(\d+(?:\s*-\s*\d+)?)/gi,
		(match, bookNum, bookName, chapter, verse) => {
			let num = bookNum ? bookNum.toLowerCase() : "";
			if (num === "i") num = "1";
			if (num === "ii") num = "2";
			if (num === "iii") num = "3";
			const book = bookName.toLowerCase();
			const v = verse.replace(/[\s:-]+/g, "");
			return `${num}${book}${chapter}v${v}`;
		}
	);
};

const normalize = (str) =>
	standardizeBibleReference(str || "")
		.trim()
		.toLowerCase()
		.replace(/[^\w\s]/g, "");

// Wraps a promise with a hard timeout so a stalled network call never hangs.
const withTimeout = (promise, ms) =>
	Promise.race([
		promise,
		new Promise((_, reject) =>
			setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
		),
	]);

// ---------------------------------------------------------------------------

const Quiz = ({ initialQuestions, category }) => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const userTime = parseInt(searchParams.get("time"), 10);
	const numQuestions = parseInt(searchParams.get("questions"), 10);
	const [isRealQuiz, setIsRealQuiz] = useState(false);

	useEffect(() => {
		const checkQuizMode = async () => {
			try {
				const isReal = await isRealQuizActive(supabase);
				setIsRealQuiz(isReal);
			} catch (error) {
				console.error("Error checking quiz mode:", error);
				setIsRealQuiz(false);
			}
		};
		checkQuizMode();
	}, []);

	const [time, setTime] = useState(userTime * 60);
	const [questions, setQuestions] = useState([]);
	const [currentQuestion, setCurrentQuestion] = useState(0);
	const [answers, setAnswers] = useState([]);
	const [timerRunning, setTimerRunning] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState("");

	// Define handlers in a scope accessible to both setup and cleanup
	const handlePopState = () => {
		window.history.pushState(null, "", window.location.href);
	};
	const handleBeforeUnload = (e) => {
		if (isSubmitting) {
			e.preventDefault();
			e.returnValue =
				"Quiz submission in progress. Please wait until it completes.";
		} else {
			e.preventDefault();
			e.returnValue =
				"Are you sure you want to leave? Your progress will be lost.";
		}
	};

	const removeNavigationLock = () => {
		window.removeEventListener("popstate", handlePopState);
		window.removeEventListener("beforeunload", handleBeforeUnload);
	};

	useEffect(() => {
		window.history.pushState(null, "", window.location.href);
		window.addEventListener("popstate", handlePopState);
		window.addEventListener("beforeunload", handleBeforeUnload);

		return removeNavigationLock; // Cleanup on unmount
	}, []);

	useEffect(() => {
		const slicedQuestions = shuffleArray(initialQuestions)
			.slice(0, numQuestions)
			.map((q) => ({
				...q,
				options: q.type === "multiple-choice" ? shuffleArray(q.options) : [],
			}));
		setQuestions(slicedQuestions);
		setAnswers(Array(slicedQuestions.length).fill(null));
	}, [initialQuestions, numQuestions]);

	useEffect(() => {
		if (timerRunning && time > 0) {
			const timer = setTimeout(() => setTime((prev) => prev - 1), 1000);
			return () => clearTimeout(timer);
		}
		if (time === 0) handleSubmit();
	}, [time, timerRunning]);

	const handleAnswer = (option) => {
		const updatedAnswers = [...answers];
		updatedAnswers[currentQuestion] = option;
		setAnswers(updatedAnswers);
	};

	const handleNext = () => {
		if (currentQuestion < questions.length - 1) {
			setCurrentQuestion((prev) => prev + 1);
		}
	};

	const handlePrev = () => {
		if (currentQuestion > 0) {
			setCurrentQuestion((prev) => prev - 1);
		}
	};

	const handleSubmit = async () => {
		setIsSubmitting(true);
		setSubmitError("");
		setTimerRunning(false);

		try {
			// ── Scoring ─────────────────────────────────────────────────────────
			const evaluateFillInTheBlank = (question, userAnswer) => {
				const normalizedUserWords = normalize(userAnswer).split(/\s+/);
				const rawAnswers = question.answer
					.split(/,|\/| or | OR /)
					.map((a) => normalize(a).trim())
					.filter(Boolean);
				const normalizedUserAnswerString = normalize(userAnswer);

				let matchCount = 0;
				for (const correct of rawAnswers) {
					if (
						correct.includes(" ")
							? normalizedUserAnswerString.includes(correct)
							: normalizedUserWords.includes(correct)
					) {
						matchCount++;
					}
				}

				const qText = question.question.toLowerCase();
				if (qText.includes("mention four")) return matchCount >= 4;
				if (qText.includes("mention three")) return matchCount >= 3;
				if (qText.includes("mention two")) return matchCount >= 2;
				if (qText.includes("mention one")) return matchCount >= 1;
				if (qText.includes("complete")) return matchCount >= 3;
				return matchCount >= 1;
			};

			const correctAnswersCount = answers.filter((answer, index) => {
				const question = questions[index];
				if (question.type === "fill-in-the-blank") {
					return evaluateFillInTheBlank(question, answer);
				}
				return normalize(answer) === normalize(question.answer);
			}).length;

			const normalizedAnswers = answers.map((answer) => normalize(answer));
			const normalizedQuestions = questions.map((q) => ({
				...q,
				answer: normalize(q.answer),
			}));

			// ── STEP 1: Save to localStorage IMMEDIATELY ─────────────────────────
			// This ensures the results page always has data.
			localStorage.setItem(
				"quizResults",
				JSON.stringify({
					answers: normalizedAnswers,
					questions: normalizedQuestions,
				})
			);

			// ── STEP 2: Strict Synchronous Save to DB ───────────────────────────
			// The user must wait for confirmation before seeing their results.
			const { data: authData, error: authError } = await withTimeout(
				supabase.auth.getUser(),
				15000 // Give extra time for mobile networks
			);

			if (authError || !authData?.user) {
				throw new Error("Authentication check failed. Please check your network connection.");
			}

			const student_id = authData.user.id;
			const userEmail = authData.user.email;

			const { data: usersData, error: usersError } = await withTimeout(
				supabase
					.from("users_profile")
					.select("email, name, class")
					.eq("email", userEmail),
				15000
			);

			if (usersError) {
				console.error("Profile fetch error:", usersError);
			}

			const userProfile = usersData && usersData[0];

			const resultData = {
				student_id,
				email: userProfile?.email || userEmail,
				name: userProfile?.name || "Unknown",
				class: userProfile?.class || "Unknown",
				category,
				score: correctAnswersCount,
				total_questions: questions.length,
				timestamp: new Date().toISOString(),
			};

			console.log("Saving DB synchronously:", resultData);

			// IMPORTANT: The database table "quiz_results" MUST have a UNIQUE constraint 
			// on "student_id" for this to work without throwing an error.
			const { data: upsertData, error: upsertError } = await withTimeout(
				supabase
					.from("quiz_results")
					.upsert([resultData], { onConflict: "student_id" })
					.select(),
				20000 // 20s timeout to allow maximum chance to succeed
			);

			if (upsertError) {
				throw new Error(upsertError.message);
			}

			console.log("DB save success:", upsertData);

			// ── STEP 3: Navigate to results ONLY if DB save succeeds ───────────
			removeNavigationLock();
			router.replace(
				`/quiz/results?correct=${correctAnswersCount}&total=${questions.length}`
			);
		} catch (err) {
			console.error("An error occurred during submission:", err);
			setSubmitError(
				err.message || "Failed to save your score due to a network error. Please ensure you have internet access and try again."
			);
			setIsSubmitting(false); // Stop loading so they can click retry
		}
	};

	const formatTime = (seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
	};

	return (
		<Suspense
			fallback={
				<div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
					<motion.div
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5 }}
						className="flex flex-col items-center justify-center gap-6 bg-white/80 rounded-3xl shadow-2xl p-10 border border-white/50">
						<div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-spin-slow flex items-center justify-center shadow-xl">
							<span className="text-white text-3xl animate-pulse font-bold">
								Q
							</span>
						</div>
						<p className="text-gray-700 text-xl font-bold tracking-wide animate-pulse">
							Loading Quiz...
						</p>
					</motion.div>
				</div>
			}>
				{/* Error Overlay */}
			{submitError && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 backdrop-blur-md">
					<motion.div
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						className="flex flex-col items-center justify-center gap-6 bg-red-50 rounded-3xl shadow-2xl p-10 border border-red-200 max-w-md w-11/12">
						<div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
							<svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
							</svg>
						</div>
						<p className="text-red-800 text-center font-medium leading-relaxed">
							{submitError}
						</p>
						<button
							onClick={handleSubmit}
							className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg transition-colors">
							Retry Submission
						</button>
					</motion.div>
				</div>
			)}

			{/* Loading Overlay */}
			{isSubmitting && !submitError && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm">
					<motion.div
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5 }}
						className="flex flex-col items-center justify-center gap-6 bg-white rounded-3xl shadow-2xl p-10 border border-gray-200">
						<div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-spin-slow flex items-center justify-center shadow-xl">
							<FiAward className="text-white text-3xl animate-pulse" />
						</div>
						<p className="text-gray-700 text-xl font-bold tracking-wide animate-pulse">
							Calculating Your Score...
						</p>
					</motion.div>
				</div>
			)}
			<div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
				<motion.div
					initial={{ opacity: 0, y: -40 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
					className="w-full max-w-2xl mx-auto text-center mb-8">
					<div className="flex items-center justify-center gap-3 mb-4">
						<h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
							{category} Quiz
						</h1>
						{isRealQuiz && (
							<div className="flex items-center gap-2 px-3 py-1 bg-red-100 border border-red-300 rounded-full">
								<FiLock className="text-red-500 text-sm" />
								<span className="text-red-700 text-sm font-semibold">
									Real Quiz
								</span>
							</div>
						)}
					</div>
					<div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-4">
						<div className="flex items-center gap-2 text-lg text-gray-700 bg-white/80 rounded-xl px-4 py-2 shadow border border-white/50">
							<span className="font-semibold">Time Left:</span>
							<span className="font-mono text-blue-600">
								{formatTime(time)}
							</span>
						</div>
						<div className="flex items-center gap-2 text-lg text-gray-700 bg-white/80 rounded-xl px-4 py-2 shadow border border-white/50">
							<span className="font-semibold">Question:</span>
							<span className="font-mono text-purple-600">
								{currentQuestion + 1} / {questions.length}
							</span>
						</div>
					</div>
					<div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
						<motion.div
							initial={{ width: 0 }}
							animate={{ width: `${(time / (userTime * 60)) * 100}%` }}
							transition={{ duration: 0.5 }}
							className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
						/>
					</div>
				</motion.div>
				<motion.div
					initial={{ scale: 0.95, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ duration: 0.6 }}
					className="w-full max-w-2xl bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/50">
					{questions.length > 0 && (
						<>
							<h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
								{questions[currentQuestion].question}
							</h2>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
								{questions[currentQuestion].type === "multiple-choice" ? (
									questions[currentQuestion].options.map((option, index) => (
										<motion.button
											key={index}
											whileHover={{ scale: 1.04 }}
											whileTap={{ scale: 0.97 }}
											onClick={() => handleAnswer(option)}
											className={`py-3 px-4 rounded-2xl text-base font-medium transition-all duration-200 border shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
												${
													answers[currentQuestion] === option
														? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
														: "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
												}
											`}>
											{option}
										</motion.button>
									))
								) : (
									<div className="mb-8">
										<input
											type="text"
											placeholder="Type your answer..."
											className="w-full p-4 rounded-xl border"
											value={answers[currentQuestion] || ""}
											onChange={(e) => handleAnswer(e.target.value)}
										/>
									</div>
								)}
							</div>
							<div className="flex justify-between items-center mt-4 gap-4">
								<button
									onClick={handlePrev}
									disabled={currentQuestion <= 0}
									className={`py-2 px-6 rounded-full text-base font-semibold transition-all duration-200
										${
											currentQuestion <= 0
												? "bg-gray-300 text-gray-400 cursor-not-allowed"
												: "bg-gradient-to-r from-gray-500 to-gray-700 text-white hover:from-gray-600 hover:to-gray-800 shadow"
										}
									`}>
									Prev
								</button>
								{currentQuestion < questions.length - 1 ? (
									<button
										onClick={handleNext}
										className="py-2 px-6 rounded-full text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow transition-all duration-200">
										Next
									</button>
								) : (
									<button
										onClick={handleSubmit}
										className="py-2 px-6 rounded-full text-base font-semibold bg-gradient-to-r from-pink-500 to-red-600 text-white hover:from-pink-600 hover:to-red-700 shadow transition-all duration-200">
										Submit
									</button>
								)}
							</div>
						</>
					)}
				</motion.div>
			</div>
		</Suspense>
	);
};

export default Quiz;
