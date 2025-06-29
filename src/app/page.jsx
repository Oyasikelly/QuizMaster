"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
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
} from "lucide-react";
import Footer from "../components/Footer";

export default function HomePage() {
	const [currentTextIndex, setCurrentTextIndex] = useState(0);
	const [userData, setUserData] = useState([]);
	const [name, setName] = useState({
		name: "",
	});
	const animatedTexts = [
		"Master Your Knowledge",
		"Challenge Your Mind",
		"Learn & Grow",
		"Test Your Skills",
	];

	useEffect(() => {
		async function getUser() {
			const { data, error } = await supabase.auth.getUser();
			const user_email = data?.user?.email;
			const { data: userData, error: userError } = await supabase
				.from("users_profile")
				.select("email, name, class, denomination") // Select multiple columns
				.eq("email", user_email);

			if (userData) {
				setUserData(userData);

				const [userName, ...others] = userData;
				setName({
					name: userName.name,
				});
				console.log(name);
			}
			if (userError) console.error(userError);
		}

		getUser();
	}, []);

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentTextIndex((prev) => (prev + 1) % animatedTexts.length);
		}, 3000);
		return () => clearInterval(interval);
	}, []);

	const quizCategories = [
		{
			title: "Teenagers",
			description: "Perfect for young minds exploring the world",
			icon: <Users className="w-8 h-8" />,
			color: "from-pink-500 to-purple-600",
			bgColor: "bg-gradient-to-br from-pink-50 to-purple-50",
			href: "/quiz/teenagers",
		},
		{
			title: "Adults",
			description: "Comprehensive knowledge for mature learners",
			icon: <Brain className="w-8 h-8" />,
			color: "from-blue-500 to-cyan-600",
			bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
			href: "/quiz/adults",
		},
		{
			title: "Yaya",
			description: "Specialized content for caregivers",
			icon: <Heart className="w-8 h-8" />,
			color: "from-green-500 to-emerald-600",
			bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
			href: "/quiz/yaya",
		},
	];

	const features = [
		{
			icon: <Target className="w-6 h-6" />,
			title: "Smart Questions",
			description: "AI-powered questions that adapt to your skill level",
		},
		{
			icon: <Clock className="w-6 h-6" />,
			title: "Time Management",
			description: "Practice with timed quizzes to improve speed",
		},
		{
			icon: <Trophy className="w-6 h-6" />,
			title: "Progress Tracking",
			description: "Monitor your improvement with detailed analytics",
		},
		{
			icon: <Shield className="w-6 h-6" />,
			title: "Secure Platform",
			description: "Your data is protected with enterprise-grade security",
		},
	];

	const testimonials = [
		{
			name: "Sarah Johnson",
			role: "High School Student",
			content:
				"The teenager quizzes helped me prepare for my exams. Love the interactive format!",
			rating: 5,
		},
		{
			name: "Michael Chen",
			role: "Professional",
			content:
				"Great way to keep my mind sharp. The adult category has challenging questions.",
			rating: 5,
		},
		{
			name: "Maria Rodriguez",
			role: "Caregiver",
			content:
				"The Yaya section is perfect for my role. Very practical and informative.",
			rating: 5,
		},
	];

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
			{/* Navigation */}
			<nav className="relative z-50 px-6 py-4">
				<div className="max-w-7xl mx-auto flex justify-between items-center">
					{/* Scrolling User Information */}
					<div className="relative z-10 flex w-auto items-center gap-8 max-w-[80%] rounded-2xl overflow-hidden">
						<motion.div
							className="w-auto overflow-hidden mb-6"
							initial={{ x: "100%" }}
							animate={{ x: "-100%" }}
							transition={{
								duration: 15,
								repeat: Infinity,
								ease: "linear",
							}}>
							{userData.map((data, index) => (
								<div
									key={index}
									className="flex flex-col lg:flex-row w-auto items-center gap-6 px-6 py-4 text-gray-800 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl m-2">
									<div className="flex gap-2 items-center justify-start">
										<FaUser className="text-xl text-blue-500" />
										<span className="w-auto text-xl sm:text-lg font-semibold text-gray-800">
											{data.name.toUpperCase()}
										</span>
									</div>
									<div className="flex gap-2 items-center justify-start">
										<FaGraduationCap className="text-lg text-blue-500" />
										<span className="w-auto text-lg md:text-xl text-gray-800">
											{data.class.toUpperCase()}
										</span>
									</div>
									<div className="flex gap-2 items-center justify-start">
										<FaEnvelope className="text-lg text-blue-500" />
										<span className="w-auto text-sm md:text-lg text-gray-700">
											{data.email}
										</span>
									</div>
								</div>
							))}
						</motion.div>
					</div>
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						className="flex items-center space-x-2">
						<div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
							<Brain className="w-6 h-6 text-white" />
						</div>
						<span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
							QuizMaster
						</span>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						className="flex items-center space-x-4">
						<Link
							href="/authenticate"
							className="px-6 py-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-700 hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl">
							Get Started
						</Link>
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
								Quiz
							</span>
							<span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
								Master
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
							Discover a world of knowledge through interactive quizzes designed
							for every age group. Challenge yourself, track your progress, and
							become a true QuizMaster.
						</p>

						<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
							{/* <motion.div
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}>
								<Link
									href="/authenticate"
									className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center space-x-2">
									<span>Start Your Journey</span>
									<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
								</Link>
							</motion.div> */}

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

			{/* Quiz Categories */}
			<section className="px-6 py-20">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						className="text-center mb-16">
						<h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
							Choose Your Challenge
						</h2>
						<p className="text-xl text-gray-600 max-w-2xl mx-auto">
							Select from our carefully curated quiz categories designed for
							different age groups and interests
						</p>
					</motion.div>

					<div className="grid md:grid-cols-3 gap-8">
						{quizCategories.map((category, index) => (
							<motion.div
								key={category.title}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: index * 0.2 }}
								whileHover={{ y: -10, scale: 1.02 }}
								className="group">
								<Link href={category.href}>
									<div
										className={`${category.bgColor} p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/50 backdrop-blur-sm`}>
										<div
											className={`w-16 h-16 bg-gradient-to-r ${category.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
											{category.icon}
										</div>
										<h3 className="text-2xl font-bold text-gray-800 mb-4">
											{category.title}
										</h3>
										<p className="text-gray-600 mb-6 leading-relaxed">
											{category.description}
										</p>
										<div className="flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform duration-300">
											<span>Explore</span>
											<ArrowRight className="w-4 h-4 ml-2" />
										</div>
									</div>
								</Link>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="px-6 py-20 bg-gradient-to-r from-slate-50 to-blue-50">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						className="text-center mb-16">
						<h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
							Why Choose QuizMaster?
						</h2>
						<p className="text-xl text-gray-600 max-w-2xl mx-auto">
							Experience the next generation of learning with our innovative
							features
						</p>
					</motion.div>

					<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
						{features.map((feature, index) => (
							<motion.div
								key={feature.title}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: index * 0.1 }}
								className="text-center group">
								<div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
									{feature.icon}
								</div>
								<h3 className="text-xl font-bold text-gray-800 mb-4">
									{feature.title}
								</h3>
								<p className="text-gray-600 leading-relaxed">
									{feature.description}
								</p>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Testimonials */}
			<section className="px-6 py-20">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						className="text-center mb-16">
						<h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
							What Our Users Say
						</h2>
						<p className="text-xl text-gray-600 max-w-2xl mx-auto">
							Join thousands of satisfied learners who have transformed their
							knowledge with QuizMaster
						</p>
					</motion.div>

					<div className="grid md:grid-cols-3 gap-8">
						{testimonials.map((testimonial, index) => (
							<motion.div
								key={testimonial.name}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: index * 0.2 }}
								className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/50">
								<div className="flex items-center mb-4">
									{[...Array(testimonial.rating)].map((_, i) => (
										<Star
											key={i}
											className="w-5 h-5 text-yellow-400 fill-current"
										/>
									))}
								</div>
								<p className="text-gray-600 mb-6 leading-relaxed italic">
									"{testimonial.content}"
								</p>
								<div>
									<p className="font-semibold text-gray-800">
										{testimonial.name}
									</p>
									<p className="text-gray-500">{testimonial.role}</p>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="px-6 py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
				<div className="max-w-4xl mx-auto text-center">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}>
						<h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
							Ready to Become a QuizMaster?
						</h2>
						<p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
							Join our community of learners and start your journey towards
							knowledge mastery today
						</p>

						<motion.div
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}>
							<Link
								href="/authenticate"
								className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-blue-600 rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300">
								<span>Get Started Now</span>
								<ArrowRight className="w-5 h-5" />
							</Link>
						</motion.div>
					</motion.div>
				</div>
			</section>

			{/* Footer */}
			<Footer />
		</div>
	);
}
