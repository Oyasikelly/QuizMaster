// Original questions before shuffling
"use client";
import { motion } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";

// component
import Successful from "../components/Successful";
const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

const addQuizResult = async (resultData) => {
	const { data, error } = await supabase
		.from("quiz_results")
		.upsert(resultData, {
			onConflict: ["user_id"], // Ensure user_id is the unique constraint in your table
		});

	if (error) {
		console.error("Error adding/updating quiz result:", error);
	} else {
		console.log("Quiz result added/updated:", data);
	}
};

const Quiz = ({ initialQuestions, category }) => {
	// const Categories = [
	//   {
	//     name: "yaya",
	//     pathname: "/quiz/yaya/quiz",
	//   },
	//   {
	//     name: "adults",
	//     pathname: "/quiz/adults/quiz",
	//   },
	//   {
	//     name: "teenagers",
	//     pathname: "/quiz/teenagers/quiz",
	//   },
	// ];

	const router = useRouter();
	const searchParams = useSearchParams();
	// const pathname = usePathname();
	const userTime = parseInt(searchParams.get("time"), 10);
	const numQuestions = parseInt(searchParams.get("questions"), 10);

	const [time, setTime] = useState(userTime * 60); // Time in seconds
	const [questions, setQuestions] = useState([]);
	const [currentQuestion, setCurrentQuestion] = useState(0);
	const [answers, setAnswers] = useState([]);
	const [timerRunning, setTimerRunning] = useState(true);
	const [showSuccess, setShowSuccess] = useState(false);

	async function transferMultipleColumns(userEmail) {
		try {
			// Step 1: Fetch `id`, `email`, and `name` from the `users` table
			const { data: usersData, error: usersError } = await supabase
				.from("users_profile")
				.select("email, name, class") // Select multiple columns
				.eq("email", userEmail); // Example filter, adjust as needed

			if (usersError) {
				console.log(usersError);
			}

			if (!usersData || usersData.length === 0) {
				console.log("No users found.");
				return;
			}

			if (usersData) {
				console.log(usersData);
			}
			// Step 2: Insert fetched data into the `profiles` table
			const profilesData = usersData.map((user) => ({
				email: user.email,
				name: user.name,
				class: user.class,
				category: category,
			}));

			const { data: profilesInsertData, error: profilesError } = await supabase
				.from("quiz_results")
				.upsert(profilesData, {
					onConflict: ["user_id"], // Ensure user_id is the unique constraint in your table
				});

			if (profilesError) {
				console.log(profilesError);
			}

			console.log("Data successfully transferred:", profilesInsertData);
		} catch (error) {
			console.error("Error transferring data:", error.message);
		}
	}

	useEffect(() => {
		const slicedQuestions = shuffleArray(initialQuestions)
			.slice(0, numQuestions)
			.map((q) => ({
				...q,
				options: shuffleArray(q.options),
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
		try {
			setTimerRunning(false);
			setShowSuccess(true);
			const correctAnswersCount = answers.filter(
				(answer, index) => answer === questions[index].answer
			).length;

			// Store the data in localStorage
			localStorage.setItem(
				"quizResults",
				JSON.stringify({ answers, questions })
			);

			const { data, error } = await supabase.auth.getUser();

			if (error) {
				console.error("Error fetching user:", error);
				return;
			}

			const userId = data.user.id;
			const userEmail = data.user.email;
			console.log(data);
			// Prepare the result data
			const resultData = {
				user_id: userId,
				correct_answers: correctAnswersCount,
				total_questions: questions.length,
				timestamp: new Date().toISOString(),
				// name:data.user.identities.
			};

			// Upsert quiz results
			await addQuizResult(resultData);
			await transferMultipleColumns(userEmail);

			router.push(
				`/quiz/results?correct=${correctAnswersCount}&total=${questions.length}`
			);
		} catch (err) {
			console.log(err);
		} finally {
			setShowSuccess(false);
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
				<div className="relative text-center text-white">Loading Quiz...</div>
			}>
			{showSuccess && (
				<div className="absolute w-full z-10 h-screen flex items-center justify-center top-0 right-0 left-0 bg-blue-500">
					<Successful
						message="Your form has been submitted successfully!"
						onClose={() => setShowSuccess(false)}
					/>
				</div>
			)}
			<div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-pink-500 to-purple-700 text-white p-4">
				<motion.div
					initial={{ opacity: 0, y: -50 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
					className="text-center mb-6">
					<h1 className="text-3xl md:text-4xl font-bold mb-6">
						{category} Quiz
					</h1>
					<p className="text-sm md:text-lg mb-4">
						Time Remaining: {formatTime(time)}
					</p>
					<div className="bg-gray-200 h-2 w-full rounded-full mb-6">
						<div
							style={{ width: `${(time / (userTime * 60)) * 100}%` }}
							className="bg-green-500 h-full rounded-full"></div>
					</div>
					<p className="text-sm md:text-lg mb-4">
						Question {currentQuestion + 1} of {questions.length}
					</p>
				</motion.div>
				<motion.div
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ duration: 0.6 }}
					className="bg-white text-black rounded-lg shadow-lg p-4 md:p-6 w-full max-w-sm md:max-w-lg">
					{questions.length > 0 && (
						<>
							<h2 className="text-lg text-center md:text-2xl font-bold mb-4">
								{questions[currentQuestion].question}
							</h2>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								{questions[currentQuestion].options.map((option, index) => (
									<motion.button
										key={index}
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
										onClick={() => handleAnswer(option)}
										className={`py-2 px-4 rounded-lg text-sm md:text-base ${
											answers[currentQuestion] === option
												? "bg-green-500 text-white"
												: "bg-blue-500 hover:bg-blue-700 text-white"
										}`}>
										{option}
									</motion.button>
								))}
							</div>
							<div className="mt-6 flex justify-between">
								<button
									onClick={handlePrev}
									disabled={currentQuestion <= 0}
									className={`py-2 px-4 rounded-lg text-sm md:text-base ${
										currentQuestion <= 0
											? "bg-gray-400 cursor-not-allowed"
											: "bg-gray-500 hover:bg-gray-700 text-white"
									}`}>
									Prev
								</button>
								{currentQuestion < questions.length - 1 ? (
									<button
										onClick={handleNext}
										className="bg-gray-500 hover:bg-gray-700 text-white py-2 px-4 rounded-lg text-sm md:text-base">
										Next
									</button>
								) : (
									<button
										onClick={handleSubmit}
										className="bg-red-500 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm md:text-base">
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
