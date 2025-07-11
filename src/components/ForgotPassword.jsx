"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FiMail, FiSend, FiArrowLeft, FiShield } from "react-icons/fi";
import { supabase } from "../lib/supabase";

const ForgotPassword = () => {
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState("");
	const [errorMssg, setErrorMssg] = useState("");

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
							"https://quizmasterofficial2024.vercel.app/authenticate/forgotpassword/resetpassword",
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
		<div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 relative px-4 py-8">
			<motion.div
				initial={{ scale: 0.9, opacity: 0, y: 20 }}
				animate={{ scale: 1, opacity: 1, y: 0 }}
				transition={{ duration: 0.8, ease: "easeInOut" }}
				className="w-full max-w-md mx-auto bg-white/90 rounded-3xl shadow-2xl p-8 border border-white/60">
				{/* Header */}
				<motion.div
					initial={{ y: -20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ duration: 0.6 }}
					className="text-center mb-8">
					<div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
						<FiShield className="w-10 h-10 text-white" />
					</div>
					<h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
						Reset Password
					</h2>
					<p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto">
						Enter your email to receive a secure reset link. We'll send you
						instructions to create a new password.
					</p>
				</motion.div>

				{/* Messages */}
				{message && (
					<motion.div
						className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 rounded-2xl p-6 text-center mb-8 shadow-lg"
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5 }}>
						<div className="flex items-center justify-center space-x-3">
							<div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
							<span className="font-semibold text-lg">{message}</span>
						</div>
					</motion.div>
				)}

				{errorMssg && (
					<motion.div
						className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-800 rounded-2xl p-6 text-center mb-8 shadow-lg"
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5 }}>
						<div className="flex items-center justify-center space-x-3">
							<div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
							<span className="font-semibold text-lg">{errorMssg}</span>
						</div>
					</motion.div>
				)}

				{/* Form */}
				<form
					onSubmit={handleForgotPassword}
					className="space-y-8">
					<motion.div
						initial={{ y: 10, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ duration: 0.6, delay: 0.1 }}
						className="relative group">
						<label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
							<FiMail className="w-4 h-4 text-blue-500" />
							Email Address
							<span className="text-red-500">*</span>
						</label>
						<div className="relative">
							<div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
							<div className="relative">
								<FiMail className="absolute top-4 left-4 text-xl text-gray-400 group-hover:text-blue-500 transition-colors" />
								<input
									type="email"
									placeholder="Enter your email address"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									className="w-full bg-white/80 backdrop-blur-sm text-gray-700 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 border border-gray-200/50 text-lg"
								/>
							</div>
						</div>
					</motion.div>

					<motion.button
						type="submit"
						className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 rounded-2xl flex items-center justify-center space-x-3 transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg text-lg"
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						initial={{ y: 10, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ duration: 0.6, delay: 0.2 }}>
						<FiSend className="text-xl" />
						<span>Send Reset Link</span>
					</motion.button>
				</form>

				{/* Footer */}
				<motion.div
					className="mt-10 text-center"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.6, delay: 0.3 }}>
					<a
						href="/authenticate"
						className="inline-flex items-center space-x-3 text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-300 group text-lg">
						<FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
						<span>Back to Login</span>
					</a>
				</motion.div>
			</motion.div>
		</div>
	);
};

export default ForgotPassword;
