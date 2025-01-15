"use client";
import { motion } from "framer-motion";

// components
import SelectTime from "../../../components/SelectTime";
const TeenagersIntroduction = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 pt-10">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold mb-6">Welcome to Teenagers Quiz</h1>
        <p className="text-lg mb-6">
          This quiz is designed to test your knowledge on a range of topics,
          from life experiences to Bible lessons, principles, and faith. Let's
          dive in and challenge your intellect!
        </p>
        <SelectTime />
      </motion.div>
    </div>
  );
};

export default TeenagersIntroduction;
