"use client";

import { motion } from "framer-motion";

// component
import SelectTime from "../../../components/SelectTime";
import { supabase } from "../../../lib/supabase";
import { useEffect } from "react";

async function getUserData(user_email) {
  const { data, error } = await supabase
    .from("users_profile")
    .select("*")
    .eq("email", user_email);

  if (data) {
    console.log(data);
  } else {
    console.log(error);
  }
}
async function updateUserData(user_id, user_email) {
  console.log(user_id);
  console.log(user_email);

  const { data, error } = await supabase
    .from("users_profile")
    .update({ user_id: `${user_id}` })
    .eq("email", user_email)
    .select();
  if (data) {
    console.log(data);
  } else {
    console.log(error);
  }
}

const AdultIntroduction = () => {
  useEffect(() => {
    async function getUser() {
      const { data, error } = await supabase.auth.getUser();

      // const user_id = data.user.id;
      const user_email = data.user.email;

      // await updateUserData(user_id, user_email);
      // await getUserData(user_email);

      const { data: userData, error: userError } = await supabase
        .from("users_profile")
        .select("*")
        .eq("email", user_email);

      if (userData) {
        console.log(userData);
      } else {
        console.log(userError);
      }
    }

    getUser();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 pt-10">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold mb-6">Welcome to Adult Quiz</h1>
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

export default AdultIntroduction;
