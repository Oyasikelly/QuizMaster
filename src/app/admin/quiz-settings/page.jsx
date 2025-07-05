"use client";

import { useState, useEffect } from "react";
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
} from "react-icons/fa";

export default function QuizSettingsAdmin() {
	const [settings, setSettings] = useState({
		is_active: false,
		time: 60,
		questions: 100,
		start_time: "",
		end_time: "",
	});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState("");

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

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p>Loading settings...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen p-8 bg-gray-50">
			<div className="max-w-2xl mx-auto">
				<h1 className="text-3xl font-bold mb-8">Quiz Settings Admin</h1>

				<div className="bg-white rounded-lg shadow-lg p-6">
					<div className="space-y-6">
						<div>
							<label className="flex items-center space-x-2">
								<input
									type="checkbox"
									checked={settings.is_active}
									onChange={(e) =>
										setSettings({ ...settings, is_active: e.target.checked })
									}
									className="rounded"
								/>
								<span className="font-semibold">Enable Real Quiz Mode</span>
							</label>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium mb-2">
									Time Limit (minutes)
								</label>
								<input
									type="number"
									value={settings.time}
									onChange={(e) =>
										setSettings({ ...settings, time: parseInt(e.target.value) })
									}
									className="w-full p-2 border rounded"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium mb-2">
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
									className="w-full p-2 border rounded"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium mb-2">
								Start Time
							</label>
							<input
								type="datetime-local"
								value={settings.start_time}
								onChange={(e) =>
									setSettings({ ...settings, start_time: e.target.value })
								}
								className="w-full p-2 border rounded"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium mb-2">End Time</label>
							<input
								type="datetime-local"
								value={settings.end_time}
								onChange={(e) =>
									setSettings({ ...settings, end_time: e.target.value })
								}
								className="w-full p-2 border rounded"
							/>
						</div>

						{message && (
							<div
								className={`p-3 rounded ${
									message.includes("Error")
										? "bg-red-100 text-red-700"
										: "bg-green-100 text-green-700"
								}`}>
								{message}
							</div>
						)}

						<button
							onClick={handleSave}
							disabled={saving}
							className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50">
							{saving ? "Saving..." : "Save Settings"}
						</button>
					</div>
				</div>

				<div className="mt-8">
					<a
						href="/test-db"
						className="text-blue-600 hover:underline">
						View Database Test Page
					</a>
				</div>
			</div>
		</div>
	);
}
