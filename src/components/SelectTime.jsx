"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
	FaClock,
	FaPlay,
	FaQuestionCircle,
	FaExclamationTriangle,
} from "react-icons/fa";
import { FiLock } from "react-icons/fi";
import { supabase } from "../lib/supabase";
import {
	isRealQuizActive,
	hasUserTakenRealQuiz,
	getQuizSettings,
	isPracticeModeEnabled,
} from "../lib/quiz-config";

const timeCategories = {
	Quick: [10, 20, 30],
	Standard: [40, 50, 60],
	Extended: [90, 120, 150, 180],
};

const questionPresets = [10, 20, 30, 50, 100, 150, 200];

const Categories = [
	{ name: "yaya", pathname: "/quiz/yaya" },
	{ name: "adults", pathname: "/quiz/adults" },
	{ name: "teenagers", pathname: "/quiz/teenagers" },
];

export default function SelectTime() {
	const router = useRouter();
	const pathname = usePathname();
	const [selectedTime, setSelectedTime] = useState(0);
	const [selectedQuestions, setSelectedQuestions] = useState(0);
	const [loading, setLoading] = useState(false);
	const [quizState, setQuizState] = useState({
		isRealQuiz: false,
		hasTakenQuiz: false,
		canTakeQuiz: true,
		message: "",
	});
	const [user, setUser] = useState(null);

	// Remove loading overlay if returning from quiz page
	useEffect(() => {
		if (typeof window !== "undefined") {
			window.localStorage.removeItem("quizPageMounted");
		}
	}, []);

	// Check quiz state and user authentication
	useEffect(() => {
		const checkQuizState = async () => {
			try {
				console.log("🔍 Starting quiz state check...");

				// Get current user
				const {
					data: { user },
				} = await supabase.auth.getUser();
				console.log("👤 Current user:", user ? user.id : "No user");
				setUser(user);

				if (!user) {
					console.log("❌ No user logged in");
					setQuizState({
						isRealQuiz: false,
						hasTakenQuiz: false,
						canTakeQuiz: false,
						message: "Please log in to take the quiz",
					});
					return;
				}

				// Debug: Check current time
				const now = new Date();
				console.log("🕐 Current time:", now.toISOString());
				console.log("🕐 Current time (local):", now.toString());

				console.log("🔍 Checking if real quiz is active...");
				const isReal = await isRealQuizActive(supabase);
				console.log("🔒 Is Real Quiz Active:", isReal);

				console.log("🔍 Checking if practice mode is enabled...");
				const practiceEnabled = await isPracticeModeEnabled(supabase);
				console.log("🎯 Practice Mode Enabled:", practiceEnabled);

				console.log("🔍 Checking if user has taken quiz...");
				const hasTaken = await hasUserTakenRealQuiz(supabase, user.id);
				console.log("📝 Has User Taken Quiz:", hasTaken);

				// New logic: Check if practice mode is enabled
				if (isReal && hasTaken) {
					console.log("🎯 Setting: Already taken real quiz");
					setQuizState({
						isRealQuiz: true,
						hasTakenQuiz: true,
						canTakeQuiz: false,
						message:
							"You have already taken the real quiz. Practice mode will be available after the quiz period ends.",
					});
				} else if (isReal) {
					console.log("🎯 Setting: Real quiz mode");
					setQuizState({
						isRealQuiz: true,
						hasTakenQuiz: false,
						canTakeQuiz: true,
						message: "Real Quiz Mode: 1 hour, 100 questions",
					});
					// Set fixed values for real quiz
					setSelectedTime(60);
					setSelectedQuestions(100);
				} else {
					// Quiz is not active - check if practice mode is enabled
					if (practiceEnabled) {
						console.log("🎯 Setting: Practice mode (enabled by admin)");
						setQuizState({
							isRealQuiz: false,
							hasTakenQuiz: false,
							canTakeQuiz: true,
							message: "Practice Mode: Customize your quiz",
						});
						// Set default practice values
						setSelectedTime(30);
						setSelectedQuestions(20);
					} else {
						console.log("🎯 Setting: Quiz mode only (practice disabled)");
						setQuizState({
							isRealQuiz: false,
							hasTakenQuiz: false,
							canTakeQuiz: false,
							message:
								"Quiz is currently not available. Please wait for the next quiz period.",
						});
						// Set default values but disable quiz
						setSelectedTime(60);
						setSelectedQuestions(100);
					}
				}
			} catch (error) {
				console.error("Error checking quiz state:", error);
				setQuizState({
					isRealQuiz: false,
					hasTakenQuiz: false,
					canTakeQuiz: false,
					message: "Error loading quiz settings",
				});
			}
		};

		checkQuizState();
	}, []);

	// Listen for quiz page mount event
	useEffect(() => {
		const handleStorage = (e) => {
			if (e.key === "quizPageMounted" && e.newValue === "true") {
				setLoading(false);
			}
		};
		window.addEventListener("storage", handleStorage);
		return () => window.removeEventListener("storage", handleStorage);
	}, []);

	const handleStartQuiz = () => {
		setLoading(true);
		const selectedCategory = Categories.find(
			(cat) => pathname === cat.pathname
		);
		if (selectedCategory) {
			// Give overlay time to show before navigating
			setTimeout(() => {
				router.push(
					`${selectedCategory.pathname}/quiz?time=${selectedTime}&questions=${selectedQuestions}`
				);
			}, 300);
		}
	};

	const formatTime = (min) =>
		min >= 60
			? `${Math.floor(min / 60)}h ${min % 60 ? (min % 60) + "m" : ""}`.trim()
			: `${min} min`;

	const canStart =
		selectedTime > 0 && selectedQuestions > 0 && quizState.canTakeQuiz;

	return (
		<div className="flex flex-col items-center w-full p-6 relative">
			{/* Loading Overlay */}
			{loading && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
					<motion.div
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5 }}
						className="flex flex-col items-center justify-center gap-6 bg-white rounded-3xl shadow-2xl p-10 border border-gray-200">
						<div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-spin-slow flex items-center justify-center shadow-xl">
							<FaPlay className="text-white text-3xl animate-pulse" />
						</div>
						<p className="text-gray-700 text-xl font-bold tracking-wide animate-pulse">
							Loading Quiz...
						</p>
					</motion.div>
				</div>
			)}
			<motion.div
				initial={{ opacity: 0, y: -30 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
				className="w-full max-w-4xl space-y-10">
				{/* Quiz State Banner */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.1 }}
					className={`text-center p-4 rounded-2xl border-2 ${
						quizState.isRealQuiz
							? "bg-gradient-to-r from-red-50 to-orange-50 border-red-200"
							: quizState.canTakeQuiz
							? "bg-gradient-to-r from-green-50 to-blue-50 border-green-200"
							: "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200"
					}`}>
					<div className="flex items-center justify-center gap-2 mb-2">
						{quizState.isRealQuiz ? (
							<>
								<FiLock className="text-red-500" />
								<span className="font-bold text-red-700">Real Quiz Mode</span>
							</>
						) : quizState.canTakeQuiz ? (
							<>
								<FaPlay className="text-green-500" />
								<span className="font-bold text-green-700">Practice Mode</span>
							</>
						) : (
							<>
								<FaExclamationTriangle className="text-gray-500" />
								<span className="font-bold text-gray-700">
									Quiz Unavailable
								</span>
							</>
						)}
					</div>
					<p className="text-sm text-gray-600">{quizState.message}</p>

					{quizState.hasTakenQuiz && (
						<div className="mt-3 p-3 flex flex-col items-center justify-center bg-yellow-50 border border-yellow-200 rounded-lg">
							<div className="flex items-center gap-2 text-yellow-700">
								<FaExclamationTriangle />
								<span className="font-semibold">Quiz Already Taken</span>
							</div>
							<p className="text-xs text-yellow-600 mt-1">
								You have already completed the real quiz. Practice mode will be
								available after the quiz period ends.
							</p>
						</div>
					)}

					{!quizState.canTakeQuiz && !quizState.isRealQuiz && (
						<div className="mt-3 p-3 flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg">
							<div className="flex items-center gap-2 text-gray-700">
								<FaExclamationTriangle />
								<span className="font-semibold">Practice Mode Disabled</span>
							</div>
							<p className="text-xs text-gray-600 mt-1">
								Practice mode is currently disabled by the administrator. Please
								wait for the next quiz period.
							</p>
						</div>
					)}
				</motion.div>
				{/* Select Time */}
				<div className="text-center space-y-4">
					<h3 className="text-base font-semibold flex items-center justify-center gap-2 text-gray-800">
						<FaClock className="text-blue-500" /> Select Time
					</h3>

					{/* Custom Time Slider */}
					<div className="flex flex-col items-center mt-4 space-y-1">
						<label className="text-sm text-gray-600">
							{quizState.isRealQuiz ? "Fixed: " : "Custom: "}
							{formatTime(selectedTime)}
						</label>
						<input
							type="range"
							min={5}
							max={180}
							step={5}
							value={selectedTime}
							onChange={(e) => setSelectedTime(Number(e.target.value))}
							disabled={quizState.isRealQuiz || !quizState.canTakeQuiz}
							className={`w-2/3 md:w-1/3 ${
								quizState.isRealQuiz || !quizState.canTakeQuiz
									? "opacity-50 cursor-not-allowed"
									: "bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent"
							}`}
						/>
						{quizState.isRealQuiz && (
							<p className="text-xs text-red-600">
								Time is fixed for real quiz
							</p>
						)}
						{!quizState.canTakeQuiz && !quizState.isRealQuiz && (
							<p className="text-xs text-gray-600">
								Quiz is currently unavailable
							</p>
						)}
					</div>
				</div>

				{/* Select Number of Questions */}
				<div className="text-center space-y-4">
					<h3 className="text-base font-semibold flex items-center justify-center gap-2 text-gray-800">
						<FaQuestionCircle className="text-blue-500" /> Number of Questions
					</h3>
					<div className="flex flex-wrap justify-center gap-3">
						{/* Question presets removed for simplicity */}
					</div>

					{/* Optional Slider */}
					<div className="flex flex-col items-center space-y-1">
						<label className="text-sm text-gray-600">
							{quizState.isRealQuiz ? "Fixed: " : "Custom: "}
							{selectedQuestions} Questions
						</label>
						<input
							type="range"
							min={5}
							max={200}
							step={5}
							value={selectedQuestions}
							onChange={(e) => setSelectedQuestions(Number(e.target.value))}
							disabled={quizState.isRealQuiz || !quizState.canTakeQuiz}
							className={`w-2/3 md:w-1/3 ${
								quizState.isRealQuiz || !quizState.canTakeQuiz
									? "opacity-50 cursor-not-allowed"
									: "bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent"
							}`}
						/>
						{quizState.isRealQuiz && (
							<p className="text-xs text-red-600">
								Questions are fixed for real quiz
							</p>
						)}
						{!quizState.canTakeQuiz && !quizState.isRealQuiz && (
							<p className="text-xs text-gray-600">
								Quiz is currently unavailable
							</p>
						)}
					</div>
				</div>

				{/* Start Button */}
				<div className="flex justify-center">
					<motion.button
						whileHover={canStart ? { scale: 1.05 } : {}}
						whileTap={canStart ? { scale: 0.95 } : {}}
						onClick={canStart ? handleStartQuiz : undefined}
						disabled={!canStart}
						className={`py-4 px-8 rounded-full flex items-center justify-center gap-3 text-white font-semibold text-lg shadow-xl transition-all duration-300 ${
							quizState.isRealQuiz
								? "bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700"
								: quizState.canTakeQuiz
								? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
								: "bg-gray-400 cursor-not-allowed"
						} ${!canStart ? "opacity-50 cursor-not-allowed" : ""}`}>
						{quizState.isRealQuiz ? (
							<FiLock className="text-sm" />
						) : quizState.canTakeQuiz ? (
							<FaPlay className="text-sm" />
						) : (
							<FaExclamationTriangle className="text-sm" />
						)}
						{quizState.isRealQuiz
							? "Start Real Quiz"
							: quizState.canTakeQuiz
							? "Start Practice Quiz"
							: "Quiz Unavailable"}
					</motion.button>
				</div>
			</motion.div>
		</div>
	);
}

// Add this CSS to your global styles or tailwind config:
// .animate-spin-slow { animation: spin 2s linear infinite; }
