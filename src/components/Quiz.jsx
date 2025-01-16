// Original questions before shuffling
"use client";
import { motion } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";

const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

const addQuizResult = async (resultData) => {
  const { data, error } = await supabase
    .from("quiz_results")
    .upsert(resultData, {
      onConflict: [
        "quiz_id",
        "correct_answers",
        "total_questions",
        "timestamp",
      ],
    });

  if (error) {
    console.error("Error adding quiz result:", error);
  } else {
    console.log("Quiz result added");
  }

  // const { updateData, updateError } = await supabase
  //   .from("quiz_results")
  //   .update(resultData)
  //   .eq("quiz_id", resultData.quiz_id);

  // if (updateError) {
  //   console.error("Error adding quiz result:", error);
  // } else {
  //   console.log("Quiz result added");
  // }
};

const Quiz = ({ initialQuestions }) => {
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
    setTimerRunning(false);
    const correctAnswersCount = answers.filter(
      (answer, index) => answer === questions[index].answer
    ).length;

    // Store the data in localStorage
    localStorage.setItem("quizResults", JSON.stringify({ answers, questions }));

    const { data, error } = await supabase.auth.getUser();

    const userId = data.user.id;
    console.log(userId);

    // Prepare the result data
    const resultData = {
      user_id: userId,
      quiz_id: 1, // You can set quiz_id if you have different quiz types
      correct_answers: correctAnswersCount,
      total_questions: questions.length,
      timestamp: new Date().toISOString(),
    };

    // insert results

    await addQuizResult(resultData);
    // update results
    // await getUserQuizResults(userId);

    router.push(
      `/quiz/results?correct=${correctAnswersCount}&total=${questions.length}`
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <Suspense
      fallback={<div className="text-center text-white">Loading Quiz...</div>}
    >
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-pink-500 to-purple-700 text-white p-4">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-6">YAYA Quiz</h1>
          <p className="text-sm md:text-lg mb-4">
            Time Remaining: {formatTime(time)}
          </p>
          <div className="bg-gray-200 h-2 w-full rounded-full mb-6">
            <div
              style={{ width: `${(time / (userTime * 60)) * 100}%` }}
              className="bg-green-500 h-full rounded-full"
            ></div>
          </div>
          <p className="text-sm md:text-lg mb-4">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </motion.div>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white text-black rounded-lg shadow-lg p-4 md:p-6 w-full max-w-sm md:max-w-lg"
        >
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
                    }`}
                  >
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
                  }`}
                >
                  Prev
                </button>
                {currentQuestion < questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="bg-gray-500 hover:bg-gray-700 text-white py-2 px-4 rounded-lg text-sm md:text-base"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="bg-red-500 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm md:text-base"
                  >
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
