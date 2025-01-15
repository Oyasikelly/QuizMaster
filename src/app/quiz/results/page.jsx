"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

const ResultsContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const correctAnswers = parseInt(searchParams.get("correct"), 10);
  const totalQuestions = parseInt(searchParams.get("total"), 10);

  const [answers, setAnswers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    const quizResults = localStorage.getItem("quizResults");
    if (quizResults) {
      const { answers, questions } = JSON.parse(quizResults);
      setAnswers(answers);
      setQuestions(questions);
    }
  }, []);

  const getPerformanceMessage = () => {
    const percentage = (correctAnswers / totalQuestions) * 100;
    if (percentage === 100) return "Excellent performance!";
    if (percentage >= 80) return "Great job!";
    if (percentage >= 50) return "Good effort!";
    return "You can do better, keep practicing!";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-teal-500 to-indigo-700 text-white p-4">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-white text-black rounded-lg shadow-2xl p-6 w-full max-w-lg"
      >
        <h1 className="text-4xl font-bold text-center mb-6">Results</h1>
        <p className="text-xl mb-4">
          You answered {correctAnswers} out of {totalQuestions} questions
          correctly.
        </p>
        <h2 className="text-2xl font-bold text-center text-green-500 mb-6">
          {getPerformanceMessage()}
        </h2>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAnswers(!showAnswers)}
          className="bg-blue-500 hover:bg-blue-700 text-white py-3 px-6 rounded-lg text-xl w-full mb-4"
        >
          {showAnswers ? "Hide Answers" : "See Answers"}
        </motion.button>

        {showAnswers && (
          <div className="bg-gray-100 p-4 rounded-lg">
            {questions.map((question, index) => (
              <div key={index} className="mb-4">
                <h3 className="font-bold">
                  {index + 1}. {question.question}
                </h3>
                <p>
                  <span className="font-semibold">Your Answer:</span>{" "}
                  {answers[index] || "No answer selected"}
                </p>
                <p>
                  <span className="font-semibold text-green-600">
                    Correct Answer:
                  </span>{" "}
                  {question.answer}
                </p>
              </div>
            ))}
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/")}
          className="bg-purple-500 hover:bg-purple-700 text-white py-3 px-6 rounded-lg text-xl w-full"
        >
          Return to Home
        </motion.button>
      </motion.div>
    </div>
  );
};

export default ResultsContent;
