"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const AuthPage = () => {
  const [isSigningUp, setIsSigningUp] = useState(true); // Toggle between Sign Up and Sign In
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [registeredUsers, setRegisteredUsers] = useState([]); // Store registered users
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    const { name, email, password } = formData;

    if (!name || !email || !password) {
      setError("All fields are required.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Invalid email format.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (registeredUsers.find((user) => user.email === email)) {
      setError("This email is already registered. Please sign in.");
      return;
    }

    setRegisteredUsers([...registeredUsers, { name, email, password }]);
    setSuccessMessage("Registration successful! Please sign in.");
    setError("");
    setFormData({ name: "", email: "", password: "" });
    setIsSigningUp(false);
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    const { email, password } = formData;

    if (!email || !password) {
      setError("Both email and password are required.");
      return;
    }

    const user = registeredUsers.find(
      (user) => user.email === email && user.password === password
    );
    if (!user) {
      setError("Invalid email or password.");
      return;
    }

    setSuccessMessage(`Welcome back, ${user.name}!`);
    setError("");
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
