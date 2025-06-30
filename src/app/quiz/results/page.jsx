"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
	FiAward,
	FiEye,
	FiEyeOff,
	FiHome,
	FiCheckCircle,
	FiXCircle,
	FiStar,
} from "react-icons/fi";

const ResultsContent = () => {
	const router = useRouter();
	const searchParams = useSearchParams();

	const correctAnswers = parseInt(searchParams?.get("correct") || "0", 10);
	const totalQuestions = parseInt(searchParams?.get("total") || "0", 10);

	const [answers, setAnswers] = useState([]);
	const [questions, setQuestions] = useState([]);
	const [showAnswers, setShowAnswers] = useState(false);
	const navLockActive = useRef(true);

	useEffect(() => {
		// Navigation lock
		window.history.pushState(null, "", window.location.href);
		const handlePopState = () => {
			if (navLockActive.current)
				window.history.pushState(null, "", window.location.href);
		};
		const handleBeforeUnload = (e) => {
			if (navLockActive.current) {
				e.preventDefault();
				e.returnValue =
					"You cannot reload or leave this page. Please use the Go to Home button.";
			}
		};
		window.addEventListener("popstate", handlePopState);
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => {
			window.removeEventListener("popstate", handlePopState);
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, []);

	const handleGoHome = () => {
		navLockActive.current = false;
		router.push("/");
	};

	useEffect(() => {
		try {
			const quizResults = localStorage.getItem("quizResults");
			if (quizResults) {
				const { answers, questions } = JSON.parse(quizResults);
				setAnswers(answers || []);
				setQuestions(questions || []);
				localStorage.removeItem("quizResults");
			}
		} catch (error) {
			console.error("Error fetching quiz results:", error);
		}
	}, []);

	// const getPerformanceMessage = () => {
	//   const percentage = (correctAnswers / totalQuestions) * 100;
	//   if (percentage === 100) return "Excellent performance!";
	//   if (percentage >= 80) return "Great job!";
	//   if (percentage >= 50) return "Good effort!";
	//   return "You can do better, keep practicing!";
	// };
	const getPerformanceMessage = () => {
		const percentage = (correctAnswers / totalQuestions) * 100;
		if (percentage) return "YOU HAVE ENDED YOUR QUIZ SECTION, exit this page.";
	};

	const getScoreColor = () => {
		const percentage = (correctAnswers / totalQuestions) * 100;
		if (percentage >= 80) return "from-green-500 to-emerald-600";
		if (percentage >= 60) return "from-yellow-500 to-orange-500";
		return "from-red-500 to-pink-600";
	};

	const getScoreIcon = () => {
		const percentage = (correctAnswers / totalQuestions) * 100;
		if (percentage >= 80)
			return <FiAward className="w-8 h-8 text-yellow-400" />;
		if (percentage >= 60) return <FiStar className="w-8 h-8 text-orange-400" />;
		return <FiCheckCircle className="w-8 h-8 text-red-400" />;
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 py-8">
			{/* Animated Background Elements */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
				<div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
				<div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
			</div>

			<motion.div
				initial={{ opacity: 0, y: -50, scale: 0.9 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ duration: 0.8 }}
				className="relative z-10 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-2xl border border-white/50">
				{/* Header */}
				<motion.div
					initial={{ y: -20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ duration: 0.6 }}
					className="text-center mb-8">
					<div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
						{getScoreIcon()}
					</div>
					<h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
						Quiz Results
					</h1>
					<p className="text-gray-600">Here's how you performed in your quiz</p>
				</motion.div>

				{/* Score Display */}
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ duration: 0.6, delay: 0.1 }}
					className="text-center mb-8">
					<div
						className={`inline-flex items-center justify-center w-32 h-32 bg-gradient-to-r ${getScoreColor()} rounded-full mb-4 shadow-xl`}>
						<span className="text-4xl font-bold text-white">
							{Math.round((correctAnswers / totalQuestions) * 100)}%
						</span>
					</div>
					<p className="text-2xl font-semibold text-gray-800 mb-2">
						{correctAnswers} out of {totalQuestions} correct
					</p>
					<p className="text-lg text-gray-600">{getPerformanceMessage()}</p>
				</motion.div>

				{/* Action Buttons */}
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ duration: 0.6, delay: 0.2 }}
					className="flex flex-col sm:flex-row gap-4 mb-8">
					<motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						onClick={() => setShowAnswers(!showAnswers)}
						className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg flex items-center justify-center space-x-3">
						{showAnswers ? (
							<FiEyeOff className="w-5 h-5" />
						) : (
							<FiEye className="w-5 h-5" />
						)}
						<span>{showAnswers ? "Hide Answers" : "See Answers"}</span>
					</motion.button>

					<motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						onClick={handleGoHome}
						className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg flex items-center justify-center space-x-3">
						<FiHome className="w-5 h-5" />
						<span>Return to Home</span>
					</motion.button>
				</motion.div>

				{/* Answers Section */}
				{showAnswers && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						transition={{ duration: 0.5 }}
						className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl border border-gray-200/50">
						<h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
							<FiCheckCircle className="w-5 h-5 text-blue-600" />
							<span>Detailed Answers</span>
						</h3>
						<div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-hide">
							{questions.map((question, index) => (
								<motion.div
									key={index}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.3, delay: index * 0.1 }}
									className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200/50">
									<h4 className="font-bold text-gray-800 mb-3 flex items-start space-x-2">
										<span className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
											{index + 1}
										</span>
										<span className="break-words">{question.question}</span>
									</h4>
									<div className="space-y-3 ml-8">
										<div>
											<span className="font-semibold text-gray-700 text-sm">
												Your Answer:
											</span>
											<div className="flex items-start space-x-2 mt-1">
												{answers[index] === question.answer ? (
													<FiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
												) : (
													<FiXCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-1" />
												)}
												<span
													className={`font-medium break-words ${
														answers[index] === question.answer
															? "text-green-600"
															: "text-red-600"
													}`}>
													{answers[index] || "No answer selected"}
												</span>
											</div>
										</div>
										{answers[index] !== question.answer && (
											<div>
												<span className="font-semibold text-gray-700 text-sm">
													Correct Answer:
												</span>
												<div className="flex items-start space-x-2 mt-1">
													<FiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
													<span className="font-medium text-green-600 break-words">
														{question.answer}
													</span>
												</div>
											</div>
										)}
									</div>
								</motion.div>
							))}
						</div>
					</motion.div>
				)}
			</motion.div>
			<style
				jsx
				global>{`
				.scrollbar-hide::-webkit-scrollbar {
					display: none;
				}
				.scrollbar-hide {
					-ms-overflow-style: none; /* IE and Edge */
					scrollbar-width: none; /* Firefox */
				}
			`}</style>
		</div>
	);
};

const ResultsPage = () => (
	<Suspense
		fallback={
			<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
				<div className="text-center text-gray-600">
					<div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p>Loading results...</p>
				</div>
			</div>
		}>
		<ResultsContent />
	</Suspense>
);

export default ResultsPage;
