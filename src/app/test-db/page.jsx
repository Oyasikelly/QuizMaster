"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabase";
import {
	FaArrowLeft,
	FaDatabase,
	FaClock,
	FaCheck,
	FaTimes,
	FaExclamationTriangle,
	FaRedo,
} from "react-icons/fa";

export default function TestDB() {
	const [settings, setSettings] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const router = useRouter();

	useEffect(() => {
		const checkSettings = async () => {
			try {
				console.log("🔍 Testing database connection...");

				// Get current time
				const now = new Date();
				console.log("🕐 Current time:", now.toISOString());

				// Fetch quiz settings
				const { data, error } = await supabase
					.from("quiz_settings")
					.select("*")
					.single();

				if (error) {
					console.error("❌ Database error:", error);
					setError(error.message);
					return;
				}

				console.log("📊 Quiz settings:", data);
				setSettings(data);

				// Check if quiz should be active
				if (data.is_active && data.start_time && data.end_time) {
					const startTime = new Date(data.start_time);
					const endTime = new Date(data.end_time);
					const isInRange = now >= startTime && now <= endTime;

					console.log("📅 Start time:", startTime.toISOString());
					console.log("📅 End time:", endTime.toISOString());
					console.log("⏰ Is in quiz range:", isInRange);
				}
			} catch (err) {
				console.error("❌ Error:", err);
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		checkSettings();
	}, []);

	const handleBackToAdmin = () => {
		router.push("/admin/dashboard");
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading database settings...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
				<div className="text-center max-w-md mx-auto">
					<div className="bg-white rounded-xl shadow-lg p-8">
						<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<FaExclamationTriangle className="text-red-600 text-2xl" />
						</div>
						<h1 className="text-2xl font-bold text-red-600 mb-4">
							Database Error
						</h1>
						<p className="text-gray-600 mb-6">{error}</p>
						<div className="flex gap-3 justify-center">
							<button
								onClick={() => window.location.reload()}
								className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
								<FaRedo />
								Refresh
							</button>
							<button
								onClick={handleBackToAdmin}
								className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2">
								<FaArrowLeft />
								Back to Admin
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
			<div className="max-w-4xl mx-auto p-8">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="flex items-center justify-between mb-8">
					<div className="flex items-center space-x-4">
						<div className="flex items-center space-x-3">
							<div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
								<FaDatabase className="text-white text-xl" />
							</div>
							<h1 className="text-3xl font-bold text-gray-900">
								Database Test Results
							</h1>
						</div>
					</div>
				</motion.div>

				{settings && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
						className="bg-white rounded-xl shadow-lg p-6 mb-6">
						<h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
							<FaDatabase className="text-purple-600" />
							Quiz Settings
						</h2>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Status Cards */}
							<div className="space-y-4">
								<div className="bg-gray-50 rounded-lg p-4">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium text-gray-600">
											Quiz Status
										</span>
										<div className="flex items-center gap-2">
											{settings.is_active ? (
												<FaCheck className="text-green-600" />
											) : (
												<FaTimes className="text-red-600" />
											)}
											<span
												className={`px-3 py-1 rounded-full text-xs font-semibold ${
													settings.is_active
														? "bg-green-100 text-green-800"
														: "bg-red-100 text-red-800"
												}`}>
												{settings.is_active ? "Active" : "Inactive"}
											</span>
										</div>
									</div>
								</div>

								<div className="bg-gray-50 rounded-lg p-4">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium text-gray-600">
											Practice Mode
										</span>
										<div className="flex items-center gap-2">
											{settings.practice_mode ? (
												<FaCheck className="text-green-600" />
											) : (
												<FaTimes className="text-red-600" />
											)}
											<span
												className={`px-3 py-1 rounded-full text-xs font-semibold ${
													settings.practice_mode
														? "bg-green-100 text-green-800"
														: "bg-red-100 text-red-800"
												}`}>
												{settings.practice_mode ? "Enabled" : "Disabled"}
											</span>
										</div>
									</div>
								</div>

								<div className="bg-gray-50 rounded-lg p-4">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium text-gray-600">
											Time Limit
										</span>
										<span className="text-lg font-semibold text-gray-900">
											{settings.time} minutes
										</span>
									</div>
								</div>

								<div className="bg-gray-50 rounded-lg p-4">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium text-gray-600">
											Question Count
										</span>
										<span className="text-lg font-semibold text-gray-900">
											{settings.questions}
										</span>
									</div>
								</div>
							</div>

							{/* Time Information */}
							<div className="space-y-4">
								<div className="bg-blue-50 rounded-lg p-4">
									<div className="flex items-center gap-2 mb-2">
										<FaClock className="text-blue-600" />
										<span className="text-sm font-medium text-blue-800">
											Time Schedule
										</span>
									</div>
									<div className="space-y-2">
										<div>
											<span className="text-xs text-blue-600">Start Time:</span>
											<p className="text-sm font-semibold text-gray-900">
												{new Date(settings.start_time).toLocaleString()}
											</p>
										</div>
										<div>
											<span className="text-xs text-blue-600">End Time:</span>
											<p className="text-sm font-semibold text-gray-900">
												{new Date(settings.end_time).toLocaleString()}
											</p>
										</div>
										<div>
											<span className="text-xs text-blue-600">
												Current Time:
											</span>
											<p className="text-sm font-semibold text-gray-900">
												{new Date().toLocaleString()}
											</p>
										</div>
									</div>
								</div>

								{settings.is_active &&
									settings.start_time &&
									settings.end_time && (
										<div className="bg-purple-50 rounded-lg p-4">
											<div className="flex items-center gap-2 mb-2">
												<FaClock className="text-purple-600" />
												<span className="text-sm font-medium text-purple-800">
													Quiz Status
												</span>
											</div>
											<div className="flex items-center gap-2">
												{(() => {
													const now = new Date();
													const start = new Date(settings.start_time);
													const end = new Date(settings.end_time);

													if (now < start) {
														return (
															<>
																<FaExclamationTriangle className="text-yellow-600" />
																<span className="text-sm font-semibold text-yellow-800">
																	⏳ Quiz hasn't started yet
																</span>
															</>
														);
													} else if (now > end) {
														return (
															<>
																<FaTimes className="text-red-600" />
																<span className="text-sm font-semibold text-red-800">
																	⏰ Quiz period has ended
																</span>
															</>
														);
													} else {
														return (
															<>
																<FaCheck className="text-green-600" />
																<span className="text-sm font-semibold text-green-800">
																	🎯 Quiz is currently active
																</span>
															</>
														);
													}
												})()}
											</div>
										</div>
									)}
							</div>
						</div>
					</motion.div>
				)}

				{/* Action Buttons */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="flex gap-4 justify-center">
					<button
						onClick={() => window.location.reload()}
						className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium">
						<FaRedo />
						Refresh Data
					</button>
					<button
						onClick={handleBackToAdmin}
						className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center gap-2 text-gray-700 hover:text-purple-600">
						<FaArrowLeft />
						Back to Admin
					</button>
				</motion.div>
			</div>
		</div>
	);
}
