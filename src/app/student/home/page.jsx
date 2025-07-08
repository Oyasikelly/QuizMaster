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
import { Heart, Brain, ArrowRight } from "lucide-react";
import MenuBar from "../../../components/MenuBar";

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

				// Fetch class as well
				const { data: profile } = await supabase
					.from("users_profile")
					.select("role, name, email, class")
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

	// Quiz options based on class
	let quizOptions = [];
	if (user?.class?.toLowerCase() === "yaya") {
		quizOptions = [
			{
				title: "Yaya Quiz",
				description: "Specialized content for caregivers",
				icon: <Heart className="w-8 h-8" />,
				path: "/quiz/yaya",
				color: "from-green-500 to-emerald-600",
				bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
			},
		];
	} else if (
		user?.class?.toLowerCase() === "adult" ||
		user?.class?.toLowerCase() === "adults"
	) {
		quizOptions = [
			{
				title: "Adults Quiz",
				description: "Comprehensive knowledge for mature learners",
				icon: <Brain className="w-8 h-8" />,
				path: "/quiz/adults",
				color: "from-blue-500 to-cyan-600",
				bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
			},
		];
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
			{/* Header */}
			<MenuBar />

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
						{/* <div className="flex items-center space-x-4">
							<button
								onClick={() => router.push("/student/profile")}
								className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
								<FaUser />
								<span>Profile</span>
							</button>
						</div> */}
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<section className="relative px-6 py-20 overflow-hidden">
				<div className="max-w-7xl mx-auto text-center">
					{/* Animated Background Elements */}
					<div className="absolute inset-0 overflow-hidden">
						<div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
						<div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
						<div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
					</div>

					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						className="relative z-10">
						<h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
							Ready to Test Your Knowledge?
						</h2>
						<p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
							{quizOptions[0]?.description ||
								"Choose your quiz and start learning!"}
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
							{quizOptions.map((category, index) => (
								<motion.div
									key={category.title}
									initial={{ opacity: 0, y: 30 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.6, delay: index * 0.2 }}
									whileHover={{ y: -10, scale: 1.02 }}
									className="group">
									<button
										onClick={() => router.push(category.path)}
										className={`${category.bgColor} p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/50 backdrop-blur-sm flex flex-col items-center w-64`}>
										<div
											className={`w-16 h-16 bg-gradient-to-r ${category.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
											{category.icon}
										</div>
										<h3 className="text-2xl font-bold text-gray-800 mb-4">
											{category.title.toUpperCase()}
										</h3>
										<div className="flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform duration-300">
											<span>Start Quiz</span>
											<ArrowRight className="w-4 h-4 ml-2" />
										</div>
									</button>
								</motion.div>
							))}
						</div>
					</motion.div>
				</div>
			</section>
			{/* You can keep or redesign the stats and recent activity sections below as needed */}
		</div>
	);
};

export default StudentHome;
