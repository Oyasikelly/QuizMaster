"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
	Brain,
	Users,
	ArrowRight,
	Play,
	BookOpen,
	Target,
	Heart,
} from "lucide-react";
import Footer from "./Footer";
import Link from "next/link";
import { useRouter } from "next/navigation";

const features = [
	{
		icon: <BookOpen className="w-8 h-8" />,
		title: "Deepen Your Faith",
		description:
			"Engage with thought-provoking biblical quizzes that inspire learning and reflection.",
	},
	{
		icon: <Users className="w-8 h-8" />,
		title: "Community Engagement",
		description:
			"Foster connections and create lasting bonds within a supportive community of believers.",
	},
	{
		icon: <Target className="w-8 h-8" />,
		title: "Exciting Challenges",
		description:
			"Experience interactive quizzes designed for individuals and groups.",
	},
	{
		icon: <Heart className="w-8 h-8" />,
		title: "Fun & Educational",
		description:
			"Enjoy learning scripture in an engaging and entertaining way.",
	},
];

const animatedTexts = [
	"Deepen Your Faith",
	"Connect with Community",
	"Learn & Grow Together",
	"Test Your Knowledge",
];

const LandingPage = () => {
	const [currentTextIndex, setCurrentTextIndex] = useState(0);
	const router = useRouter();

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentTextIndex((prev) => (prev + 1) % animatedTexts.length);
		}, 3000);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className="min-h-screen bg-background">
			{/* Navigation */}
			<nav className="relative z-50 px-4 sm:px-6 py-3 sm:py-4">
				<div className="max-w-7xl mx-auto flex justify-between items-center">
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						className="flex items-center space-x-2">
						<div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center">
							<Brain className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
						</div>
						<span className="font-display text-lg sm:text-2xl font-bold text-gray-900">
							QuizMaster
						</span>
					</motion.div>
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						className="flex items-center space-x-2 sm:space-x-4">
						<Link
							href="/authenticate"
							className="px-4 py-2 sm:px-6 sm:py-2 bg-brand-600 text-white rounded-full hover:bg-brand-700 transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base font-medium">
							Get Started
						</Link>
					</motion.div>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="relative px-4 sm:px-6 py-16 sm:py-20 overflow-hidden">
				<div className="max-w-7xl mx-auto text-center">
					{/* Animated Background Elements */}
					<div className="absolute inset-0 overflow-hidden pointer-events-none">
						<div className="absolute top-20 left-10 w-72 h-72 bg-brand-400/20 rounded-full blur-3xl animate-pulse"></div>
						<div className="absolute top-40 right-20 w-96 h-96 bg-brand-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
						<div className="absolute bottom-20 left-1/3 w-80 h-80 bg-brand-200/30 rounded-full blur-3xl animate-pulse delay-2000"></div>
					</div>
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						className="relative z-10">
						<h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold mb-6 text-gray-900">
							Christian
							<br />
							<span className="bg-gradient-to-r from-brand-500 via-brand-600 to-brand-800 bg-clip-text text-transparent">
								Quiz Platform
							</span>
						</h1>
						<motion.div
							key={currentTextIndex}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							transition={{ duration: 0.5 }}
							className="text-xl sm:text-2xl md:text-3xl font-medium text-gray-600 mb-8">
							{animatedTexts[currentTextIndex]}
						</motion.div>
						<p className="text-base sm:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
							Test your biblical knowledge, connect with fellow believers, and
							grow in faith while having fun. Experience the ultimate Christian
							learning platform.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
							<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
								<Link
									href="/authenticate"
									className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 text-white rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl hover:bg-brand-700 transition-all duration-300">
									<span>Get Started</span>
									<ArrowRight className="w-5 h-5" />
								</Link>
							</motion.div>
							<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
								<Link
									href="/quiz/demo-quiz"
									className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-700 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl border border-gray-200 transition-all duration-300">
									<Play className="w-5 h-5" />
									<span>Start Demo</span>
								</Link>
							</motion.div>
						</div>
					</motion.div>
				</div>
			</section>

			{/* Features Section */}
			<section className="px-4 sm:px-6 py-16 sm:py-20">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.8 }}
						className="text-center mb-16">
						<h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-gray-900">
							Why Choose Our Platform?
						</h2>
						<p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
							Experience the next generation of Christian learning with our
							innovative features
						</p>
					</motion.div>
					<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
						{features.map((feature, index) => (
							<motion.div
								key={feature.title}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.6, delay: index * 0.1 }}
								whileHover={{ y: -8 }}
								className="group">
								<div className="bg-brand-50 p-6 sm:p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 border border-brand-100 h-full flex flex-col">
									<div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300">
										{feature.icon}
									</div>
									<h3 className="font-display text-xl font-bold text-gray-900 mb-3">
										{feature.title}
									</h3>
									<p className="text-gray-600 leading-relaxed">{feature.description}</p>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Call to Action Section */}
			<section className="px-4 sm:px-6 py-16 sm:py-20 bg-gradient-to-r from-brand-600 via-brand-700 to-brand-800">
				<div className="max-w-4xl mx-auto text-center">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.8 }}>
						<h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
							Ready to Start Your Faith Journey?
						</h2>
						<p className="text-lg sm:text-xl text-brand-100 mb-10 max-w-2xl mx-auto">
							Join our community of believers and start your journey towards
							spiritual growth today
						</p>
						<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
							<button
								onClick={() => router.push("/authenticate")}
								className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-brand-700 rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300">
								<span>Join Now</span>
								<ArrowRight className="w-5 h-5" />
							</button>
						</motion.div>
					</motion.div>
				</div>
			</section>

			<Footer />
		</div>
	);
};

export default LandingPage;
