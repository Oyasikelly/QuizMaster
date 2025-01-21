"use client";
import { useState } from "react";
import Link from "next/link";

// components
import QuizQuestion from "../../components/QuizQuestion";
import RandomQuiz from "../questions";

const Quiz = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  const handleAnswer = (selectedOption) => {
    // Check if the answer is correct
    if (selectedOption === RandomQuiz[currentQuestionIndex].correctAnswer) {
      setCorrectAnswers(correctAnswers + 1);
    }

    // Move to the next question or finish the quiz if it's the last question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsQuizFinished(true); // Quiz finished
    }
  };

  if (isQuizFinished) {
    return (
      <div className="w-full h-screen flex flex-col justify-center items-center max-w-2xl mx-auto text-center mt-10">
        <h2 className="text-2xl font-bold text-gray-800">Quiz Finished!</h2>
        <p className="text-lg text-gray-600">
          You got {correctAnswers} out of {RandomQuiz.length} correct!
        </p>
        <button
          className="mt-4 w-fit py-2 px-6 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
          onClick={() => window.location.reload()}
        >
          Restart Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-screen max-w-2xl mx-auto flex flex-col items-center justify-center text-center">
      <QuizQuestion
        question={RandomQuiz[currentQuestionIndex].question}
        options={RandomQuiz[currentQuestionIndex].options}
        onAnswer={handleAnswer}
      />
      <div className="w-fit  bg-blue-500 text-white px-4 py-[0.5rem] mt-10 hover:bg-blue-600">
        <Link href="/">Go to main menu</Link>
      </div>
    </div>
  );
};

export default Quiz;
