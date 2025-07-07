"use client";

import React, { useState, useCallback } from "react";
import {
	FaUser,
	FaEnvelope,
	FaLock,
	FaEye,
	FaEyeSlash,
	FaCrown,
	FaGraduationCap,
	FaKey,
	FaBuilding,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
	Brain,
	XCircle,
	ArrowRight,
	CheckCircle,
	Sparkles,
	Shield,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import LandingPage from "../../components/LandingPage";

const AuthPage = () => {
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
	const router = useRouter();

	// Admin invite code (you can change this or make it environment variable)
	const ADMIN_INVITE_CODE = "ADMIN2024";

	const toggleAuthModal = useCallback(() => {
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
					if (!adminCode || adminCode !== ADMIN_INVITE_CODE) {
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

					// Fetch user role and redirect accordingly
					const { data: userProfile, error: profileError } = await supabase
						.from("users_profile")
						.select("role")
						.eq("id", data.user.id)
						.single();

					if (profileError) {
						setError("Error fetching user profile.");
						setIsLoading(false);
						return;
					}

					setSuccessMessage("Welcome back! Redirecting...");
					setError("");
					setIsLoading(false);

					// Redirect based on role
					if (userProfile.role === "admin") {
						router.push("/admin/dashboard");
					} else {
						router.push("/student/home");
					}
				} catch (err) {
					setError("An error occurred. Please try again.");
					setIsLoading(false);
				}
			}
		},
		[isSigningUp, formData, router]
	);

	function toForgottenPage() {
		router.push("/authenticate/forgotpassword");
	}

	return (
		<div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
			<LandingPage toggleAuthModal={toggleAuthModal} />

			{showAuth && (
				<div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen p-4">
					{/* Enhanced Background */}
					<div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
						<div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
						<div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
						<div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
					</div>

					{/* Enhanced Modal */}
					<div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide">
						<motion.div
							initial={{ opacity: 0, scale: 0.9, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							transition={{ duration: 0.5 }}
							className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl overflow-hidden my-8 relative">
							<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"></div>
							<div className="absolute top-4 right-4 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
							<div className="absolute bottom-4 left-4 w-2 h-2 bg-green-400 rounded-full animate-ping delay-1000"></div>

							<div className="relative p-6 sm:p-8 pb-4">
								{/* Close Button */}
								<motion.button
									onClick={toggleAuthModal}
									whileHover={{ scale: 1.1, rotate: 90 }}
									whileTap={{ scale: 0.9 }}
									className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
									<XCircle size={24} />
								</motion.button>

								{/* Header */}
								<div className="text-center mb-8">
									<motion.div
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										transition={{ delay: 0.2 }}
										className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
										<Brain
											className="text-white"
											size={32}
										/>
									</motion.div>
									<h2 className="text-2xl font-bold text-gray-800 mb-2">
										{isSigningUp ? "Join QuizMaster" : "Welcome Back"}
									</h2>
									<p className="text-gray-600">
										{isSigningUp
											? "Create your account to start learning"
											: "Sign in to continue your journey"}
									</p>
								</div>

								{/* Form */}
								<form
									onSubmit={handleSubmit}
									className="space-y-4">
									{/* Role Selection (Sign Up Only) */}
									{isSigningUp && (
										<motion.div
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: 0.3 }}
											className="space-y-3">
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Select Role
											</label>
											<div className="grid grid-cols-2 gap-3">
												<label className="relative cursor-pointer">
													<input
														type="radio"
														name="role"
														value="student"
														checked={formData.role === "student"}
														onChange={handleChange}
														className="sr-only"
													/>
													<div
														className={`p-4 rounded-xl border-2 transition-all ${
															formData.role === "student"
																? "border-blue-500 bg-blue-50"
																: "border-gray-200 bg-white hover:border-gray-300"
														}`}>
														<div className="flex items-center space-x-3">
															<FaGraduationCap
																className={`text-xl ${
																	formData.role === "student"
																		? "text-blue-600"
																		: "text-gray-400"
																}`}
															/>
															<div>
																<div className="font-medium text-gray-900">
																	Student
																</div>
																<div className="text-sm text-gray-500">
																	Take quizzes and learn
																</div>
															</div>
														</div>
													</div>
												</label>
												<label className="relative cursor-pointer">
													<input
														type="radio"
														name="role"
														value="admin"
														checked={formData.role === "admin"}
														onChange={handleChange}
														className="sr-only"
													/>
													<div
														className={`p-4 rounded-xl border-2 transition-all ${
															formData.role === "admin"
																? "border-purple-500 bg-purple-50"
																: "border-gray-200 bg-white hover:border-gray-300"
														}`}>
														<div className="flex items-center space-x-3">
															<FaCrown
																className={`text-xl ${
																	formData.role === "admin"
																		? "text-purple-600"
																		: "text-gray-400"
																}`}
															/>
															<div>
																<div className="font-medium text-gray-900">
																	Admin
																</div>
																<div className="text-sm text-gray-500">
																	Manage and monitor
																</div>
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
											transition={{ delay: 0.4 }}
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
										transition={{ delay: isSigningUp ? 0.5 : 0.3 }}
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
										transition={{ delay: isSigningUp ? 0.6 : 0.4 }}
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
											transition={{ delay: 0.7 }}
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
												transition={{ delay: 0.7 }}
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
												transition={{ delay: 0.8 }}
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
												<span>
													{isSigningUp ? "Create Account" : "Sign In"}
												</span>
												<ArrowRight size={16} />
											</>
										)}
									</motion.button>
								</form>

								{/* Toggle Auth Mode */}
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.9 }}
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

								{/* Forgot Password Link */}
								{!isSigningUp && (
									<motion.div
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ delay: 1.0 }}
										className="text-center mt-4">
										<button
											onClick={toForgottenPage}
											className="text-gray-600 hover:text-gray-700 text-sm transition-colors">
											Forgot your password?
										</button>
									</motion.div>
								)}
							</div>
						</motion.div>
					</div>
				</div>
			)}
		</div>
	);
};

export default AuthPage;
