"use client";

import { motion } from "framer-motion";
import { FiLogOut } from "react-icons/fi";
import { supabase } from "../lib/supabase";

const LogoutButton = () => {
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Error logging out:", error);
      else window.location.href = "/authenticate";
    } catch (error) {
      console.error("An unexpected error occurred:", error);
    }
  };

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, delay: 0.3 }}
      className="self-start ml-4 flex items-center justify-center  mt-4"
    >
      <motion.button
        whileHover={{
          scale: 1.1,
          backgroundColor: "#FF4C4C",
          color: "#FFF",
        }}
        whileTap={{ scale: 0.95 }}
        onClick={handleLogout}
        className="flex items-center gap-2 px-4 py-2  text-white rounded-full shadow-md hover:shadow-lg transition duration-300 ease-in-out"
      >
        <FiLogOut className="text-xl" />
        <span className="text-sm font-semibold">Sign out</span>
      </motion.button>
    </motion.div>
  );
};

export default LogoutButton;
