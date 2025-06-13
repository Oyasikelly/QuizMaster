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
						<h3 className="text-lg md:text-xl font-semibold mb-4 flex items-center justify-center gap-2">
							<FaClock /> Select Time
						</h3>
						<div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
							{[10, 20, 30, 40, 50, 60].map((time) => (
								<motion.button
									key={time}
									whileHover={{ scale: time === 60 ? 1.05 : 1 }}
									whileTap={{ scale: time === 60 ? 0.95 : 1 }}
									onClick={() => time === 60 && handleTimeSelection(time)}
									disabled={time !== 60}
									className={`p-2 rounded-lg text-white transition duration-200 ${
										time === 60
											? selectedTime === time
												? "bg-yellow-500"
												: "bg-blue-500 hover:bg-blue-700 cursor-pointer"
											: "bg-gray-400 opacity-50 cursor-not-allowed"
									}`}>
									{time} min
								</motion.button>
							))}
						</div>
					</div>

					{/* Select Questions Section */}
					<div className="text-center">
						<h3 className="text-lg md:text-xl font-semibold mb-4 flex items-center justify-center gap-2">
							<FaQuestionCircle /> Number of Questions
						</h3>
						<div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
							{[10, 20, 30, 40, 50, 60, 70, 80, 100].map((num) => (
								<motion.button
									key={num}
									whileHover={{ scale: num === 100 ? 1.05 : 1 }}
									whileTap={{ scale: num === 100 ? 0.95 : 1 }}
									onClick={() => num === 100 && handleQuestionsSelection(num)}
									disabled={num !== 100}
									className={`p-2 rounded-lg text-white transition duration-200 ${
										num === 100
											? selectedQuestions === num
												? "bg-yellow-500"
												: "bg-blue-500 hover:bg-blue-700 cursor-pointer"
											: "bg-gray-400 opacity-50 cursor-not-allowed"
									}`}>
									{num} Questions
								</motion.button>
							))}
						</div>
					</div>
				</div>

				{/* Start Quiz Button */}
				<motion.button
					whileHover={{
						scale: selectedQuestions === 100 && selectedTime === 60 ? 1.05 : 1,
					}}
					whileTap={{
						scale: selectedQuestions === 100 && selectedTime === 60 ? 0.95 : 1,
					}}
					onClick={handleStartQuiz}
					disabled={selectedQuestions !== 100 || selectedTime !== 60}
					className={`py-2 px-6 rounded-lg flex items-center justify-center gap-2 text-black transition-opacity duration-200
    ${
			selectedQuestions === 100 && selectedTime === 60
				? "bg-yellow-500 hover:bg-yellow-600 cursor-pointer"
				: "bg-yellow-500 opacity-50 cursor-not-allowed"
		}`}>
					<FaPlay /> Start Quiz
				</motion.button>
			</motion.div>
		</div>
	);
}
