"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaBible, FaHandsHelping, FaCross, FaRegSmile } from "react-icons/fa";
import { AiOutlineArrowRight } from "react-icons/ai";
import { MdOutlineQuiz } from "react-icons/md";

const quotes = [
  "“An incredible way to deepen my faith and learn more about the Bible!”",
  "“It’s both fun and educational. Highly recommend it to my friends and family!”",
  "“This platform has been a blessing! I’ve grown spiritually and enjoyed every moment.”",
];
const features = [
  {
    icon: <FaBible className="text-indigo-700 text-5xl" />,
    title: "Deepen Your Faith",
    text: "Engage with thought-provoking biblical quizzes that inspire learning and reflection.",
  },
  {
    icon: <FaHandsHelping className="text-indigo-700 text-5xl" />,
    title: "Community Engagement",
    text: "Foster connections and create lasting bonds within a supportive community of believers.",
  },
  {
    icon: <MdOutlineQuiz className="text-indigo-700 text-5xl" />,
    title: "Exciting Challenges",
    text: "Experience interactive quizzes designed for individuals and groups.",
  },
  {
    icon: <FaRegSmile className="text-indigo-700 text-5xl" />,
    title: "Fun & Educational",
    text: "Enjoy learning scripture in an engaging and entertaining way.",
  },
];
const LandingPage = ({ toggleAuthModal }) => {
  return (
    <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 min-h-screen text-white flex flex-col">
      {/* Hero Section */}
      <header className="text-center py-16 px-6">
        <motion.h1
          className="text-5xl font-extrabold mb-6 drop-shadow-md"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          Welcome to the Ultimate Christian Quiz Platform
        </motion.h1>
        <p className="text-xl mb-6">
          Test your biblical knowledge, connect with fellow believers, and grow
          in faith while having fun.
        </p>
        <motion.button
          className="px-8 py-4 bg-white text-indigo-700 font-bold rounded-full shadow-lg hover:bg-gray-100 transition duration-300"
          onClick={toggleAuthModal}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          Get Started
          <AiOutlineArrowRight className="inline-block ml-3 text-2xl" />
        </motion.button>
      </header>

      {/* Core Features Section */}
      <section className="py-16 bg-white text-gray-800">
        <div className="container mx-auto px-8">
          <h2 className="text-center text-4xl font-bold mb-12 text-indigo-700">
            Why Choose Our Platform?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-indigo-100 rounded-lg p-6 shadow-lg text-center"
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                {feature.icon}
                <h3 className="text-2xl font-bold mt-6 text-indigo-700">
                  {feature.title}
                </h3>
                <p className="mt-4 text-gray-600">{feature.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonies Section */}
      <section className="py-16 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-700">
        <div className="container mx-auto px-8 text-center text-white">
          <h2 className="text-4xl font-bold mb-12">What People Are Saying</h2>
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            {quotes.map((quote, index) => (
              <blockquote
                key={index}
                className="bg-white text-indigo-800 rounded-lg p-6 shadow-md italic"
              >
                {quote}
              </blockquote>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-indigo-500 text-center">
        <h2 className="text-4xl font-extrabold text-white mb-8">
          Ready to Start Your Faith Journey?
        </h2>
        <motion.button
          className="px-8 py-4 bg-white text-indigo-700 font-bold rounded-full shadow-lg hover:bg-gray-100 transition duration-300"
          onClick={toggleAuthModal}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          Join Now
        </motion.button>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-gray-400 text-center">
        <p>© 2025 Christian Quiz Platform. All rights reserved.</p>
        <p>Developed with ❤️ by Kelly.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
