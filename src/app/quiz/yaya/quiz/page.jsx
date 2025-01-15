import { Suspense } from "react";
import Quiz from "../../../../components/Quiz";
const YAYAQuiz = () => {
  const initialQuestions = [
    {
      question: "Who led the Israelites out of Egypt?",
      options: ["Abraham", "Moses", "David", "Joshua"],
      answer: "Moses",
    },
    {
      question: "Where was Jesus born?",
      options: ["Jerusalem", "Nazareth", "Bethlehem", "Galilee"],
      answer: "Bethlehem",
    },
    // Add more questions here
  ];

  return (
    <Suspense
      fallback={<div className="text-center text-white">Loading Quiz...</div>}
    >
      <Quiz initialQuestions={initialQuestions} />
    </Suspense>
  );
};

export default YAYAQuiz;
