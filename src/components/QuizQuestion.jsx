import { motion } from "framer-motion";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const QuizQuestion = ({
  question,
  options,
  selectedOption,
  correctAnswer,
  onAnswer,
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto text-center bg-white rounded-lg shadow-lg p-8">
      {/* Question */}
      <motion.h2
        className="text-2xl font-bold text-blue-600 mb-6"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {question}
      </motion.h2>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4">
        {options.map((option, index) => {
          // Define button styles dynamically
          let buttonStyle = "bg-gray-100 hover:bg-blue-200 text-gray-700";

          if (selectedOption) {
            if (selectedOption === option) {
              buttonStyle =
                option === correctAnswer
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white";
            }
          }

          return (
            <motion.button
              key={index}
              onClick={() => !selectedOption && onAnswer(option)}
              className={`py-3 px-6 rounded-lg shadow-md font-semibold transition duration-300 ease-in-out ${buttonStyle}`}
              whileHover={{ scale: selectedOption ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 * index, duration: 0.6 }}
            >
              {option}
            </motion.button>
          );
        })}
      </div>

      {/* Feedback */}
      {selectedOption && (
        <motion.div
          className="mt-6 flex items-center justify-center text-lg font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {selectedOption === correctAnswer ? (
            <span className="text-green-500 flex items-center gap-2">
              <FaCheckCircle /> Correct! Great job.
            </span>
          ) : (
            <span className="text-red-500 flex items-center gap-2">
              <FaTimesCircle /> Oops! The correct answer is:{" "}
              <span className="font-bold">{correctAnswer}</span>.
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default QuizQuestion;
