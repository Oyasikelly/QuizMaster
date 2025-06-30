"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash, FaLock, FaShieldAlt } from "react-icons/fa";

const UpdatePasswordForm = ({ resetCode }) => {
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const router = useRouter();

	const handlePasswordUpdate = async (e) => {
		e.preventDefault();

		if (!password || !confirmPassword) {
			setError("Please fill in all fields.");
			return;
		}

		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}

		try {
			const { data, error: updateError } = await supabase.auth.updateUser({
				password,
				access_token: resetCode, // Pass the code to Supabase
			});

			if (data) {
				router.push("/authenticate");
				console.log(data);
			}
			if (updateError) {
				setError(updateError.message);
				return;
			}

			setMessage("Your password has been updated successfully.");
			setError("");
			setPassword("");
			setConfirmPassword("");
		} catch (err) {
			setError("An error occurred. Please try again.");
			console.log(err);
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
				className="relative z-10 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-lg border border-white/50"
				initial={{ scale: 0.8, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ duration: 0.5 }}>
				{/* Header */}
				<motion.div
					initial={{ y: -20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ duration: 0.6 }}
					className="text-center mb-8">
					<div className="w-20 h-20 bg-gradient-to-r from-green-600 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
						<FaShieldAlt className="w-10 h-10 text-white" />
					</div>
					<h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
						Set New Password
					</h2>
					<p className="text-gray-600 text-lg leading-relaxed">
						Create a strong password to secure your account
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

				{error && (
					<motion.div
						className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-800 rounded-2xl p-6 text-center mb-8 shadow-lg"
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5 }}>
						<div className="flex items-center justify-center space-x-3">
							<div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
							<span className="font-semibold text-lg">{error}</span>
						</div>
					</motion.div>
				)}

				<form
					onSubmit={handlePasswordUpdate}
					className="space-y-6">
					{/* New Password */}
					<motion.div
						initial={{ y: 10, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ duration: 0.6, delay: 0.1 }}
						className="space-y-2">
						<label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
							<FaLock className="w-4 h-4 text-green-500" />
							New Password
							<span className="text-red-500">*</span>
						</label>
						<div className="group relative">
							<div className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
							<div className="relative">
								<FaLock className="absolute top-4 left-4 text-xl text-gray-400 group-hover:text-green-500 transition-colors" />
								<input
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="w-full bg-white/80 backdrop-blur-sm text-gray-700 rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300 border border-gray-200/50 text-lg"
									placeholder="Enter new password"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors duration-200"
									aria-label={showPassword ? "Hide password" : "Show password"}>
									{showPassword ? (
										<FaEyeSlash className="w-5 h-5" />
									) : (
										<FaEye className="w-5 h-5" />
									)}
								</button>
							</div>
						</div>
					</motion.div>

					{/* Confirm Password */}
					<motion.div
						initial={{ y: 10, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ duration: 0.6, delay: 0.2 }}
						className="space-y-2">
						<label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
							<FaLock className="w-4 h-4 text-blue-500" />
							Confirm Password
							<span className="text-red-500">*</span>
						</label>
						<div className="group relative">
							<div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
							<div className="relative">
								<FaLock className="absolute top-4 left-4 text-xl text-gray-400 group-hover:text-blue-500 transition-colors" />
								<input
									type={showConfirmPassword ? "text" : "password"}
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									className="w-full bg-white/80 backdrop-blur-sm text-gray-700 rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 border border-gray-200/50 text-lg"
									placeholder="Confirm new password"
								/>
								<button
									type="button"
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
									aria-label={
										showConfirmPassword ? "Hide password" : "Show password"
									}>
									{showConfirmPassword ? (
										<FaEyeSlash className="w-5 h-5" />
									) : (
										<FaEye className="w-5 h-5" />
									)}
								</button>
							</div>
						</div>
					</motion.div>

					<motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						type="submit"
						className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-4 rounded-2xl flex items-center justify-center space-x-3 transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg text-lg"
						initial={{ y: 10, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ duration: 0.6, delay: 0.3 }}>
						<FaShieldAlt className="text-xl" />
						<span>Update Password</span>
					</motion.button>
				</form>
			</motion.div>
		</div>
	);
};

export default UpdatePasswordForm;
