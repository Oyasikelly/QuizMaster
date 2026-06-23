"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import { QUIZ_CONFIG } from "../../../lib/quiz-config";
import {
	FaCog,
	FaSave,
	FaClock,
	FaQuestionCircle,
	FaLock,
	FaUnlock,
	FaPlay,
	FaStop,
	FaArrowLeft,
	FaDatabase,
	FaCheck,
	FaTimes,
} from "react-icons/fa";

export default function QuizSettingsAdmin() {
	const [settings, setSettings] = useState({
		is_active: false,
		time: 60,
		questions: 100,
		start_time: "",
		end_time: "",
		practice_mode: false, // New field for practice mode
	});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState("");
	const router = useRouter();

	useEffect(() => {
		const loadSettings = async () => {
			try {
				const { data, error } = await supabase
					.from("quiz_settings")
					.select("*")
					.single();

				if (error) {
					console.error("Error loading settings:", error);
					return;
				}

				if (data) {
					setSettings({
						is_active: data.is_active || false,
						time: data.time || 60,
						questions: data.questions || 100,
						start_time: data.start_time
							? new Date(data.start_time).toISOString().slice(0, 16)
							: "",
						end_time: data.end_time
							? new Date(data.end_time).toISOString().slice(0, 16)
							: "",
						practice_mode: data.practice_mode || false, // Load practice mode setting
					});
				}
			} catch (err) {
				console.error("Error:", err);
			} finally {
				setLoading(false);
			}
		};

		loadSettings();
	}, []);

	const handleSave = async () => {
		setSaving(true);
		setMessage("");

		try {
			const { error } = await supabase.from("quiz_settings").upsert({
				id: 1, // Assuming single row
				is_active: settings.is_active,
				time: settings.time,
				questions: settings.questions,
				start_time: settings.start_time,
				end_time: settings.end_time,
				practice_mode: settings.practice_mode, // Save practice mode setting
			});

			if (error) {
				setMessage(`Error: ${error.message}`);
			} else {
				setMessage("Settings saved successfully!");
			}
		} catch (err) {
			setMessage(`Error: ${err.message}`);
		} finally {
			setSaving(false);
		}
	};

	const handleBackToAdmin = () => {
		router.push("/admin/dashboard");
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading settings...</p>
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
								<FaCog className="text-white text-xl" />
							</div>
							<h1 className="text-3xl font-bold text-gray-900">
								Quiz Settings Admin
							</h1>
						</div>
					</div>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="bg-white rounded-xl shadow-lg p-6">
					<div className="space-y-6">
						{/* Mode Toggles Section */}
						<div className="space-y-6">
							<h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
								<FaDatabase className="text-purple-600" />
								Quiz Mode Settings
							</h2>

							{/* Real Quiz Mode Toggle */}
							<div className="bg-gray-50 rounded-lg p-4">
								<label className="flex items-center space-x-3">
									<input
										type="checkbox"
										checked={settings.is_active}
										onChange={(e) =>
											setSettings({ ...settings, is_active: e.target.checked })
										}
										className="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
									/>
									<div className="flex items-center gap-2">
										{settings.is_active ? (
											<FaLock className="text-red-500" />
										) : (
											<FaUnlock className="text-gray-400" />
										)}
										<span className="font-semibold text-gray-900">
											Enable Real Quiz Mode
										</span>
									</div>
								</label>
								<p className="text-sm text-gray-600 mt-2 ml-8">
									When enabled, students can take the real quiz during the
									specified time period.
								</p>
							</div>

							{/* Practice Mode Toggle */}
							<div className="bg-gray-50 rounded-lg p-4">
								<label className="flex items-center space-x-3">
									<input
										type="checkbox"
										checked={settings.practice_mode}
										onChange={(e) =>
											setSettings({
												...settings,
												practice_mode: e.target.checked,
											})
										}
										className="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
									/>
									<div className="flex items-center gap-2">
										{settings.practice_mode ? (
											<FaPlay className="text-green-500" />
										) : (
											<FaStop className="text-gray-400" />
										)}
										<span className="font-semibold text-gray-900">
											Enable Practice Mode
										</span>
									</div>
								</label>
								<p className="text-sm text-gray-600 mt-2 ml-8">
									When enabled, students can practice when real quiz is not
									active. When disabled, only real quiz mode is available.
								</p>
							</div>
						</div>

						{/* Mode Status Display */}
						<div className="bg-purple-50 rounded-lg p-4">
							<h4 className="font-semibold mb-3 text-purple-800">
								Current Mode Status:
							</h4>
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium text-gray-600">
										Real Quiz Mode
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
											{settings.is_active ? "Enabled" : "Disabled"}
										</span>
									</div>
								</div>
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
						</div>

						{/* Quiz Configuration Section */}
						<div className="space-y-6">
							<h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
								<FaClock className="text-purple-600" />
								Quiz Configuration
							</h2>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium mb-2 text-gray-700">
										Time Limit (minutes)
									</label>
									<input
										type="number"
										value={settings.time}
										onChange={(e) =>
											setSettings({
												...settings,
												time: parseInt(e.target.value),
											})
										}
										className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium mb-2 text-gray-700">
										Question Count
									</label>
									<input
										type="number"
										value={settings.questions}
										onChange={(e) =>
											setSettings({
												...settings,
												questions: parseInt(e.target.value),
											})
										}
										className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium mb-2 text-gray-700">
										Start Time
									</label>
									<input
										type="datetime-local"
										value={settings.start_time}
										onChange={(e) =>
											setSettings({ ...settings, start_time: e.target.value })
										}
										className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium mb-2 text-gray-700">
										End Time
									</label>
									<input
										type="datetime-local"
										value={settings.end_time}
										onChange={(e) =>
											setSettings({ ...settings, end_time: e.target.value })
										}
										className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
									/>
								</div>
							</div>
						</div>

						{/* Message Display */}
						{message && (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								className={`p-4 rounded-lg ${
									message.includes("Error")
										? "bg-red-100 text-red-700 border border-red-200"
										: "bg-green-100 text-green-700 border border-green-200"
								}`}>
								{message}
							</motion.div>
						)}

						{/* Action Buttons */}
						<div className="flex gap-4 pt-4">
							<button
								onClick={handleSave}
								disabled={saving}
								className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 font-medium">
								<FaSave />
								{saving ? "Saving..." : "Save Settings"}
							</button>
							<button
								onClick={handleBackToAdmin}
								className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 font-medium">
								<FaArrowLeft />
								Back to Admin
							</button>
						</div>
					</div>
				</motion.div>

				{/* Additional Links */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="mt-8 text-center">
					<a
						href="/test-db"
						className="text-purple-600 hover:text-purple-700 hover:underline font-medium">
						View Database Test Page
					</a>
				</motion.div>
			</div>
		</div>
	);
}
