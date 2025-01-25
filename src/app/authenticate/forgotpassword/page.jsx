"use client";
import React from "react";
import { motion } from "framer-motion";
//component
import ForgotPassword from "../../../components/ForgotPassword";
import { useRouter } from "next/navigation";
export default function ForgotPasswordPage() {
  const router = useRouter();

  function toggleAuthModal() {
    router.push("/authenticate");
  }
  return (
    <div className="fixed inset-0 flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4">
      <motion.div
        className=" flex flex-col bg-white text-black p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-sm md:max-w-md lg:max-w-lg"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <span
          onClick={toggleAuthModal}
          className="self-end cursor-pointer text-gray-400 hover:text-gray-600 text-lg font-semibold"
        >
          ✕
        </span>
        <ForgotPassword />
      </motion.div>
    </div>
  );
}
