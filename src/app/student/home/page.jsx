"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import {
	FaUser,
	FaSignOutAlt,
	FaTrophy,
	FaHistory,
	FaPlay,
	FaChartBar,
} from "react-icons/fa";

const StudentHome = () => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const getUser = async () => {
			try {
				const {
					data: { user },
				} = await supabase.auth.getUser();
				if (!user) {
					router.push("/authenticate");
					return;
				}

				// Check if user is actually a student
				const { data: profile } = await supabase
					.from("users_profile")
					.select("role, name, email")
					.eq("id", user.id)
					.single();

				if (profile?.role !== "student") {
					router.push("/authenticate");
					return;
				}

				setUser({ ...user, ...profile });
			} catch (error) {
				console.error("Error fetching user:", error);
				router.push("/authenticate");
			} finally {
				setLoading(false);
			}
		};

		getUser();
	}, [router]);

	const handleSignOut = async () => {
		await supabase.auth.signOut();
		router.push("/");
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
			{/* Header */}
			<header className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-4">
						<div className="flex items-center space-x-3">
							<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
								<FaUser className="text-white" />
							</div>
							<div>
								<h1 className="text-xl font-semibold text-gray-900">
									Welcome, {user?.name || "Student"}!
								</h1>
								<p className="text-sm text-gray-500">{user?.email}</p>
							</div>
						</div>
						<button
							onClick={handleSignOut}
							className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
							<FaSignOutAlt />
							<span>Sign Out</span>
						</button>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Welcome Section */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-center mb-8">
					<h2 className="text-3xl font-bold text-gray-900 mb-4">
						Ready to Test Your Knowledge?
					</h2>
					<p className="text-lg text-gray-600 max-w-2xl mx-auto">
						Choose a quiz category and start learning. Track your progress and
						improve your scores!
					</p>
				</motion.div>

				{/* Quiz Categories */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
					{[
						{
							title: "Yaya Quiz",
							description: "Test your knowledge with Yaya category questions",
							icon: "👶",
							path: "/quiz/yaya",
							color: "from-pink-500 to-rose-500",
						},
						{
							title: "Adults Quiz",
							description: "Challenge yourself with adult-level questions",
							icon: "👨‍💼",
							path: "/quiz/adults",
							color: "from-blue-500 to-indigo-500",
						},
						{
							title: "Teenagers Quiz",
							description: "Perfect for teenage learners",
							icon: "🎓",
							path: "/quiz/teenagers",
							color: "from-green-500 to-emerald-500",
						},
					].map((category, index) => (
						<motion.div
							key={category.title}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
							className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
							<div className={`h-2 bg-gradient-to-r ${category.color}`}></div>
							<div className="p-6">
								<div className="text-4xl mb-4">{category.icon}</div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">
									{category.title}
								</h3>
								<p className="text-gray-600 mb-4">{category.description}</p>
								<button
									onClick={() => router.push(category.path)}
									className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center space-x-2">
									<FaPlay size={14} />
									<span>Start Quiz</span>
								</button>
							</div>
						</motion.div>
					))}
				</div>

				{/* Quick Stats */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
					className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<div className="bg-white rounded-xl shadow-lg p-6">
						<div className="flex items-center space-x-3">
							<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
								<FaTrophy className="text-blue-600" />
							</div>
							<div>
								<p className="text-sm text-gray-500">Best Score</p>
								<p className="text-2xl font-bold text-gray-900">85%</p>
							</div>
						</div>
					</div>
					<div className="bg-white rounded-xl shadow-lg p-6">
						<div className="flex items-center space-x-3">
							<div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
								<FaHistory className="text-green-600" />
							</div>
							<div>
								<p className="text-sm text-gray-500">Quizzes Taken</p>
								<p className="text-2xl font-bold text-gray-900">12</p>
							</div>
						</div>
					</div>
					<div className="bg-white rounded-xl shadow-lg p-6">
						<div className="flex items-center space-x-3">
							<div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
								<FaChartBar className="text-purple-600" />
							</div>
							<div>
								<p className="text-sm text-gray-500">Average Score</p>
								<p className="text-2xl font-bold text-gray-900">78%</p>
							</div>
						</div>
					</div>
				</motion.div>

				{/* Recent Activity */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5 }}
					className="bg-white rounded-xl shadow-lg p-6">
					<h3 className="text-xl font-semibold text-gray-900 mb-4">
						Recent Activity
					</h3>
					<div className="space-y-3">
						{[
							{ quiz: "Adults Quiz", score: "85%", date: "2 hours ago" },
							{ quiz: "Yaya Quiz", score: "92%", date: "1 day ago" },
							{ quiz: "Teenagers Quiz", score: "78%", date: "3 days ago" },
						].map((activity, index) => (
							<div
								key={index}
								className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
								<div>
									<p className="font-medium text-gray-900">{activity.quiz}</p>
									<p className="text-sm text-gray-500">{activity.date}</p>
								</div>
								<div className="text-right">
									<p className="font-semibold text-green-600">
										{activity.score}
									</p>
								</div>
							</div>
						))}
					</div>
				</motion.div>
			</main>
		</div>
	);
};

export default StudentHome;
