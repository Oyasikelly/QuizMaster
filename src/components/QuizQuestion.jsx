import { motion } from "framer-motion";
const QuizQuestion = ({ question, options, onAnswer }) => {
  return (
    <div className="w-full max-w-2xl mx-auto text-center">
      {/* Question Text */}
      <motion.div
        className="text-xl font-semibold text-gray-800 mb-4"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <p>{question}</p>
      </motion.div>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {options.map((option, index) => (
          <motion.button
            key={index}
            onClick={() => onAnswer(option)}
            className="py-2 px-4 rounded-md bg-blue-500 text-white hover:bg-blue-600 shadow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 * index, duration: 0.6 }}
          >
            {option}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default QuizQuestion;
