"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FaClock, FaPlay, FaQuestionCircle } from "react-icons/fa";

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

	// Remove loading overlay if returning from quiz page
	useEffect(() => {
		if (typeof window !== "undefined") {
			window.localStorage.removeItem("quizPageMounted");
		}
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

	const canStart = selectedTime > 0 && selectedQuestions > 0;

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
				{/* Select Time */}
				<div className="text-center space-y-4">
					<h3 className="text-base font-semibold flex items-center justify-center gap-2 text-gray-800">
						<FaClock className="text-blue-500" /> Select Time
					</h3>

					{/* {Object.entries(timeCategories).map(([label, times]) => (
						<div
							key={label}
							className="space-y-2">
							<p className="text-sm text-gray-600 font-medium">{label}</p>
							<div className="flex flex-wrap justify-center gap-3">
								{times.map((time) => (
									<motion.button
										key={time}
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
										onClick={() => setSelectedTime(time)}
										className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
											selectedTime === time
												? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
												: "bg-gray-200 text-gray-800 hover:bg-gray-300"
										}`}>
										{formatTime(time)}
									</motion.button>
								))}
							</div>
						</div>
					))} */}

					{/* Custom Time Slider */}
					<div className="flex flex-col items-center mt-4 space-y-1">
						<label className="text-sm text-gray-600">
							Custom: {formatTime(selectedTime)}
						</label>
						<input
							type="range"
							min={5}
							max={180}
							step={5}
							value={selectedTime}
							onChange={(e) => setSelectedTime(Number(e.target.value))}
							className="w-2/3 md:w-1/3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent"
						/>
					</div>
				</div>

				{/* Select Number of Questions */}
				<div className="text-center space-y-4">
					<h3 className="text-base font-semibold flex items-center justify-center gap-2 text-gray-800">
						<FaQuestionCircle className="text-blue-500" /> Number of Questions
					</h3>
					<div className="flex flex-wrap justify-center gap-3">
						{/* {questionPresets.map((num) => (
							<motion.button
								key={num}
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								onClick={() => setSelectedQuestions(num)}
								className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
									selectedQuestions === num
										? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md"
										: "bg-gray-200 text-gray-800 hover:bg-gray-300"
								}`}>
								{num} Questions
							</motion.button>
						))} */}
					</div>

					{/* Optional Slider */}
					<div className="flex flex-col items-center space-y-1">
						<label className="text-sm text-gray-600">
							Custom: {selectedQuestions} Questions
						</label>
						<input
							type="range"
							min={5}
							max={200}
							step={5}
							value={selectedQuestions}
							onChange={(e) => setSelectedQuestions(Number(e.target.value))}
							className="w-2/3 md:w-1/3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent"
						/>
					</div>
				</div>

				{/* Start Button */}
				<div className="flex justify-center">
					<motion.button
						whileHover={canStart ? { scale: 1.05 } : {}}
						whileTap={canStart ? { scale: 0.95 } : {}}
						onClick={canStart ? handleStartQuiz : undefined}
						disabled={!canStart}
						className={`py-4 px-8 rounded-full flex items-center justify-center gap-3 text-white font-semibold text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-xl transition-all duration-300 ${
							!canStart ? "opacity-50 cursor-not-allowed" : ""
						}`}>
						<FaPlay className="text-sm" /> Start Quiz
					</motion.button>
				</div>
			</motion.div>
		</div>
	);
}

// Add this CSS to your global styles or tailwind config:
// .animate-spin-slow { animation: spin 2s linear infinite; }
