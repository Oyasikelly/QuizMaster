"use client";
import { useState } from "react";
import { motion } from "framer-motion";

import questions from "../questions/randomQuestions.json";

// component
import QuizQuestion from "../../components/QuizQuestion";
const Quiz = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  const handleAnswer = (selectedOption) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: selectedOption,
    });
  };

  const calculateScore = () => {
    return questions.reduce((score, question, index) => {
      return selectedAnswers[index] === question.correctAnswer
        ? score + 1
        : score;
    }, 0);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsQuizFinished(true);
    }
  };

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  if (isQuizFinished) {
    const score = calculateScore();
    return (
      <div className="w-full h-screen flex flex-col justify-center items-center bg-blue-50 text-center p-6">
        <motion.h2
          className="text-3xl font-bold text-gray-800 mb-4"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Quiz Finished!
        </motion.h2>
        <motion.p
          className="text-lg text-gray-600 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          You scored <span className="text-blue-500 font-bold">{score}</span>{" "}
          out of {questions.length}!
        </motion.p>
        <button
          className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-600 transition duration-300"
          onClick={() => window.location.reload()}
        >
          Restart Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col justify-center items-center bg-blue-50 p-6">
      <QuizQuestion
        question={questions[currentQuestionIndex].question}
        options={questions[currentQuestionIndex].options}
        selectedOption={selectedAnswers[currentQuestionIndex]}
        correctAnswer={questions[currentQuestionIndex].correctAnswer}
        onAnswer={handleAnswer}
      />

      <div className="flex justify-between w-full max-w-2xl mt-8">
        <button
          className={`px-6 py-3 rounded-lg text-white ${
            currentQuestionIndex === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
          onClick={goToPrevQuestion}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </button>
        <button
          className="px-6 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
          onClick={goToNextQuestion}
        >
          {currentQuestionIndex === questions.length - 1
            ? "Finish Quiz"
            : "Next"}
        </button>
      </div>
    </div>
  );
};

export default Quiz;
