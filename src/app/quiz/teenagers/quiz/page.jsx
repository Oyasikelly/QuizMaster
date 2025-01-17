import { Suspense } from "react";
import Quiz from "../../../../components/Quiz";
import teenagerQuestions from "../../../questions/teenagersQuestions.json";
const TeenagersQuiz = () => {
  // const initialQuestions = [
  //   {
  //     question: "Who led the Israelites out of Egypt?",
  //     options: ["Abraham", "Moses", "David", "Joshua"],
  //     answer: "Moses",
  //   },
  //   {
  //     question: "Where was Jesus born?",
  //     options: ["Jerusalem", "Nazareth", "Bethlehem", "Galilee"],
  //     answer: "Bethlehem",
  //   },
  //   {
  //     question: "Where was Jesus born?",
  //     options: ["Jerusalem", "Nazareth", "Bethlehem", "Galilee"],
  //     answer: "Bethlehem",
  //   },
  // ];

  return (
    <Suspense
      fallback={<div className="text-center text-white">Loading Quiz...</div>}
    >
      <Quiz initialQuestions={teenagerQuestions} category={"Teenagers"} />;
    </Suspense>
  );
};

export default TeenagersQuiz;
