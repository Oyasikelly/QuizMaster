"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function TestDB() {
	const [settings, setSettings] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

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

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p>Loading database settings...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-red-600 mb-4">
						Database Error
					</h1>
					<p className="text-gray-600">{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen p-8">
			<div className="max-w-2xl mx-auto">
				<h1 className="text-3xl font-bold mb-8">Database Test Results</h1>

				{settings && (
					<div className="bg-white rounded-lg shadow-lg p-6">
						<h2 className="text-xl font-semibold mb-4">Quiz Settings</h2>

						<div className="space-y-4">
							<div>
								<strong>Is Active:</strong> {settings.is_active ? "Yes" : "No"}
							</div>

							<div>
								<strong>Time Limit:</strong> {settings.time} minutes
							</div>

							<div>
								<strong>Question Count:</strong> {settings.questions}
							</div>

							<div>
								<strong>Start Time:</strong>{" "}
								{new Date(settings.start_time).toLocaleString()}
							</div>

							<div>
								<strong>End Time:</strong>{" "}
								{new Date(settings.end_time).toLocaleString()}
							</div>

							<div>
								<strong>Current Time:</strong> {new Date().toLocaleString()}
							</div>

							{settings.is_active &&
								settings.start_time &&
								settings.end_time && (
									<div>
										<strong>Quiz Status:</strong>{" "}
										{(() => {
											const now = new Date();
											const start = new Date(settings.start_time);
											const end = new Date(settings.end_time);

											if (now < start) {
												return "⏳ Quiz hasn't started yet";
											} else if (now > end) {
												return "⏰ Quiz period has ended";
											} else {
												return "🎯 Quiz is currently active";
											}
										})()}
									</div>
								)}
						</div>
					</div>
				)}

				<div className="mt-8">
					<button
						onClick={() => window.location.reload()}
						className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
						Refresh
					</button>
				</div>
			</div>
		</div>
	);
}
