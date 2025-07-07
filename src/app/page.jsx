"use client";

import React, { useState, useEffect, useCallback } from "react";
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
	XCircle,
	CheckCircle,
	Sparkles,
} from "lucide-react";
import {
	FaUser,
	FaEnvelope,
	FaGraduationCap,
	FaLock,
	FaEye,
	FaEyeSlash,
	FaCrown,
	FaKey,
	FaBuilding,
} from "react-icons/fa";
import Footer from "../components/Footer";
import MenuBar from "../components/MenuBar";

export default function HomePage() {
	const [currentTextIndex, setCurrentTextIndex] = useState(0);
	const [userData, setUserData] = useState([]);
	const [name, setName] = useState({
		name: "",
	});

	// Authentication modal state
	const [showAuth, setShowAuth] = useState(false);
	const [isSigningUp, setIsSigningUp] = useState(true);
	const [showPassword, setShowPassword] = useState(false);
	const [showAdminCode, setShowAdminCode] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
		role: "student", // Default role
		adminCode: "",
		classname: "",
		denomination: "",
	});
	const [error, setError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const animatedTexts = [
		"Master Your Knowledge",
		"Challenge Your Mind",
		"Learn & Grow",
		"Test Your Skills",
	];

	useEffect(() => {
		async function getUser() {
			try {
				// First check if there's an active session
				const {
					data: { session },
					error: sessionError,
				} = await supabase.auth.getSession();

				if (sessionError) {
					console.error("Error getting session:", sessionError);
					return;
				}

				// If no session exists, user is not logged in
				if (!session) {
					console.log("No active session found");
					return;
				}

				const { data, error } = await supabase.auth.getUser();
				if (error) {
					console.error("Error getting user:", error);
					return;
				}

				const user_email = data?.user?.email;
				if (!user_email) {
					console.log("No user email found");
					return;
				}

				const { data: userData, error: userError } = await supabase
					.from("users_profile")
					.select("email, name, class, denomination")
					.eq("email", user_email);

				if (userError) {
					console.error("Error fetching user data:", userError);
					return;
				}

				if (userData && userData.length > 0) {
					setUserData(userData);
					const userName = userData[0]; // Get the first user
					if (userName && userName.name) {
						setName({
							name: userName.name,
						});
						console.log("User name set:", userName.name);
					}
				}
			} catch (error) {
				console.error("Error in getUser function:", error);
			}
		}

		getUser();

		// Set up auth state listener
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			console.log("Auth state changed:", event, session?.user?.email);

			if (event === "SIGNED_IN" && session) {
				// User signed in, fetch their data
				const user_email = session.user.email;
				if (user_email) {
					const { data: userData, error: userError } = await supabase
						.from("users_profile")
						.select("email, name, class, denomination")
						.eq("email", user_email);

					if (!userError && userData && userData.length > 0) {
						setUserData(userData);
						const userName = userData[0];
						if (userName && userName.name) {
							setName({ name: userName.name });
							console.log("User signed in:", userName.name);
						}
					}
				}
			} else if (event === "SIGNED_OUT") {
				// User signed out, clear data
				setUserData([]);
				setName({ name: "" });
				console.log("User signed out");
			}
		});

		// Cleanup subscription on unmount
		return () => subscription.unsubscribe();
	}, []);

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentTextIndex((prev) => (prev + 1) % animatedTexts.length);
		}, 3000);
		return () => clearInterval(interval);
	}, []);

	const toggleAuthModal = useCallback(() => {
		console.log("Toggle auth modal clicked!");
		setShowAuth((prev) => !prev);
	}, []);

	const handleChange = useCallback((e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));

		// Show admin code field when admin role is selected
		if (name === "role") {
			setShowAdminCode(value === "admin");
		}
	}, []);

	const handleSubmit = useCallback(
		async (e) => {
			e.preventDefault();
			setIsLoading(true);
			setError("");

			if (isSigningUp) {
				const {
					name,
					email,
					password,
					role,
					adminCode,
					classname,
					denomination,
				} = formData;

				// Validation
				if (!name || !email || !password) {
					setError("Name, email, and password are required.");
					setIsLoading(false);
					return;
				}

				if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
					setError("Invalid email format.");
					setIsLoading(false);
					return;
				}

				if (password.length < 6) {
					setError("Password must be at least 6 characters.");
					setIsLoading(false);
					return;
				}

				// Admin role validation
				if (role === "admin") {
					if (
						!adminCode ||
						adminCode !== process.env.NEXT_PUBLIC_ADMIN_INVITE_CODE
					) {
						setError(
							"Invalid admin invite code. Please contact your administrator."
						);
						setIsLoading(false);
						return;
					}
				}

				// Student role validation
				if (role === "student") {
					if (!classname || !denomination) {
						setError("Class and denomination are required for students.");
						setIsLoading(false);
						return;
					}
				}

				try {
					// Sign up with Supabase Auth
					const { data, error: signUpError } = await supabase.auth.signUp({
						email: email,
						password: password,
						options: {
							emailRedirectTo: "https://quizmasterrccg.vercel.app/authenticate",
						},
					});

					if (signUpError) {
						setError(signUpError.message);
						setIsLoading(false);
						return;
					}

					// Insert user profile with role
					const { error: profileError } = await supabase
						.from("users_profile")
						.insert([
							{
								id: data.user?.id,
								email: email,
								name: name,
								role: role,
								denomination: denomination || null,
								class: classname || null,
							},
						]);

					if (profileError) {
						setError(profileError.message);
						setIsLoading(false);
						return;
					}

					setSuccessMessage("Sign up successful! Please log in.");
					setError("");
					setFormData({
						name: "",
						email: "",
						password: "",
						role: "student",
						adminCode: "",
						classname: "",
						denomination: "",
					});
					setShowAdminCode(false);
					setIsSigningUp(false);
					setIsLoading(false);
				} catch (err) {
					setError("An error occurred. Please try again.");
					setIsLoading(false);
				}
			} else {
				// Login logic
				const { email, password } = formData;

				if (!email || !password) {
					setError("Email and password are required.");
					setIsLoading(false);
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
						setIsLoading(false);
						return;
					}

					// Get user profile to determine role and name
					const { data: profile } = await supabase
						.from("users_profile")
						.select("role, name, email, class, denomination")
						.eq("id", data.user.id)
						.single();

					// Set user data for display
					if (profile) {
						setUserData([profile]);
						setName({ name: profile.name });
					}

					// Redirect based on role
					if (profile?.role === "admin") {
						window.location.href = "/admin/dashboard";
					} else {
						window.location.href = "/student/dashboard";
					}
				} catch (err) {
					setError("An error occurred. Please try again.");
					setIsLoading(false);
				}
			}
		},
		[formData, isSigningUp]
	);

	const quizCategories = [
		// {
		// 	title: "Teenagers",
		// 	description: "Perfect for young minds exploring the world",
		// 	icon: <Users className="w-8 h-8" />,
		// 	color: "from-pink-500 to-purple-600",
		// 	bgColor: "bg-gradient-to-br from-pink-50 to-purple-50",
		// 	href: "/quiz/teenagers",
		// },
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
			<MenuBar />
			{/* Navigation */}
			<nav className="relative z-50 px-6 py-4">
				<div className="max-w-7xl mx-auto flex justify-between items-center">
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						className="flex items-center space-x-2 ">
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
						{name.name && (
							<div className="flex items-center space-x-3">
								<div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
									<span className="text-white text-sm font-medium">
										{name.name.charAt(0).toUpperCase()}
									</span>
								</div>
								<div className="text-right">
									<p className="text-sm font-medium text-gray-900">
										Welcome back,
									</p>
									<p className="text-sm text-gray-600">{name.name}</p>
								</div>
								<button
									onClick={async () => {
										await supabase.auth.signOut();
										setName({ name: "" });
										setUserData([]);
										window.location.reload();
									}}
									className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
									Sign Out
								</button>
							</div>
						)}
					</motion.div>
				</div>
			</nav>

			{/* Scrolling User Information */}
			{/* <div className="relative z-10 flex w-auto items-center gap-8 max-w-[80%] rounded-2xl overflow-hidden">
				{userData && userData.length > 0 && (
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
								className="flex flex-row w-auto items-center gap-6 px-6 py-4 text-gray-800 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl m-2">
								<div className="flex gap-2 items-center justify-start">
									<FaUser className="text-xl text-blue-500" />
									<span className="w-auto text-xl sm:text-lg font-semibold text-gray-800">
										{data?.name?.toUpperCase() || "User"}
									</span>
								</div>
								<div className="flex gap-2 items-center justify-start">
									<FaGraduationCap className="text-lg text-blue-500" />
									<span className="w-auto text-lg md:text-xl text-gray-800">
										{data?.class?.toUpperCase() || "Class"}
									</span>
								</div>
								<div className="flex gap-2 items-center justify-start">
									<FaEnvelope className="text-lg text-blue-500" />
									<span className="w-auto text-sm md:text-lg text-gray-700">
										{data?.email || "email@example.com"}
									</span>
								</div>
							</div>
						))}
					</motion.div>
				)}
			</div> */}

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
						{/* <h1 className="text-6xl md:text-8xl font-bold mb-6">
							<span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
								Quiz
							</span>
							<span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
								Master
							</span>
						</h1> */}

						<motion.div
							key={currentTextIndex}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							transition={{ duration: 0.5 }}
							className="text-2xl md:text-3xl font-medium text-gray-600 mb-8 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
							{animatedTexts[currentTextIndex]}
						</motion.div>

						<p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
							Discover a world of knowledge through interactive quizzes designed
							for every age group. Challenge yourself, track your progress, and
							become a true QuizMaster.
						</p>

						<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
							<motion.div
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}>
								<button
									onClick={toggleAuthModal}
									className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center space-x-2">
									<span>Start Your Journey</span>
									<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
								</button>
							</motion.div>

							<motion.div
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}>
								<Link href="/quiz/demo-quiz">
									<button className="px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center space-x-2">
										<Play className="w-5 h-5" />
										<span>Start Demo</span>
									</button>
								</Link>
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

					<div className="grid md:grid-cols-2 gap-8">
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
											{category.title.toUpperCase()}
										</h3>
										{/* <p className="text-gray-600 mb-6 leading-relaxed">
											{category.description}
										</p> */}
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
			{/* <section className="px-6 py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
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
					</motion.div>
				</div>
			</section> */}

			{/* Footer */}
			<Footer />

			{/* Authentication Modal */}
			{showAuth && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
						{/* Modal Header */}
						<div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
							<div className="flex items-center space-x-3">
								<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
									<Sparkles className="w-6 h-6 text-white" />
								</div>
								<div>
									<h2 className="text-xl font-semibold text-gray-900">
										{isSigningUp ? "Create Account" : "Welcome Back"}
									</h2>
									<p className="text-sm text-gray-500">
										{isSigningUp
											? "Join QuizMaster and start your learning journey"
											: "Sign in to continue your progress"}
									</p>
								</div>
							</div>
							<button
								onClick={toggleAuthModal}
								className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
								<XCircle size={20} />
							</button>
						</div>

						{/* Modal Content */}
						<div className="p-6">
							<form
								onSubmit={handleSubmit}
								className="space-y-4">
								{/* Role Selection (Sign Up Only) */}
								{isSigningUp && (
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.1 }}
										className="relative">
										<label className="block text-sm font-medium text-gray-700 mb-2">
											I am a...
										</label>
										<div className="grid grid-cols-2 gap-3">
											<label className="relative">
												<input
													type="radio"
													name="role"
													value="student"
													checked={formData.role === "student"}
													onChange={handleChange}
													className="sr-only peer"
												/>
												<div className="p-4 border-2 border-gray-200 rounded-xl cursor-pointer peer-checked:border-blue-500 peer-checked:bg-blue-50 transition-all">
													<div className="flex items-center space-x-3">
														<FaGraduationCap className="text-blue-500" />
														<div>
															<p className="font-medium text-gray-900">
																Student
															</p>
															<p className="text-xs text-gray-500">
																Take quizzes & learn
															</p>
														</div>
													</div>
												</div>
											</label>
											<label className="relative">
												<input
													type="radio"
													name="role"
													value="admin"
													checked={formData.role === "admin"}
													onChange={handleChange}
													className="sr-only peer"
												/>
												<div className="p-4 border-2 border-gray-200 rounded-xl cursor-pointer peer-checked:border-purple-500 peer-checked:bg-purple-50 transition-all">
													<div className="flex items-center space-x-3">
														<FaCrown className="text-purple-500" />
														<div>
															<p className="font-medium text-gray-900">Admin</p>
															<p className="text-xs text-gray-500">
																Manage & monitor
															</p>
														</div>
													</div>
												</div>
											</label>
										</div>
									</motion.div>
								)}

								{/* Name Field (Sign Up Only) */}
								{isSigningUp && (
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.2 }}
										className="relative">
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Full Name
										</label>
										<div className="relative">
											<FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
											<input
												type="text"
												name="name"
												value={formData.name}
												onChange={handleChange}
												className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
												placeholder="Enter your full name"
											/>
										</div>
									</motion.div>
								)}

								{/* Email Field */}
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: isSigningUp ? 0.3 : 0.1 }}
									className="relative">
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Email Address
									</label>
									<div className="relative">
										<FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
										<input
											type="email"
											name="email"
											value={formData.email}
											onChange={handleChange}
											className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
											placeholder="Enter your email"
										/>
									</div>
								</motion.div>

								{/* Password Field */}
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: isSigningUp ? 0.4 : 0.2 }}
									className="relative">
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Password
									</label>
									<div className="relative">
										<FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
										<input
											type={showPassword ? "text" : "password"}
											name="password"
											value={formData.password}
											onChange={handleChange}
											className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
											placeholder="Enter your password"
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
											{showPassword ? <FaEyeSlash /> : <FaEye />}
										</button>
									</div>
								</motion.div>

								{/* Admin Code Field (Sign Up Only) */}
								{isSigningUp && showAdminCode && (
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.5 }}
										className="relative">
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Admin Invite Code
										</label>
										<div className="relative">
											<FaKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
											<input
												type="text"
												name="adminCode"
												value={formData.adminCode}
												onChange={handleChange}
												className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
												placeholder="Enter admin invite code"
											/>
										</div>
										<p className="text-xs text-gray-500 mt-1">
											Contact your administrator for the invite code
										</p>
									</motion.div>
								)}

								{/* Student-specific fields (Sign Up Only) */}
								{isSigningUp && formData.role === "student" && (
									<>
										{/* Class Field */}
										<motion.div
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: 0.5 }}
											className="relative">
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Class
											</label>
											<select
												name="classname"
												value={formData.classname}
												onChange={handleChange}
												className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
												<option value="">Select your class</option>
												<option value="yaya">Yaya</option>
												<option value="adult">Adult</option>
												<option value="adults">Adults</option>
											</select>
										</motion.div>

										{/* Denomination Field */}
										<motion.div
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: 0.6 }}
											className="relative">
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Denomination
											</label>
											<div className="relative">
												<FaBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
												<input
													type="text"
													name="denomination"
													value={formData.denomination}
													onChange={handleChange}
													className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
													placeholder="Enter your denomination"
												/>
											</div>
										</motion.div>
									</>
								)}

								{/* Error Message */}
								{error && (
									<motion.div
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
										<XCircle size={16} />
										<span className="text-sm">{error}</span>
									</motion.div>
								)}

								{/* Success Message */}
								{successMessage && (
									<motion.div
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700">
										<CheckCircle size={16} />
										<span className="text-sm">{successMessage}</span>
									</motion.div>
								)}

								{/* Submit Button */}
								<motion.button
									type="submit"
									disabled={isLoading}
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									className={`w-full py-3 px-6 rounded-xl font-medium text-white transition-all ${
										isLoading
											? "bg-gray-400 cursor-not-allowed"
											: "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
									} flex items-center justify-center space-x-2`}>
									{isLoading ? (
										<>
											<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
											<span>Processing...</span>
										</>
									) : (
										<>
											<span>{isSigningUp ? "Create Account" : "Sign In"}</span>
											<ArrowRight size={16} />
										</>
									)}
								</motion.button>
							</form>

							{/* Toggle Auth Mode */}
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.7 }}
								className="text-center mt-6">
								<button
									onClick={() => {
										setIsSigningUp(!isSigningUp);
										setError("");
										setSuccessMessage("");
										setFormData({
											name: "",
											email: "",
											password: "",
											role: "student",
											adminCode: "",
											classname: "",
											denomination: "",
										});
										setShowAdminCode(false);
									}}
									className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
									{isSigningUp
										? "Already have an account? Sign In"
										: "Don't have an account? Sign Up"}
								</button>
							</motion.div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
