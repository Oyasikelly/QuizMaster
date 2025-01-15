"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaUser, FaEnvelope, FaLock, FaChurch } from "react-icons/fa";
import { SiGoogleclassroom } from "react-icons/si";
import { useRouter } from "next/navigation";

import { supabase } from "../../lib/supabase";

const nameOfClasses = ["wisdom", "adult", "holiness", "teenager"];
const AuthPage = () => {
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

      const { error: profileError } = await supabase.from("profiles").insert([
        {
          email: email,
          name: name,
          denomination: denomination,
          class: classname,
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
      <motion.div
        className="bg-white text-black p-8 rounded-lg shadow-lg w-full max-w-md"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isSigningUp ? "Sign Up" : "Sign In"}
        </h2>

        <form
          onSubmit={isSigningUp ? handleSignUp : handleSignIn}
          className="flex flex-col gap-4"
        >
          {isSigningUp && (
            <div className="flex flex-col gap-2">
              <label className="text-gray-600">Name</label>
              <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-md shadow-sm">
                <FaUser className="text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-transparent outline-none w-full"
                  placeholder="Enter your name"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-gray-600">Email</label>
            <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-md shadow-sm">
              <FaEnvelope className="text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="bg-transparent outline-none w-full"
                placeholder="Enter your email"
              />
            </div>
          </div>
          {formData.email && formData.name && (
            <div className="flex flex-col gap-2">
              <label className="text-gray-600">Class name</label>
              <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-md shadow-sm">
                <SiGoogleclassroom className="text-gray-400" />
                <input
                  type="text"
                  name="classname"
                  value={formData.classname}
                  onChange={handleChange}
                  className="bg-transparent outline-none w-full"
                  placeholder="Enter your classname"
                />
              </div>
            </div>
          )}
          {formData.email && formData.name && formData.classname && (
            <div className="flex flex-col gap-2">
              <label className="text-gray-600">Denomination</label>
              <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-md shadow-sm">
                <FaChurch className="text-gray-400" />
                <input
                  type="text"
                  name="denomination"
                  value={formData.denomination}
                  onChange={handleChange}
                  className="bg-transparent outline-none w-full"
                  placeholder="Enter your denomination"
                />
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="text-gray-600">Password</label>
            <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-md shadow-sm">
              <FaLock className="text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="bg-transparent outline-none w-full"
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
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-2 rounded-md shadow-md font-semibold"
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
            className="text-blue-600 font-bold"
          >
            {isSigningUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
