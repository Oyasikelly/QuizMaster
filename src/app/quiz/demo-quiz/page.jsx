"use client";
import { useState, Suspense } from "react";
import { motion } from "framer-motion";

import questions from "../questions/randomQuestions.json";

// component
import QuizQuestion from "../../../components/QuizQuestion";
import Quiz from "../../../components/Quiz";

const DemoQuiz = () => {
	return (
		<Suspense
			fallback={
				<div className="text-center text-white">Loading Demo Quiz...</div>
			}>
			<Quiz
				initialQuestions={questions}
				category={"Demo"}
			/>
		</Suspense>
	);
};

export default DemoQuiz;
