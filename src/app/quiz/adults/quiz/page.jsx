"use client";

import { Suspense, useEffect } from "react";
import Quiz from "../../../../components/Quiz";
import adultsQuestions from "../../../questions/adultsQuestions.json";

const AdultsQuiz = () => {
	useEffect(() => {
		if (typeof window !== "undefined") {
			window.localStorage.setItem("quizPageMounted", "true");
		}
	}, []);

	// const initialQuestions = [
	//   {
	//     question: "Who is the first king of Israel?",
	//     options: ["David", "Saul", "Solomon", "Goliath"],
	//     answer: "Saul",
	//   },
	//   {
	//     question: "What is the fruit of the Spirit?",
	//     options: [
	//       "Love, Joy, Peace",
	//       "Kindness, Patience, Self-Control",
	//       "Faith, Goodness, Peace",
	//       "Love, Joy, Faith",
	//     ],
	//     answer: "Love, Joy, Faith",
	//   },
	//   {
	//     question: "What is the smallest book in the Bible?",
	//     options: ["Obadiah", "Jude", "Philemon", "2 John"],
	//     answer: "Obadiah",
	//   },
	// ];

	return (
		<Suspense fallback={<div>Loading quiz...</div>}>
			<Quiz
				initialQuestions={adultsQuestions}
				category={"Adults"}
			/>
		</Suspense>
	);
};

export default AdultsQuiz;
