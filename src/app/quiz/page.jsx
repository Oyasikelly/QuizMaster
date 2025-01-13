import { useState } from "react";

// components
import QuizQuestion from "../components/QuizQuestion";

const questions = [
  {
    question: "What is the capital of France?",
    options: ["Berlin", "Madrid", "Paris", "Rome"],
    correctAnswer: "Paris",
  },
  {
    question: 'Which element is represented by the symbol "O"?',
    options: ["Oxygen", "Gold", "Osmium", "Ozone"],
    correctAnswer: "Oxygen",
  },
  // Add more questions here
];

const Quiz = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  const handleAnswer = (selectedOption) => {
    // Check if the answer is correct
    if (selectedOption === questions[currentQuestionIndex].correctAnswer) {
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
      <div className="w-full max-w-2xl mx-auto text-center mt-10">
        <h2 className="text-2xl font-bold text-gray-800">Quiz Finished!</h2>
        <p className="text-lg text-gray-600">
          You got {correctAnswers} out of {questions.length} correct!
        </p>
        <button
          className="mt-4 py-2 px-6 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
          onClick={() => window.location.reload()}
        >
          Restart Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto text-center">
      <QuizQuestion
        question={questions[currentQuestionIndex].question}
        options={questions[currentQuestionIndex].options}
        onAnswer={handleAnswer}
      />
    </div>
  );
};

export default Quiz;
