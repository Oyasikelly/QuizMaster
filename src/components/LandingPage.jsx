"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
	Brain,
	Trophy,
	Clock,
	Users,
	Star,
	ArrowRight,
	Play,
	BookOpen,
	Target,
	Zap,
	Shield,
	Heart,
	Sparkles,
	Globe,
	Lightbulb,
	GraduationCap,
} from "lucide-react";
import QuizInstructions from "./QuizInstruction";
import Footer from "./Footer";

const quotes = [
	{
		text: "An incredible way to deepen my faith and learn more about the Bible!",
		author: "Sarah Johnson",
		role: "Youth Leader",
		rating: 5,
	},
	{
		text: "It's both fun and educational. Highly recommend it to my friends and family!",
		author: "Michael Chen",
		role: "Sunday School Teacher",
		rating: 5,
	},
	{
		text: "This platform has been a blessing! I've grown spiritually and enjoyed every moment.",
		author: "Maria Rodriguez",
		role: "Church Member",
		rating: 5,
	},
];

const features = [
	{
		icon: <BookOpen className="w-8 h-8" />,
		title: "Deepen Your Faith",
		description:
			"Engage with thought-provoking biblical quizzes that inspire learning and reflection.",
		color: "from-blue-500 to-cyan-600",
		bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
	},
	{
		icon: <Users className="w-8 h-8" />,
		title: "Community Engagement",
		description:
			"Foster connections and create lasting bonds within a supportive community of believers.",
		color: "from-pink-500 to-purple-600",
		bgColor: "bg-gradient-to-br from-pink-50 to-purple-50",
	},
	{
		icon: <Target className="w-8 h-8" />,
		title: "Exciting Challenges",
		description:
			"Experience interactive quizzes designed for individuals and groups.",
		color: "from-green-500 to-emerald-600",
		bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
	},
	{
		icon: <Heart className="w-8 h-8" />,
		title: "Fun & Educational",
		description:
			"Enjoy learning scripture in an engaging and entertaining way.",
		color: "from-orange-500 to-red-600",
		bgColor: "bg-gradient-to-br from-orange-50 to-red-50",
	},
];

const LandingPage = ({ toggleAuthModal }) => {
	const [currentTextIndex, setCurrentTextIndex] = useState(0);
	const animatedTexts = [
		"Deepen Your Faith",
		"Connect with Community",
		"Learn & Grow Together",
		"Test Your Knowledge",
	];

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentTextIndex((prev) => (prev + 1) % animatedTexts.length);
		}, 3000);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
			{/* Navigation */}
			<nav className="relative z-50 px-4 sm:px-6 py-3 sm:py-4">
				<div className="max-w-7xl mx-auto flex justify-between items-center">
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						className="flex items-center space-x-2">
						<div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
							<Brain className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
						</div>
						<span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
							QuizMaster
						</span>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						className="flex items-center space-x-2 sm:space-x-4">
						<button
							onClick={toggleAuthModal}
							className="px-4 py-2 sm:px-6 sm:py-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-700 hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base">
							Get Started
						</button>
					</motion.div>
				</div>
			</nav>

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
						<h1 className="text-6xl md:text-8xl font-bold mb-6">
							<span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
								Christian
							</span>
							<br />
							<span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
								Quiz Platform
							</span>
						</h1>

						<motion.div
							key={currentTextIndex}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							transition={{ duration: 0.5 }}
							className="text-2xl md:text-3xl font-medium text-gray-600 mb-8">
							{animatedTexts[currentTextIndex]}
						</motion.div>

						<p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
							Test your biblical knowledge, connect with fellow believers, and
							grow in faith while having fun. Experience the ultimate Christian
							learning platform.
						</p>

						<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
							<motion.div
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}>
								<button
									onClick={toggleAuthModal}
									className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center space-x-2">
									<span>Get Started</span>
									<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
								</button>
							</motion.div>

							<motion.div
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}>
								<button className="px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center space-x-2">
									<Play className="w-5 h-5" />
									<span>Watch Demo</span>
								</button>
							</motion.div>
						</div>
					</motion.div>
				</div>
			</section>

			{/* Features Section */}
			<section className="px-6 py-20">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						className="text-center mb-16">
						<h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
							Why Choose Our Platform?
						</h2>
						<p className="text-xl text-gray-600 max-w-2xl mx-auto">
							Experience the next generation of Christian learning with our
							innovative features
						</p>
					</motion.div>

					<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
						{features.map((feature, index) => (
							<motion.div
								key={feature.title}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: index * 0.1 }}
								whileHover={{ y: -10, scale: 1.02 }}
								className="group">
								<div
									className={`${feature.bgColor} p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/50 backdrop-blur-sm h-80 w-full flex flex-col justify-center`}>
									<div
										className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
										{feature.icon}
									</div>
									<h3 className="text-xl font-bold text-gray-800 mb-4">
										{feature.title}
									</h3>
									<p className="text-gray-600 leading-relaxed">
										{feature.description}
									</p>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Testimonials */}
			<section className="px-6 py-20 bg-gradient-to-r from-slate-50 to-blue-50">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						className="text-center mb-16">
						<h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
							What Our Community Says
						</h2>
						<p className="text-xl text-gray-600 max-w-2xl mx-auto">
							Join thousands of satisfied believers who have transformed their
							faith with QuizMaster
						</p>
					</motion.div>

					<div className="grid md:grid-cols-3 gap-8">
						{quotes.map((testimonial, index) => (
							<motion.div
								key={testimonial.author}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: index * 0.2 }}
								className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/50 h-80 w-full flex flex-col justify-between">
								<div className="flex items-center mb-4">
									{[...Array(testimonial.rating)].map((_, i) => (
										<Star
											key={i}
											className="w-5 h-5 text-yellow-400 fill-current"
										/>
									))}
								</div>
								<p className="text-gray-600 mb-6 leading-relaxed italic flex-grow">
									"{testimonial.text}"
								</p>
								<div>
									<p className="font-semibold text-gray-800">
										{testimonial.author}
									</p>
									<p className="text-gray-500">{testimonial.role}</p>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Call to Action Section */}
			<section className="px-6 py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
				<div className="max-w-4xl mx-auto text-center">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}>
						<h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
							Ready to Start Your Faith Journey?
						</h2>
						<p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
							Join our community of believers and start your journey towards
							spiritual growth today
						</p>

						<motion.div
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}>
							<button
								onClick={toggleAuthModal}
								className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-blue-600 rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300">
								<span>Join Now</span>
								<ArrowRight className="w-5 h-5" />
							</button>
						</motion.div>

						<div className="mt-16">
							<QuizInstructions />
						</div>
					</motion.div>
				</div>
			</section>

			{/* Footer */}
			<Footer />
		</div>
	);
};

export default LandingPage;
