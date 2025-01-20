"use client";

import { motion } from "framer-motion";
import { FaCheckCircle } from "react-icons/fa";

const SuccessMessage = ({ message, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5 }}
      className="transform -translate-x-1/2 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-4 relative"
    >
      {/* Rotating Gradient Background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 rounded-full blur-xl z-[-1]"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
      />

      {/* Icon */}
      <FaCheckCircle className="text-3xl z-10" />

      {/* Message Content */}
      <div className="flex flex-col z-10">
        <h4 className="font-bold text-lg">Success!</h4>
        <p className="text-sm">{message}</p>
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="ml-auto text-white bg-green-800 hover:bg-green-700 rounded-full px-3 py-1 text-sm z-10"
      >
        Close
      </button>
    </motion.div>
  );
};

export default SuccessMessage;
