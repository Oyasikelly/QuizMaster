"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "../../../../lib/supabase";
import {
	FaUser,
	FaSignOutAlt,
	FaUsers,
	FaChartBar,
	FaTrophy,
	FaClipboardList,
	FaCog,
	FaBell,
	FaDownload,
	FaSearch,
	FaFilter,
	FaEye,
	FaEdit,
	FaTrash,
	FaCheck,
	FaTimes,
	FaArrowLeft,
	FaEnvelope,
	FaGraduationCap,
	FaChurch,
	FaCalendar,
	FaClock,
	FaChartLine,
	FaMedal,
	FaExclamationTriangle,
} from "react-icons/fa";

const withTimeout = (promise, ms) =>
	Promise.race([
		promise,
		new Promise((_, reject) =>
			setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
		),
	]);

const StudentDetail = () => {
	const [user, setUser] = useState(null);
	const [student, setStudent] = useState(null);
	const [quizResults, setQuizResults] = useState([]);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState(false);
	const router = useRouter();
	const params = useParams();

	const getUser = async () => {
		setLoading(true);
		setLoadError(false);
		try {
			// First check if there's an active session
			const {
				data: { session },
				error: sessionError,
			} = await withTimeout(supabase.auth.getSession(), 10000);

			if (sessionError) {
				console.error("Error getting session:", sessionError);
				router.push("/authenticate");
				return;
			}

			// If no session exists, user is not logged in
			if (!session) {
				console.log("No active session found");
				router.push("/authenticate");
				return;
			}

			const {
				data: { user },
			} = await withTimeout(supabase.auth.getUser(), 10000);
			if (!user) {
				router.push("/authenticate");
				return;
			}

			// Check if user is actually an admin
			const { data: profile } = await withTimeout(
				supabase
					.from("users_profile")
					.select("role, name, email")
					.eq("id", user.id)
					.single(),
				10000
			);

			if (profile?.role !== "admin") {
				router.push("/authenticate");
				return;
			}

			setUser({ ...user, ...profile });
			await loadStudentData();
		} catch (error) {
			console.error("Error fetching user:", error);
			if (
				error.message?.includes("timed out") ||
				error.message?.includes("fetch") ||
				error.message?.includes("network")
			) {
				setLoadError(true);
			} else {
				router.push("/authenticate");
			}
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		getUser();

		// Set up auth state listener
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			console.log("Auth state changed:", event, session?.user?.email);

			if (event === "SIGNED_OUT") {
				// User signed out, redirect to authenticate
				router.push("/authenticate");
			}
		});

		// Cleanup subscription on unmount
		return () => subscription.unsubscribe();
	}, [router]);

	const loadStudentData = async () => {
		try {
			const studentId = params.id;

			// Load student profile
			const { data: studentData, error: studentError } = await withTimeout(
				supabase
					.from("users_profile")
					.select("*")
					.eq("id", studentId)
					.single(),
				10000
			);

			if (studentError) {
				console.error("Error loading student:", studentError);
				router.push("/admin/dashboard");
				return;
			}

			// Load student's quiz results
			const { data: rawQuizData, error: quizError } = await withTimeout(
				supabase
					.from("quiz_results")
					.select("*")
					.eq("student_id", studentId)
					.order("timestamp", { ascending: false }),
				10000
			);

			if (quizError) {
				console.error("Error loading quiz results:", quizError);
			}

			const extractAttempts = (results) => {
				const attempts = [];
				(results || []).forEach((row) => {
					if (row.real_total > 0) attempts.push({ id: 1, student_id: row.student_id, timestamp: row.timestamp, score: row.real_score, total_questions: row.real_total, mode: "Real Quiz" });
					if (row.practice_normal_total > 0) attempts.push({ id: 2, student_id: row.student_id, timestamp: row.timestamp, score: row.practice_normal_score, total_questions: row.practice_normal_total, mode: "Practice (Normal)" });
					if (row.practice_medium_total > 0) attempts.push({ id: 3, student_id: row.student_id, timestamp: row.timestamp, score: row.practice_medium_score, total_questions: row.practice_medium_total, mode: "Practice (Medium)" });
					if (row.practice_hard_total > 0) attempts.push({ id: 4, student_id: row.student_id, timestamp: row.timestamp, score: row.practice_hard_score, total_questions: row.practice_hard_total, mode: "Practice (Hard)" });
					if (row.practice_entire_total > 0) attempts.push({ id: 5, student_id: row.student_id, timestamp: row.timestamp, score: row.practice_entire_score, total_questions: row.practice_entire_total, mode: "Practice (Entire Year)" });
				});
				return attempts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
			};

			setStudent(studentData);
			setQuizResults(extractAttempts(rawQuizData));
		} catch (error) {
			console.error("Error loading student data:", error);
			throw error; // Rethrow to let getUser handle network errors
		}
	};

	const handleSignOut = async () => {
		await supabase.auth.signOut();
		router.push("/");
	};

	const calculateStats = () => {
		if (!quizResults.length)
			return {
				totalQuizzes: 0,
				averageScore: 0,
				bestScore: 0,
				recentActivity: 0,
			};

		const totalQuizzes = quizResults.length;
		const averageScore = Math.round(
			quizResults.reduce(
				(sum, quiz) => sum + (quiz.score / quiz.total_questions) * 100,
				0
			) / totalQuizzes
		);
		const bestScore = Math.max(
			...quizResults.map((quiz) => (quiz.score / quiz.total_questions) * 100)
		);
		const recentActivity = quizResults.filter(
			(quiz) =>
				new Date(quiz.timestamp) >
				new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
		).length;

		return { totalQuizzes, averageScore, bestScore, recentActivity };
	};

	const stats = calculateStats();

	if (loadError) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
				<div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border border-gray-100">
					<FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
					<h2 className="text-2xl font-bold text-gray-800 mb-2">Network Error</h2>
					<p className="text-gray-600 mb-8 leading-relaxed">
						We couldn't connect to the server. Please check your internet connection and try again.
					</p>
					<button
						onClick={getUser}
						className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition-colors font-medium">
						Retry Connection
					</button>
				</div>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">Loading Student Details...</p>
				</div>
			</div>
		);
	}

	if (!student) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
				<div className="text-center">
					<FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
					<p className="text-gray-600">Student not found</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
			{/* Header */}
			<header className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-4">
						<div className="flex items-center space-x-3">
							<button
								onClick={() => router.push("/admin/dashboard")}
								className="p-2 text-gray-600 hover:text-gray-800 transition-colors">
								<FaArrowLeft size={20} />
							</button>
							<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
								<FaUser className="text-white" />
							</div>
							<div>
								<h1 className="text-xl font-semibold text-gray-900">
									Student Details
								</h1>
								<p className="text-sm text-gray-500">{student.name}</p>
							</div>
						</div>
						<div className="flex items-center space-x-4">
							<button
								onClick={() =>
									router.push(`/admin/settings?tab=students&edit=${student.id}`)
								}
								className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
								<FaEdit className="inline mr-2" />
								Edit Student
							</button>
							<button
								onClick={handleSignOut}
								className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
								<FaSignOutAlt />
								<span>Sign Out</span>
							</button>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Student Information */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="bg-white rounded-xl shadow-lg p-6 mb-8">
					<h2 className="text-xl font-semibold text-gray-900 mb-6">
						Student Information
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="space-y-4">
							<div className="flex items-center space-x-3">
								<FaUser className="text-blue-500" />
								<div>
									<p className="text-sm text-gray-500">Full Name</p>
									<p className="font-medium text-gray-900">{student.name}</p>
								</div>
							</div>
							<div className="flex items-center space-x-3">
								<FaEnvelope className="text-blue-500" />
								<div>
									<p className="text-sm text-gray-500">Email</p>
									<p className="font-medium text-gray-900">{student.email}</p>
								</div>
							</div>
							<div className="flex items-center space-x-3">
								<FaGraduationCap className="text-blue-500" />
								<div>
									<p className="text-sm text-gray-500">Class</p>
									<p className="font-medium text-gray-900">
										{student.class || "Not set"}
									</p>
								</div>
							</div>
							<div className="flex items-center space-x-3">
								<FaChurch className="text-blue-500" />
								<div>
									<p className="text-sm text-gray-500">Denomination</p>
									<p className="font-medium text-gray-900">
										{student.denomination || "Not set"}
									</p>
								</div>
							</div>
						</div>
						<div className="space-y-4">
							<div className="flex items-center space-x-3">
								<FaCalendar className="text-blue-500" />
								<div>
									<p className="text-sm text-gray-500">Member Since</p>
									<p className="font-medium text-gray-900">
										{new Date(student.created_at).toLocaleDateString()}
									</p>
								</div>
							</div>
							<div className="flex items-center space-x-3">
								<FaClipboardList className="text-blue-500" />
								<div>
									<p className="text-sm text-gray-500">
										Total Quiz Submissions
									</p>
									<p className="font-medium text-gray-900">
										{stats.totalQuizzes}
									</p>
								</div>
							</div>
							<div className="flex items-center space-x-3">
								<FaChartLine className="text-blue-500" />
								<div>
									<p className="text-sm text-gray-500">Average Score</p>
									<p className="font-medium text-gray-900">
										{stats.averageScore}%
									</p>
								</div>
							</div>
							<div className="flex items-center space-x-3">
								<FaMedal className="text-blue-500" />
								<div>
									<p className="text-sm text-gray-500">Best Score</p>
									<p className="font-medium text-gray-900">
										{stats.bestScore.toFixed(1)}%
									</p>
								</div>
							</div>
						</div>
					</div>
				</motion.div>

				{/* Performance Stats */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
					<div className="bg-white rounded-xl shadow-lg p-6">
						<div className="flex items-center space-x-3">
							<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
								<FaClipboardList className="text-blue-600" />
							</div>
							<div>
								<p className="text-sm text-gray-500">Total Quizzes</p>
								<p className="text-2xl font-bold text-gray-900">
									{stats.totalQuizzes}
								</p>
							</div>
						</div>
					</div>
					<div className="bg-white rounded-xl shadow-lg p-6">
						<div className="flex items-center space-x-3">
							<div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
								<FaChartLine className="text-green-600" />
							</div>
							<div>
								<p className="text-sm text-gray-500">Average Score</p>
								<p className="text-2xl font-bold text-gray-900">
									{stats.averageScore}%
								</p>
							</div>
						</div>
					</div>
					<div className="bg-white rounded-xl shadow-lg p-6">
						<div className="flex items-center space-x-3">
							<div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
								<FaMedal className="text-purple-600" />
							</div>
							<div>
								<p className="text-sm text-gray-500">Best Score</p>
								<p className="text-2xl font-bold text-gray-900">
									{stats.bestScore.toFixed(1)}%
								</p>
							</div>
						</div>
					</div>
					<div className="bg-white rounded-xl shadow-lg p-6">
						<div className="flex items-center space-x-3">
							<div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
								<FaClock className="text-orange-600" />
							</div>
							<div>
								<p className="text-sm text-gray-500">Recent Activity</p>
								<p className="text-2xl font-bold text-gray-900">
									{stats.recentActivity}
								</p>
							</div>
						</div>
					</div>
				</motion.div>

				{/* Quiz History */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="bg-white rounded-xl shadow-lg p-6">
					<div className="flex justify-between items-center mb-6">
						<h2 className="text-xl font-semibold text-gray-900">
							Quiz History
						</h2>
						<button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
							<FaDownload size={14} />
							<span>Export Results</span>
						</button>
					</div>

					{quizResults.length === 0 ? (
						<div className="text-center py-8">
							<FaClipboardList className="text-gray-400 text-4xl mx-auto mb-4" />
							<p className="text-gray-500">No quiz results found</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-gray-200">
										<th className="text-left py-3 px-4 font-medium text-gray-900">
											Date
										</th>
										<th className="text-left py-3 px-4 font-medium text-gray-900">
											Mode
										</th>
										<th className="text-left py-3 px-4 font-medium text-gray-900">
											Score
										</th>
										<th className="text-left py-3 px-4 font-medium text-gray-900">
											Questions
										</th>
										<th className="text-left py-3 px-4 font-medium text-gray-900">
											Percentage
										</th>
										<th className="text-left py-3 px-4 font-medium text-gray-900">
											Performance
										</th>
									</tr>
								</thead>
								<tbody>
									{quizResults.map((result) => {
										const percentage = Math.round(
											(result.score / result.total_questions) * 100
										);
										const performance =
											percentage >= 80
												? "Excellent"
												: percentage >= 60
												? "Good"
												: "Needs Improvement";

										return (
											<tr
												key={result.id}
												className="border-b border-gray-100 hover:bg-gray-50">
												<td className="py-3 px-4 text-gray-600">
													{new Date(result.timestamp).toLocaleDateString()}
												</td>
												<td className="py-3 px-4 font-medium text-gray-900">
													{result.mode}
												</td>
												<td className="py-3 px-4 text-gray-900">
													{result.score}/{result.total_questions}
												</td>
												<td className="py-3 px-4 text-gray-600">
													{result.total_questions}
												</td>
												<td className="py-3 px-4">
													<span
														className={`px-2 py-1 rounded-full text-xs font-medium ${
															percentage >= 80
																? "bg-green-100 text-green-800"
																: percentage >= 60
																? "bg-yellow-100 text-yellow-800"
																: "bg-red-100 text-red-800"
														}`}>
														{percentage}%
													</span>
												</td>
												<td className="py-3 px-4">
													<span
														className={`px-2 py-1 rounded-full text-xs font-medium ${
															percentage >= 80
																? "bg-green-100 text-green-800"
																: percentage >= 60
																? "bg-yellow-100 text-yellow-800"
																: "bg-red-100 text-red-800"
														}`}>
														{performance}
													</span>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</motion.div>
			</main>
		</div>
	);
};

export default StudentDetail;
