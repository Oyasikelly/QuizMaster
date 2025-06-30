"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FiMail, FiSend, FiArrowLeft, FiShield } from "react-icons/fi";
import { supabase } from "../lib/supabase";

const ForgotPassword = () => {
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState("");
	const [errorMssg, setErrorMssg] = useState("");
	// const [successful, setSuccessful] = useState(false);

	const handleForgotPassword = async (e) => {
		e.preventDefault();

		const { data, error } = await supabase
			.from("users_profile")
			.select("email");

		if (data) {
			const userEmail = data.find((item) => email === item.email);
			if (!userEmail) {
				setTimeout(() => {
					setErrorMssg("");
				}, 2500);
				setErrorMssg("User account not found, try to signUp");
			} else {
				setTimeout(() => {
					setMessage("");
					setEmail("");
				}, 2500);
				setMessage(
					"A password reset link has been sent to your email address."
				);
				setErrorMssg("");

				// Reset User Password
				const { data, error } = await supabase.auth.resetPasswordForEmail(
					userEmail.email,
					{
						redirectTo:
							"https://quizmasterrccg.vercel.app/authenticate/forgotpassword/resetpassword",
					}
				);
				if (error) {
					console.error(error);
				}
			}
		} else {
			console.error(error);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 py-8">
			{/* Animated Background Elements */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
				<div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
				<div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
			</div>

			<motion.div
				initial={{ scale: 0.9, opacity: 0, y: 20 }}
				animate={{ scale: 1, opacity: 1, y: 0 }}
				transition={{ duration: 0.8, ease: "easeInOut" }}
				className="relative z-10 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/50">
				{/* Header */}
				<motion.div
					initial={{ y: -20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ duration: 0.6 }}
					className="text-center mb-8">
					<div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
						<FiShield className="w-8 h-8 text-white" />
					</div>
					<h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
						Reset Password
					</h2>
					<p className="text-gray-600">
						Enter your email to receive a secure reset link
					</p>
				</motion.div>

				{/* Messages */}
				{message && (
					<motion.div
						className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 rounded-2xl p-4 text-center mb-6"
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5 }}>
						<div className="flex items-center justify-center space-x-2">
							<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
							<span className="font-medium">{message}</span>
						</div>
					</motion.div>
				)}

				{errorMssg && (
					<motion.div
						className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-800 rounded-2xl p-4 text-center mb-6"
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5 }}>
						<div className="flex items-center justify-center space-x-2">
							<div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
							<span className="font-medium">{errorMssg}</span>
						</div>
					</motion.div>
				)}

				{/* Form */}
				<form
					onSubmit={handleForgotPassword}
					className="space-y-6">
					<motion.div
						initial={{ y: 10, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ duration: 0.6, delay: 0.1 }}
						className="relative group">
						<div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
						<div className="relative">
							<FiMail className="absolute top-4 left-4 text-xl text-gray-400 group-hover:text-blue-500 transition-colors" />
							<input
								type="email"
								placeholder="Enter your email address"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="w-full bg-white/80 backdrop-blur-sm text-gray-700 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 border border-gray-200/50"
							/>
						</div>
					</motion.div>

					<motion.button
						type="submit"
						className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 rounded-2xl flex items-center justify-center space-x-3 transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg"
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						initial={{ y: 10, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ duration: 0.6, delay: 0.2 }}>
						<FiSend className="text-lg" />
						<span>Send Reset Link</span>
					</motion.button>
				</form>

				{/* Footer */}
				<motion.div
					className="mt-8 text-center"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.6, delay: 0.3 }}>
					<div className="flex items-center justify-center space-x-2 text-gray-500 mb-4">
						<div className="w-8 h-px bg-gray-300"></div>
						<span className="text-sm">or</span>
						<div className="w-8 h-px bg-gray-300"></div>
					</div>

					<a
						href="/authenticate"
						className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300 group">
						<FiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
						<span>Back to Login</span>
					</a>
				</motion.div>
			</motion.div>
		</div>
	);
};

export default ForgotPassword;
