"use client";

import { motion } from "framer-motion";
import { Suspense, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { FaUser, FaEnvelope, FaGraduationCap } from "react-icons/fa";

// component
import SelectTime from "../components/SelectTime";

const AdultIntroduction = ({ category }) => {
  const [userData, setUserData] = useState([]);

  useEffect(() => {
    async function getUser() {
      const { data, error } = await supabase.auth.getUser();
      const user_email = data?.user?.email;
      const { data: userData, error: userError } = await supabase
        .from("users_profile")
        .select("email, name, class, denomination") // Select multiple columns
        .eq("email", user_email);

      if (userData) setUserData(userData);
      if (userError) console.error(userError);
    }

    getUser();
  }, []);

  return (
    <div className="flex flex-col items-center pt-10 min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 text-white px-4 sm:px-8 py-6">
      {/* Scrolling User Information */}
      <div className="flex w-auto items-center gap-8 max-w-[80%] rounded-[0.5rem] overflow-hidden">
        <motion.div
          className="w-auto overflow-hidden mb-6"
          initial={{ x: "100%" }}
          animate={{ x: "-100%" }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {userData.map((data, index) => (
            <div
              key={index}
              className="flex flex-col lg:flex-row w-auto items-center gap-6 px-6 py-2 text-white  bg-opacity-20 rounded-lg "
            >
              <div className="flex gap-2 items-center justify-start">
                <FaUser className="text-xl text-yellow-300" />
                <span className="w-auto text-xl sm:text-lg font-semibold">
                  {data.name.toUpperCase()}
                </span>
              </div>
              <div className="flex gap-2 items-center justify-start">
                <FaGraduationCap className="text-lg text-yellow-300" />
                <span className="w-auto text-lg md:text-xl">
                  {data.class.toUpperCase()}
                </span>
              </div>
              <div className="flex gap-2 items-center justify-start">
                <FaEnvelope className="text-lg text-yellow-300" />
                <span className="w-auto text-sm md:text-lg">{data.email}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-4xl w-full"
      >
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4">
          Welcome to <span className="text-yellow-400">{category} Quiz</span>
        </h1>
        <p className="text-base md:text-lg lg:text-xl mb-6 leading-relaxed">
          This quiz tests your knowledge on various topics, from life
          experiences to Bible lessons, principles, and faith. Challenge your
          intellect and learn along the way!
        </p>
        <Suspense
          fallback={
            <div className="text-center text-white">Loading Quiz...</div>
          }
        >
          {SelectTime ? (
            <SelectTime />
          ) : (
            <div className="text-red-500">
              Unable to load the timer component.
            </div>
          )}
        </Suspense>
      </motion.div>
    </div>
  );
};

export default AdultIntroduction;
