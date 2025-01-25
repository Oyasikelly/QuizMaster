"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";

const UpdatePasswordForm = ({ resetCode }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const { data, error: updateError } = await supabase.auth.updateUser({
        password,
        access_token: resetCode, // Pass the code to Supabase
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setMessage("Your password has been updated successfully.");
      setError("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.log(err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-green-500 to-blue-500 text-white p-4">
      <motion.div
        className="bg-white text-black p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-sm md:max-w-md lg:max-w-lg"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl md:text-2xl font-bold mb-6 text-center">
          Set New Password
        </h2>
        <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-gray-600 text-sm">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-100 p-2 rounded-md shadow-sm text-sm outline-none"
              placeholder="Enter new password"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-gray-600 text-sm">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-gray-100 p-2 rounded-md shadow-sm text-sm outline-none"
              placeholder="Confirm new password"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {message && <p className="text-green-500 text-sm">{message}</p>}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="bg-gradient-to-r from-green-500 to-blue-500 text-white py-2 rounded-md shadow-md font-semibold text-sm"
          >
            Update Password
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default UpdatePasswordForm;
