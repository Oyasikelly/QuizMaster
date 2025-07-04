"use client";

import React, { useState, useCallback } from "react";
import {
	FaUser,
	FaEnvelope,
	FaLock,
	FaChurch,
	FaEye,
	FaEyeSlash,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
	Brain,
	XCircle,
	ArrowRight,
	CheckCircle,
	Sparkles,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import LandingPage from "../../components/LandingPage";

const nameOfClasses = ["yaya", "adult"];

const AuthPage = () => {
	const [showAuth, setShowAuth] = useState(false);
	const [isSigningUp, setIsSigningUp] = useState(true);
	const [showPassword, setShowPassword] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
		classname: "",
		denomination: "",
	});
	const [error, setError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const toggleAuthModal = useCallback(() => {
		setShowAuth((prev) => !prev);
	}, []);

	const handleChange = useCallback((e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	}, []);

	const handleSubmit = useCallback(
		async (e) => {
			e.preventDefault();
			setIsLoading(true);

			if (isSigningUp) {
				const { name, email, password, classname, denomination } = formData;

				if (!name || !email || !password || !classname || !denomination) {
					setError("All fields are required.");
					setIsLoading(false);
					return;
				}
				if (!nameOfClasses.includes(classname)) {
					setError("Invalid class name");
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

				try {
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

					const { error: profileError } = await supabase
						.from("users_profile")
						.insert([
							{
								email: email,
								name: name,
								denomination: denomination,
								class: classname,
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
						classname: "",
						denomination: "",
					});
					setIsSigningUp(false);
					setIsLoading(false);
				} catch (err) {
					setError("An error occurred. Please try again.");
					setIsLoading(false);
				}
			} else {
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

					setSuccessMessage("Welcome back! Redirecting...");
					setError("");
					setIsLoading(false);
					router.push("/");
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
					{/* Enhanced Background with Animated Elements */}
					<div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
						{/* Animated Background Elements */}
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
							{/* Decorative Elements */}
							<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"></div>
							<div className="absolute top-4 right-4 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
							<div className="absolute bottom-4 left-4 w-2 h-2 bg-green-400 rounded-full animate-ping delay-1000"></div>

							<div className="relative p-6 sm:p-8 pb-4">
								{/* Enhanced Close Button */}
								<motion.button
									onClick={toggleAuthModal}
									whileHover={{ scale: 1.1, rotate: 90 }}
									whileTap={{ scale: 0.9 }}
									className="absolute top-4 right-4 w-12 h-12 bg-red-500/20 backdrop-blur-sm rounded-full flex items-center justify-center text-red-600 hover:bg-red-500/30 transition-all duration-300 border border-red-300/30 hover:border-red-400/50 group">
									<XCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
									<span className="sr-only">Cancel</span>
								</motion.button>

								{/* Enhanced Header */}
								<motion.div
									initial={{ opacity: 0, y: -20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.6, delay: 0.1 }}
									className="text-center mb-8">
									<h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
										{isSigningUp ? "Join QuizMaster" : "Welcome Back"}
									</h2>
									<p className="text-gray-600 text-sm font-medium">
										{isSigningUp
											? "Create your account and start learning"
											: "Sign in to continue your journey"}
									</p>
								</motion.div>

								{/* Enhanced Form */}
								<motion.form
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.6, delay: 0.2 }}
									onSubmit={handleSubmit}
									className="space-y-4">
									{isSigningUp && (
										<motion.div
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ duration: 0.5, delay: 0.3 }}
											className="space-y-2">
											{/* <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
												<FaUser className="w-4 h-4 text-blue-500" />
												Full Name
												<span className="text-red-500">*</span>
											</label> */}
											<div className="group relative">
												<div className="flex items-center bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 focus-within:bg-white focus-within:border-blue-400 focus-within:shadow-xl focus-within:scale-105">
													<FaUser className="w-5 h-5 text-blue-500 mr-3 group-focus-within:text-blue-600 transition-colors" />
													<input
														type="text"
														name="name"
														value={formData.name}
														onChange={handleChange}
														className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-500 text-sm font-medium"
														placeholder="Enter your full name"
														autoComplete="off"
													/>
												</div>
											</div>
										</motion.div>
									)}

									<motion.div
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{
											duration: 0.5,
											delay: isSigningUp ? 0.4 : 0.3,
										}}
										className="space-y-2">
										{/* <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
											<FaEnvelope className="w-4 h-4 text-blue-500" />
											Email Address
											<span className="text-red-500">*</span>
										</label> */}
										<div className="group relative">
											<div className="flex items-center bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 focus-within:bg-white focus-within:border-blue-400 focus-within:shadow-xl focus-within:scale-105">
												<FaEnvelope className="w-5 h-5 text-blue-500 mr-3 group-focus-within:text-blue-600 transition-colors" />
												<input
													type="email"
													name="email"
													value={formData.email.trim()}
													onChange={handleChange}
													className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-500 text-sm font-medium"
													placeholder="Enter your email address"
													autoComplete="off"
												/>
											</div>
										</div>
									</motion.div>

									{isSigningUp && (
										<motion.div
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ duration: 0.5, delay: 0.5 }}
											className="space-y-2">
											{/* <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
												<FaUser className="w-4 h-4 text-blue-500" />
												Class Name
												<span className="text-red-500">*</span>
											</label> */}
											<div className="group relative">
												<div className="flex items-center bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 focus-within:bg-white focus-within:border-blue-400 focus-within:shadow-xl focus-within:scale-105">
													<FaUser className="w-5 h-5 text-blue-500 mr-3 group-focus-within:text-blue-600 transition-colors" />
													<input
														type="text"
														name="classname"
														value={formData.classname.trim()}
														onChange={handleChange}
														className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-500 text-sm font-medium"
														placeholder="Enter class name. e.g, YAYA or Adult"
														autoComplete="off"
													/>
												</div>
											</div>
										</motion.div>
									)}

									{isSigningUp && (
										<motion.div
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ duration: 0.5, delay: 0.6 }}
											className="space-y-2">
											{/* <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
												<FaChurch className="w-4 h-4 text-blue-500" />
												Denomination
												<span className="text-red-500">*</span>
											</label> */}
											<div className="group relative">
												<div className="flex items-center bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 focus-within:bg-white focus-within:border-blue-400 focus-within:shadow-xl focus-within:scale-105">
													<FaChurch className="w-5 h-5 text-blue-500 mr-3 group-focus-within:text-blue-600 transition-colors" />
													<input
														type="text"
														name="denomination"
														value={formData.denomination.trim().toUpperCase()}
														onChange={handleChange}
														className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-500 text-sm font-medium"
														placeholder="Enter your denomination"
														autoComplete="off"
													/>
												</div>
											</div>
										</motion.div>
									)}

									<motion.div
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{
											duration: 0.5,
											delay: isSigningUp ? 0.7 : 0.4,
										}}
										className="space-y-2">
										{/* <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
											<FaLock className="w-4 h-4 text-blue-500" />
											Password
											<span className="text-red-500">*</span>
										</label> */}
										<div className="group relative">
											<div className="flex items-center bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 focus-within:bg-white focus-within:border-blue-400 focus-within:shadow-xl focus-within:scale-105">
												<FaLock className="w-5 h-5 text-blue-500 mr-3 group-focus-within:text-blue-600 transition-colors" />
												<input
													type={showPassword ? "text" : "password"}
													name="password"
													value={formData.password}
													onChange={handleChange}
													className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-500 text-sm font-medium"
													placeholder="Enter your password"
													autoComplete="off"
												/>
												<button
													type="button"
													onClick={() => setShowPassword(!showPassword)}
													className="text-gray-500 hover:text-gray-700 focus:outline-none">
													{showPassword ? (
														<FaEyeSlash className="w-4 h-4" />
													) : (
														<FaEye className="w-4 h-4" />
													)}
												</button>
											</div>
										</div>
									</motion.div>

									{error && (
										<motion.div
											initial={{ opacity: 0, scale: 0.9 }}
											animate={{ opacity: 1, scale: 1 }}
											className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
											<XCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
											{error}
										</motion.div>
									)}

									{successMessage && (
										<motion.div
											initial={{ opacity: 0, scale: 0.9 }}
											animate={{ opacity: 1, scale: 1 }}
											className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-sm">
											<CheckCircle className="w-5 h-5 flex-shrink-0 text-green-500" />
											{successMessage}
										</motion.div>
									)}

									<motion.button
										type="submit"
										disabled={isLoading}
										whileHover={{ scale: 1.02 }}
										whileTap={{ scale: 0.98 }}
										className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group">
										<div className="absolute inset-0 bg-gradient-to-r from-blue-400/50 to-purple-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
										{isLoading ? (
											<>
												<div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10"></div>
												<span className="relative z-10">
													{isSigningUp
														? "Creating Account..."
														: "Signing In..."}
												</span>
											</>
										) : (
											<>
												<span className="relative z-10">
													{isSigningUp ? "Create Account" : "Sign In"}
												</span>
												<ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
											</>
										)}
									</motion.button>
								</motion.form>
							</div>

							{/* Enhanced Footer */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.8 }}
								className="px-6 sm:px-8 pb-6 space-y-4 bg-white rounded-b-3xl">
								<div className="text-center">
									<p className="text-gray-600 text-sm">
										{isSigningUp
											? "Already have an account? "
											: "Don't have an account? "}
										<button
											onClick={() => {
												setIsSigningUp(!isSigningUp);
												setError("");
												setSuccessMessage("");
											}}
											className="text-blue-600 font-semibold hover:text-blue-700 transition-colors duration-300 underline decoration-blue-400 decoration-2 underline-offset-4 hover:decoration-blue-500">
											{isSigningUp ? "Sign In" : "Sign Up"}
										</button>
									</p>
								</div>

								<div className="text-center">
									<button
										onClick={toForgottenPage}
										className="text-gray-500 text-sm hover:text-gray-700 transition-colors duration-300 underline decoration-gray-400 decoration-1 underline-offset-4 hover:decoration-gray-600">
										Forgot your password?
									</button>
								</div>
							</motion.div>
						</motion.div>
					</div>
				</div>
			)}
		</div>
	);
};

export default AuthPage;
