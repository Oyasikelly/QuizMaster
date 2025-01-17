"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaUser, FaEnvelope, FaLock, FaChurch } from "react-icons/fa";
import { SiGoogleclassroom } from "react-icons/si";
import { useRouter } from "next/navigation";

import { supabase } from "../../lib/supabase";
import LandingPage from "../../components/LandingPage";

//update Users_id

async function updateUserProfile(user_id) {
  const { data, error } = await supabase
    .from("users_profile")
    .update("user_id", user_id)
    .eq("id", user_id)
    .select();

  if (error) {
    console.log(error);
  } else {
    console.log(data);
  }
}
const nameOfClasses = ["wisdom", "adult", "holiness", "teenager"];
const AuthPage = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    classname: "",
    denomination: "",
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();

  const toggleAuthModal = () => {
    setShowAuth((prev) => !prev);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    const { name, email, password, classname, denomination } = formData;

    if (!name || !email || !password || !classname || !denomination) {
      setError("All fields are required.");
      return;
    }
    if (!nameOfClasses.includes(formData.classname)) {
      setError("invalid class name");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email format.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    // console.log(formData);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("users_profile")
        .insert([
          {
            email: email,
            name: name,
            denomination: denomination,
            class: classname,
            user_id: profileData.user.id,
          },
        ]);
      if (profileError) {
        setError(profileError.message);
        return;
      }

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
      setSuccessMessage("Sign up successful! Please log in.");
      setError("");
      setFormData({
        name: "",
        email: "",
        password: "",
        classname: "",
        denomination: "",
      });
      setIsSigningUp(false);
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

      const user_id = data.user.id;

      await updateUserProfile(user_id);
      if (signInError) {
        setError(signInError.message);
        return;
      }

      setSuccessMessage(`Welcome back! Redirecting...`);
      setError("");
      router.push("/");
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="relative">
      <LandingPage toggleAuthModal={toggleAuthModal} />

      {showAuth && (
        <div className="fixed inset-0 flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4">
          <motion.div
            className="bg-white text-black p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-sm md:max-w-md lg:max-w-lg"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-end mb-4">
              <span
                onClick={toggleAuthModal}
                className="cursor-pointer text-gray-400 hover:text-gray-600 text-lg font-semibold"
              >
                ✕
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-bold mb-6 text-center">
              {isSigningUp ? "Sign Up" : "Sign In"}
            </h2>

            <form
              onSubmit={isSigningUp ? handleSignUp : handleSignIn}
              className="flex flex-col gap-4"
            >
              {isSigningUp && (
                <div className="flex flex-col gap-2">
                  <label className="text-gray-600 text-sm">Name</label>
                  <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-md shadow-sm">
                    <FaUser className="text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="bg-transparent outline-none w-full text-sm"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-gray-600 text-sm">Email</label>
                <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-md shadow-sm">
                  <FaEnvelope className="text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="bg-transparent outline-none w-full text-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {formData.email && formData.name && (
                <div className="flex flex-col gap-2">
                  <label className="text-gray-600 text-sm">Class Name</label>
                  <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-md shadow-sm">
                    <SiGoogleclassroom className="text-gray-400" />
                    <input
                      type="text"
                      name="classname"
                      value={formData.classname.toLocaleLowerCase()}
                      onChange={handleChange}
                      className="bg-transparent outline-none w-full text-sm"
                      placeholder="Enter your class name"
                    />
                  </div>
                </div>
              )}

              {formData.email && formData.name && formData.classname && (
                <div className="flex flex-col gap-2">
                  <label className="text-gray-600 text-sm">Denomination</label>
                  <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-md shadow-sm">
                    <FaChurch className="text-gray-400" />
                    <input
                      type="text"
                      name="denomination"
                      value={formData.denomination}
                      onChange={handleChange}
                      className="bg-transparent outline-none w-full text-sm"
                      placeholder="Enter your denomination"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-gray-600 text-sm">Password</label>
                <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-md shadow-sm">
                  <FaLock className="text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-transparent outline-none w-full text-sm"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
              {successMessage && (
                <p className="text-green-500 text-sm">{successMessage}</p>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-2 rounded-md shadow-md font-semibold text-sm"
              >
                {isSigningUp ? "Sign Up" : "Sign In"}
              </motion.button>
            </form>

            <p className="text-center text-sm mt-4">
              {isSigningUp
                ? "Already have an account? "
                : "Don't have an account? "}
              <button
                onClick={() => setIsSigningUp(!isSigningUp)}
                className="text-blue-600 font-bold hover:underline"
              >
                {isSigningUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
