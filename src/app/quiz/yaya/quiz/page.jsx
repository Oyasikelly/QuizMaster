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

  return <Quiz initialQuestions={initialQuestions} />;
};

export default YAYAQuiz;
