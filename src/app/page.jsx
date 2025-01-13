import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <motion.div
      className="min-h-screen bg-gray-100 flex flex-col items-center justify-center text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Header */}
      <motion.header
        className="mb-8"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <h1 className="text-4xl font-bold text-blue-600">
          Welcome to QuizMaster
        </h1>
        <p className="text-gray-600 mt-2">
          Test your knowledge and challenge yourself!
        </p>
      </motion.header>

      {/* Categories */}
      <motion.main
        className="w-full max-w-3xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <section className="mb-8">
          <motion.h2
            className="text-2xl font-semibold text-gray-800"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Select a Quiz Category:
          </motion.h2>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {["Science", "History", "General Knowledge"].map(
              (category, index) => (
                <motion.div
                  key={category}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href={`/quiz/${category.toLowerCase()}`}>
                    <a
                      className={`py-2 px-4 rounded shadow ${
                        index === 0
                          ? "bg-blue-500 hover:bg-blue-600 text-white"
                          : index === 1
                          ? "bg-green-500 hover:bg-green-600 text-white"
                          : "bg-purple-500 hover:bg-purple-600 text-white"
                      }`}
                    >
                      {category}
                    </a>
                  </Link>
                </motion.div>
              )
            )}
          </div>
        </section>

        {/* Start Quiz */}
        <section className="mt-6">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Link href="/quiz">
              <a className="bg-yellow-500 text-white py-3 px-6 rounded shadow hover:bg-yellow-600 font-medium">
                Start Random Quiz
              </a>
            </Link>
          </motion.div>
        </section>
      </motion.main>

      {/* Footer */}
      <motion.footer
        className="mt-8 text-sm text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        <p>© 2025 QuizMaster. All rights reserved.</p>
      </motion.footer>
    </motion.div>
  );
}
