"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";
import { FaClock, FaPlay, FaQuestionCircle } from "react-icons/fa";

const Categories = [
	{ name: "yaya", pathname: "/quiz/yaya" },
	{ name: "adults", pathname: "/quiz/adults" },
	{ name: "teenagers", pathname: "/quiz/teenagers" },
];

export default function SelectTime() {
	const router = useRouter();
	const pathname = usePathname();
	const [selectedTime, setSelectedTime] = useState(10);
	const [time, setTime] = useState(10);
	const [selectedQuestions, setSelectedQuestions] = useState(5); // Default number of questions

	const handleTimeSelection = (time) => {
		setSelectedTime(time);
		setTime(time);
	};

	const handleQuestionsSelection = (num) => {
		setSelectedQuestions(num);
	};

	const handleStartQuiz = () => {
		const selectedCategory = Categories.find(
			(category) => pathname === category.pathname
		);

		if (selectedCategory && selectedCategory.pathname) {
			const resultsPath = `${selectedCategory.pathname}/quiz`;
			router.push(
				`${resultsPath}?time=${selectedTime}&questions=${selectedQuestions}`
			);
		} else {
			console.error(
				"No matching category found for the current pathname:",
				pathname
			);
		}
	};

	return (
		<div className="flex flex-col items-center w-full">
			<motion.div
				initial={{ opacity: 0, y: -50 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8 }}
				className="w-full flex flex-col items-center max-w-4xl">
				<div className="grid gap-8 mb-6">
					{/* Select Time Section */}
					<div className="text-center">
						<h3 className="text-lg md:text-xl font-semibold mb-4 flex items-center justify-center gap-2 text-gray-800">
							<FaClock className="text-blue-500" /> Select Time
						</h3>
						<div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
							{[10, 20, 30, 40, 50, 60, 90, 120, 150, 180].map((time) => (
								<motion.button
									key={time}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={() => handleTimeSelection(time)}
									className={`p-3 rounded-2xl text-white transition-all duration-200 font-medium ${
										selectedTime === time
											? "bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg transform scale-105"
											: "bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 cursor-pointer"
									}`}>
									{time >= 60
										? `${Math.floor(time / 60)}h ${
												time % 60 > 0 ? (time % 60) + "m" : ""
										  }`.trim()
										: `${time} min`}
								</motion.button>
							))}
						</div>
					</div>

					{/* Select Questions Section */}
					<div className="text-center">
						<h3 className="text-lg md:text-xl font-semibold mb-4 flex items-center justify-center gap-2 text-gray-800">
							<FaQuestionCircle className="text-blue-500" /> Number of Questions
						</h3>
						<div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
							{[10, 20, 30, 40, 50, 60, 70, 80, 100, 150, 200].map((num) => (
								<motion.button
									key={num}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={() => handleQuestionsSelection(num)}
									className={`p-3 rounded-2xl text-white transition-all duration-200 font-medium ${
										selectedQuestions === num
											? "bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg transform scale-105"
											: "bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 cursor-pointer"
									}`}>
									{num} Questions
								</motion.button>
							))}
						</div>
					</div>
				</div>

				{/* Start Quiz Button */}
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={handleStartQuiz}
					className="py-4 px-8 rounded-2xl flex items-center justify-center gap-3 text-white font-semibold text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300">
					<FaPlay className="text-sm" /> Start Quiz
				</motion.button>
			</motion.div>
		</div>
	);
}
