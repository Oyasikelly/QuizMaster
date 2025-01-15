"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaBible, FaPeopleArrows, FaRegSmileWink } from "react-icons/fa"; // Importing icons
import { Suspense } from "react";

const testimonials = [
  {
    quote:
      "QuizMaster helped me learn more about the Word and grow in my faith!",
    name: "John D.",
  },
  {
    quote: "A great way to test your knowledge of God's Word!",
    name: "Mary L.",
  },
  {
    quote:
      "I love how fun and interactive the quizzes are while keeping my focus on Christ.",
    name: "Samantha K.",
  },
];
const categories = [
  {
    name: "Kingdom Seekers",
    icon: <FaBible size={40} />,
    link: "/quiz/adults",
    color: "bg-blue-500 hover:bg-blue-600",
  },
  {
    name: "Faith Builders",
    icon: <FaPeopleArrows size={40} />,
    link: "/quiz/teenagers",
    color: "bg-green-500 hover:bg-green-600",
  },
  {
    name: "Young Disciples",
    icon: <FaRegSmileWink size={40} />,
    link: "/quiz/yaya",
    color: "bg-purple-500 hover:bg-purple-600",
  },
];
export default function Home() {
  return (
    <Suspense
      fallback={<div className="text-center text-white">Loading Quiz...</div>}
    >
      <motion.div
        className="min-h-screen bg-gradient-to-r from-blue-700 to-indigo-500 flex flex-col items-center justify-center text-center text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Header */}
        <motion.header
          className="m-8"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <h1 className="text-5xl font-bold">Welcome to QuizMaster</h1>
          <p className="text-lg mt-2">
            Test your knowledge and challenge yourself with the Word of God!
          </p>
          <p className="mt-4 text-xl italic">
            "Your word is a lamp to my feet and a light to my path." – Psalm
            119:105
          </p>
        </motion.header>

        {/* Categories */}
        <motion.main
          className="w-full max-w-3xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <section className="mb-12">
            <motion.h2
              className="text-3xl font-semibold text-gray-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.7 }}
            >
              Select a Quiz Category:
            </motion.h2>
            <div className="flex flex-wrap justify-center gap-8 mt-8">
              {categories.map((category, index) => (
                <motion.div
                  key={category.name}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-center"
                >
                  <Link
                    href={category.link}
                    className={`py-4 px-8 rounded-lg shadow-xl ${category.color} text-white font-medium flex items-center justify-center gap-4`}
                  >
                    {category.icon}
                    <span className="text-xl">{category.name}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Start Quiz Section */}
          <section className="mt-12">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/quiz"
                className="bg-yellow-400 text-gray-800 py-3 px-6 rounded-full shadow-lg hover:bg-yellow-500 font-medium"
              >
                Start Random Quiz
              </Link>
            </motion.div>
          </section>
        </motion.main>

        {/* Motivational Quote */}
        <motion.section
          className="bg-white text-gray-800 py-16 w-full mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
        >
          <motion.h2
            className="text-3xl font-bold text-center mb-6"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            "The fear of the Lord is the beginning of wisdom." – Proverbs 9:10
          </motion.h2>
          <motion.p
            className="text-xl text-center italic"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.4 }}
          >
            Let His Word guide you as you journey through the quizzes!
          </motion.p>
        </motion.section>

        {/* Testimonials Section */}
        <motion.section
          className="bg-gray-200 py-16 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
            What People Are Saying
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-10">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white text-black p-8 rounded-lg shadow-xl text-center"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 1.8 + index * 0.2 }}
              >
                <p className="italic mb-4">“{testimonial.quote}”</p>
                <h4 className="font-bold text-right">- {testimonial.name}</h4>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Footer */}
        <motion.footer
          className="mt-12 text-sm text-gray-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
        >
          <p>© 2025 QuizMaster. All rights reserved. Powered by His Word.</p>
        </motion.footer>
      </motion.div>
    </Suspense>
  );
}
