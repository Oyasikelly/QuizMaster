"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FiMail, FiSend } from "react-icons/fi";
import { supabase } from "../lib/supabase";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMssg, setErrorMssg] = useState("");
  const [successful, setSuccessful] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    const userEmail = localStorage.getItem("UserEmail");
    console.log(userEmail);
    const { data, error } = await supabase.auth.resetPasswordForEmail();
    console.log(data);
    // Simulate sending a password reset email (Replace with actual API call)
    if (error) {
      console.log(error);
      setMessage("");
      setErrorMssg("Invalid user email, signUp to continue:");
    } else {
      setTimeout(() => {
        setMessage("");
      }, 2000);
      setMessage("A password reset link has been sent to your email address.");
      setEmail("");
    }
  };

  return (
    <div className="flex items-center justify-center px-6 text-white">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="bg-white text-gray-800 rounded-lg shadow-lg p-8 w-full max-w-md"
      >
        <motion.h2
          className="text-3xl font-bold mb-6 text-center"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          Forgot Password
        </motion.h2>

        <motion.p
          className="text-center text-gray-600 mb-6"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          Enter your email below to receive a password reset link.
        </motion.p>

        {message && (
          <motion.div
            className="bg-green-100 text-green-800 rounded-md p-4 text-center mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {message}
          </motion.div>
        )}
        {errorMssg && (
          <motion.div
            className="bg-red-100 text-red-800 rounded-md p-4 text-center mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {errorMssg}
          </motion.div>
        )}

        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div className="relative">
            <FiMail className="absolute top-3 left-3 text-xl text-gray-400" />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-gray-100 text-gray-700 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <motion.button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2 transition-transform transform hover:scale-105"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiSend className="text-lg" />
            <span>Send Reset Link</span>
          </motion.button>
        </form>

        <motion.div
          className="mt-6 text-center text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          Remembered your password?{" "}
          <a
            href="/authenticate"
            className="text-indigo-600 hover:underline font-semibold"
          >
            Login
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
