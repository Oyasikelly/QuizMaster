// Original questions before shuffling

import Quiz from "@/components/Quiz";

const AdultsQuiz = () => {
  const initialQuestions = [
    {
      question: "Who is the first king of Israel?",
      options: ["David", "Saul", "Solomon", "Goliath"],
      answer: "Saul",
    },
    {
      question: "What is the fruit of the Spirit?",
      options: [
        "Love, Joy, Peace",
        "Kindness, Patience, Self-Control",
        "Faith, Goodness, Peace",
        "Love, Joy, Faith",
      ],
      answer: "Love, Joy, Faith",
    },
    {
      question: "What is the smallest book in the Bible?",
      options: ["Obadiah", "Jude", "Philemon", "2 John"],
      answer: "Obadiah",
    },
  ];

  return <Quiz initialQuestions={initialQuestions} />;
};

export default AdultsQuiz;
