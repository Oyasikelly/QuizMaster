"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabase";
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
	FaHistory,
} from "react-icons/fa";
import {
	PieChart,
	Pie,
	Cell,
	Tooltip,
	Legend,
	LineChart,
	Line,
	XAxis,
	YAxis,
} from "recharts";

const AdminDashboard = () => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState({
		totalStudents: 0,
		totalQuizzes: 0,
		averageScore: 0,
		recentActivity: [],
	});
	const [students, setStudents] = useState([]);
	const [quizResults, setQuizResults] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterRole, setFilterRole] = useState("all");
	const [showStudentModal, setShowStudentModal] = useState(false);
	const [selectedStudent, setSelectedStudent] = useState(null);
	const [studentQuizResults, setStudentQuizResults] = useState([]);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editingStudent, setEditingStudent] = useState(null);
	const router = useRouter();

	useEffect(() => {
		const getUser = async () => {
			try {
				// First check if there's an active session
				const {
					data: { session },
					error: sessionError,
				} = await supabase.auth.getSession();

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
				} = await supabase.auth.getUser();
				if (!user) {
					router.push("/authenticate");
					return;
				}

				// Check if user is actually an admin
				const { data: profile } = await supabase
					.from("users_profile")
					.select("role, name, email")
					.eq("id", user.id)
					.single();

				if (profile?.role !== "admin") {
					router.push("/authenticate");
					return;
				}

				setUser({ ...user, ...profile });
				loadDashboardData();
			} catch (error) {
				console.error("Error fetching user:", error);
				router.push("/authenticate");
			} finally {
				setLoading(false);
			}
		};

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

	const loadDashboardData = async () => {
		try {
			// Load students
			const { data: studentsData } = await supabase
				.from("users_profile")
				.select("*")
				.eq("role", "student");

			// Only keep students in 'yaya' or 'adult' class (case-insensitive)
			const filteredStudentsData = (studentsData || []).filter((student) => {
				const cls = (student.class || "").toLowerCase();
				return cls === "yaya" || cls === "adult";
			});

			// Load quiz results
			const { data: quizData } = await supabase
				.from("quiz_results")
				.select("*")
				.order("timestamp", { ascending: false });

			// Calculate submission counts and quiz stats for each student (match by email)
			const studentsWithStats =
				filteredStudentsData?.map((student) => {
					const studentResults =
						quizData?.filter((result) => result.email === student.email) || [];

					const submissionCount = studentResults.length;
					let averageScore = 0,
						bestScore = 0,
						recentScore = 0;
					if (submissionCount > 0) {
						const scores = studentResults.map(
							(q) => (q.score / q.total_questions) * 100
						);
						averageScore = Math.round(
							scores.reduce((a, b) => a + b, 0) / scores.length
						);
						bestScore = Math.round(Math.max(...scores));
						recentScore = Math.round(
							(studentResults[0].score / studentResults[0].total_questions) *
								100
						);
					}
					return {
						...student,
						submissionCount,
						averageScore,
						bestScore,
						recentScore,
					};
				}) || [];

			// Calculate stats
			const totalStudents = studentsWithStats.length;
			const totalQuizzes =
				quizData?.filter((q) =>
					filteredStudentsData.some((s) => s.email === q.email)
				).length || 0;
			const filteredQuizData =
				quizData?.filter((q) =>
					filteredStudentsData.some((s) => s.email === q.email)
				) || [];
			const averageScore =
				filteredQuizData.length > 0
					? Math.round(
							filteredQuizData.reduce(
								(sum, quiz) => sum + (quiz.score / quiz.total_questions) * 100,
								0
							) / filteredQuizData.length
					  )
					: 0;

			setStudents(studentsWithStats);
			setQuizResults(filteredQuizData);
			setStats({
				totalStudents,
				totalQuizzes,
				averageScore,
				recentActivity: filteredQuizData.slice(0, 5) || [],
			});
		} catch (error) {
			console.error("Error loading dashboard data:", error);
		}
	};

	const handleSignOut = async () => {
		await supabase.auth.signOut();
		router.push("/");
	};

	const handleViewStudent = async (student) => {
		try {
			// Get detailed student quiz results
			const { data: studentResults, error } = await supabase
				.from("quiz_results")
				.select("*")
				.eq("email", student.email)
				.order("timestamp", { ascending: false });

			if (error) {
				console.error("Error fetching student results:", error);
				return;
			}

			setSelectedStudent(student);
			setStudentQuizResults(studentResults || []);
			setShowStudentModal(true);
		} catch (error) {
			console.error("Error viewing student:", error);
		}
	};

	const calculateStudentStats = (results) => {
		if (!results.length) {
			return {
				totalQuizzes: 0,
				averageScore: 0,
				bestScore: 0,
				worstScore: 0,
				recentActivity: 0,
				improvement: 0,
			};
		}

		const totalQuizzes = results.length;
		const scores = results.map(
			(quiz) => (quiz.score / quiz.total_questions) * 100
		);
		const averageScore = Math.round(
			scores.reduce((sum, score) => sum + score, 0) / totalQuizzes
		);
		const bestScore = Math.max(...scores);
		const worstScore = Math.min(...scores);

		// Calculate recent activity (last 7 days)
		const recentActivity = results.filter(
			(quiz) =>
				new Date(quiz.timestamp) >
				new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
		).length;

		// Calculate improvement (compare first and last quiz)
		const sortedResults = results.sort(
			(a, b) => new Date(a.timestamp) - new Date(b.timestamp)
		);
		const firstScore =
			(sortedResults[0].score / sortedResults[0].total_questions) * 100;
		const lastScore =
			(sortedResults[sortedResults.length - 1].score /
				sortedResults[sortedResults.length - 1].total_questions) *
			100;
		const improvement = Math.round(lastScore - firstScore);

		return {
			totalQuizzes,
			averageScore,
			bestScore: Math.round(bestScore),
			worstScore: Math.round(worstScore),
			recentActivity,
			improvement,
		};
	};

	const filteredStudents = students.filter((student) => {
		const matchesSearch =
			student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			student.email?.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesFilter = filterRole === "all" || student.role === filterRole;
		return matchesSearch && matchesFilter;
	});

	// Group students by class
	const classOrder = ["yaya", "Adult"];
	const groupedByClass = {};
	filteredStudents.forEach((student) => {
		const cls = (student.class || "Other").toLowerCase();
		if (!groupedByClass[cls]) groupedByClass[cls] = [];
		groupedByClass[cls].push(student);
	});
	const sortedClasses = [
		...classOrder.filter((c) => groupedByClass[c]),
		...Object.keys(groupedByClass)
			.filter((c) => !classOrder.includes(c))
			.sort(),
	];

	const handleEditStudent = (student) => {
		setEditingStudent({ ...student });
		setShowEditModal(true);
	};

	const handleEditChange = (e) => {
		const { name, value } = e.target;
		setEditingStudent((prev) => ({ ...prev, [name]: value }));
	};

	const handleSaveEdit = async () => {
		if (!editingStudent) return;
		try {
			const { error } = await supabase
				.from("users_profile")
				.update({
					name: editingStudent.name,
					email: editingStudent.email,
					class: editingStudent.class,
					denomination: editingStudent.denomination,
				})
				.eq("id", editingStudent.id);
			if (error) {
				alert("Error updating student: " + error.message);
				return;
			}
			setShowEditModal(false);
			setEditingStudent(null);
			await loadDashboardData();
			alert("Student updated successfully!");
		} catch (error) {
			console.error("Error updating student:", error);
			alert("Error updating student");
		}
	};

	const handleCancelEdit = () => {
		setShowEditModal(false);
		setEditingStudent(null);
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">Loading Admin Dashboard...</p>
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
							<div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
								<FaUser className="text-white" />
							</div>
							<div>
								<h1 className="text-xl font-semibold text-gray-900">
									Admin Dashboard
								</h1>
								<p className="text-sm text-gray-500">Welcome, {user?.name}</p>
							</div>
						</div>
						<div className="flex items-center space-x-4">
							<button className="p-2 text-gray-600 hover:text-gray-800 transition-colors">
								<FaBell size={20} />
							</button>
							<button
								onClick={() => router.push("/admin/settings")}
								className="p-2 text-gray-600 hover:text-gray-800 transition-colors">
								<FaCog size={20} />
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
				{/* Stats Overview */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<div className="bg-white rounded-xl shadow-lg p-6">
						<div className="flex items-center space-x-3">
							<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
								<FaUsers className="text-blue-600" />
							</div>
							<div>
								<p className="text-sm text-gray-500">Total Students</p>
								<p className="text-2xl font-bold text-gray-900">
									{stats.totalStudents}
								</p>
							</div>
						</div>
					</div>
					<div className="bg-white rounded-xl shadow-lg p-6">
						<div className="flex items-center space-x-3">
							<div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
								<FaClipboardList className="text-green-600" />
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
							<div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
								<FaChartBar className="text-purple-600" />
							</div>
							<div>
								<p className="text-sm text-gray-500">Average Score</p>
								<p className="text-2xl font-bold text-gray-900">
									{stats.averageScore}%
								</p>
							</div>
						</div>
					</div>
				</motion.div>

				{/* Student Management */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="bg-white rounded-xl shadow-lg p-6 mb-8">
					<div className="flex justify-between items-center mb-6">
						<h2 className="text-xl font-semibold text-gray-900">
							Student Management
						</h2>
						<div className="flex space-x-2">
							<div className="relative">
								<FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
								<input
									type="text"
									placeholder="Search students..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								/>
							</div>
							<select
								value={filterRole}
								onChange={(e) => setFilterRole(e.target.value)}
								className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
								<option value="all">All Roles</option>
								<option value="student">Students</option>
								<option value="admin">Admins</option>
							</select>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-gray-200">
									<th className="text-left py-3 px-4 font-medium text-gray-900">
										Name
									</th>
									<th className="text-left py-3 px-4 font-medium text-gray-900">
										Email
									</th>
									<th className="text-left py-3 px-4 font-medium text-gray-900">
										Class
									</th>
									<th className="text-left py-3 px-4 font-medium text-gray-900">
										Quiz Submissions
									</th>
									<th className="text-left py-3 px-4 font-medium text-gray-900">
										Avg Score
									</th>
									<th className="text-left py-3 px-4 font-medium text-gray-900">
										Best
									</th>
									<th className="text-left py-3 px-4 font-medium text-gray-900">
										Recent
									</th>
									<th className="text-left py-3 px-4 font-medium text-gray-900">
										Actions
									</th>
								</tr>
							</thead>
							<tbody>
								{sortedClasses.map((cls) => (
									<React.Fragment key={cls}>
										<tr key={`heading-${cls}`}>
											<td
												colSpan={8}
												className="bg-purple-50 text-purple-700 font-bold py-2 px-4 text-lg">
												{cls.charAt(0).toUpperCase() + cls.slice(1)}
											</td>
										</tr>
										{groupedByClass[cls].map((student) => (
											<tr
												key={`${cls}-${student.id}`}
												className="border-b border-gray-100 hover:bg-gray-50">
												<td className="py-3 px-4">
													<div className="flex items-center space-x-3">
														<div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
															<span className="text-white text-sm font-medium">
																{student.name?.charAt(0) || "U"}
															</span>
														</div>
														<span className="font-medium text-gray-900">
															{student.name}
														</span>
													</div>
												</td>
												<td className="py-3 px-4 text-gray-600">
													{student.email}
												</td>
												<td className="py-3 px-4">
													<span className="text-gray-600">
														{student.class || "Not set"}
													</span>
												</td>
												<td className="py-3 px-4">
													<span className="flex items-center space-x-2">
														<FaClipboardList className="text-blue-500" />
														<span className="font-medium text-gray-900">
															{student.submissionCount || 0}
														</span>
													</span>
												</td>
												<td className="py-3 px-4 text-blue-700 font-semibold">
													{student.averageScore || 0}%
												</td>
												<td className="py-3 px-4 text-green-700 font-semibold">
													{student.bestScore || 0}%
												</td>
												<td className="py-3 px-4 text-purple-700 font-semibold">
													{student.recentScore || 0}%
												</td>
												<td className="py-3 px-4">
													<div className="flex space-x-2">
														<button
															onClick={() => handleViewStudent(student)}
															className="p-1 text-blue-600 hover:text-blue-800">
															<FaEye size={14} />
														</button>
														<button
															onClick={() => handleEditStudent(student)}
															className="p-1 text-green-600 hover:text-green-800">
															<FaEdit size={14} />
														</button>
														<button
															onClick={() =>
																router.push(
																	`/admin/settings?tab=students&delete=${student.id}`
																)
															}
															className="p-1 text-red-600 hover:text-red-800">
															<FaTrash size={14} />
														</button>
													</div>
												</td>
											</tr>
										))}
									</React.Fragment>
								))}
							</tbody>
						</table>
					</div>
				</motion.div>

				{/* Quiz Results */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="bg-white rounded-xl shadow-lg p-6 mb-8">
					<div className="flex justify-between items-center mb-6">
						<h2 className="text-xl font-semibold text-gray-900">
							Recent Quiz Results
						</h2>
						<button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
							<FaDownload size={14} />
							<span>Export</span>
						</button>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-gray-200">
									<th className="text-left py-3 px-4 font-medium text-gray-900">
										Student
									</th>
									<th className="text-left py-3 px-4 font-medium text-gray-900">
										Email
									</th>
									<th className="text-left py-3 px-4 font-medium text-gray-900">
										Class
									</th>
									<th className="text-left py-3 px-4 font-medium text-gray-900">
										Score
									</th>
									<th className="text-left py-3 px-4 font-medium text-gray-900">
										Questions
									</th>
									<th className="text-left py-3 px-4 font-medium text-gray-900">
										Date
									</th>
									<th className="text-left py-3 px-4 font-medium text-gray-900">
										Actions
									</th>
								</tr>
							</thead>
							<tbody>
								{quizResults.map((result) => {
									const student = students.find(
										(s) => s.email === result.email
									);
									return (
										<tr
											key={`${result.email}-${result.timestamp}`}
											className="border-b border-gray-100 hover:bg-gray-50">
											<td className="py-3 px-4 text-gray-900">
												{student?.name || result.email}
											</td>
											<td className="py-3 px-4 text-gray-600">
												{result.email}
											</td>
											<td className="py-3 px-4 text-gray-600">
												{student?.class || "Not set"}
											</td>
											<td className="py-3 px-4">
												<span
													className={`px-2 py-1 rounded-full text-xs font-medium ${
														result.score / result.total_questions >= 0.8
															? "bg-green-100 text-green-800"
															: result.score / result.total_questions >= 0.6
															? "bg-yellow-100 text-yellow-800"
															: "bg-red-100 text-red-800"
													}`}>
													{Math.round(
														(result.score / result.total_questions) * 100
													)}
													%
												</span>
											</td>
											<td className="py-3 px-4 text-gray-600">
												{result.score}/{result.total_questions}
											</td>
											<td className="py-3 px-4 text-gray-600">
												{new Date(result.timestamp).toLocaleDateString()}
											</td>
											<td className="py-3 px-4">
												{student ? (
													<button
														onClick={() => handleViewStudent(student)}
														className="p-1 text-blue-600 hover:text-blue-800">
														<FaEye size={14} />
													</button>
												) : null}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</motion.div>

				{/* Analytics Charts Section - Enhanced */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
					className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Performance Analytics Card */}
					<div className="bg-white rounded-xl shadow-lg p-6 flex flex-col gap-6">
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							Performance Analytics
						</h3>
						{/* Pie Chart and Stats Summary */}
						<div className="flex flex-col md:flex-row items-center gap-8">
							{(() => {
								// Example: Replace with real data as needed
								const performanceCounts = {
									Excellent: 3,
									Good: 2,
									"Needs Improvement": 1,
								};
								const pieData = Object.entries(performanceCounts)
									.map(([name, value]) => ({ name, value }))
									.filter((d) => d.value > 0);
								const COLORS = ["#34d399", "#fbbf24", "#f87171"];
								const stats = {
									totalQuizzes: 6,
									averageScore: 78,
									bestScore: 95,
									recentActivity: 2,
									improvement: 8,
								};
								return (
									<>
										<div>
											<PieChart
												width={220}
												height={180}>
												<Pie
													data={pieData}
													dataKey="value"
													nameKey="name"
													cx="50%"
													cy="50%"
													outerRadius={60}
													fill="#8884d8"
													label
													isAnimationActive={true}
													animationDuration={1200}>
													{pieData.map((entry, index) => (
														<Cell
															key={`cell-${index}`}
															fill={COLORS[index % COLORS.length]}
														/>
													))}
												</Pie>
												<Tooltip />
												<Legend />
											</PieChart>
										</div>
										{/* Stats Summary */}
										<div className="space-y-2 min-w-[180px]">
											<div className="flex justify-between">
												<span className="text-gray-600">Total Attempts:</span>
												<span className="font-medium">
													{stats.totalQuizzes}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-gray-600">Average Score:</span>
												<span className="font-medium">
													{stats.averageScore}%
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-gray-600">Best Performance:</span>
												<span className="font-medium text-green-600">
													{stats.bestScore}%
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-gray-600">Recent Activity:</span>
												<span className="font-medium">
													{stats.recentActivity} quizzes (7 days)
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-gray-600">Improvement:</span>
												<span
													className={`font-medium ${
														stats.improvement >= 0
															? "text-green-600"
															: "text-red-600"
													}`}>
													{stats.improvement >= 0 ? "+" : ""}
													{stats.improvement}%
												</span>
											</div>
										</div>
									</>
								);
							})()}
						</div>
						{/* Badges/Achievements */}
						<div className="mt-4 flex flex-wrap gap-2">
							<span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
								10 Quizzes Completed
							</span>
							<span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
								High Scorer
							</span>
							<span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
								Most Improved
							</span>
						</div>
						{/* Last Login/Activity */}
						<div className="mt-2 text-sm text-gray-500">
							Last login: 2024-05-10 &bull; Last activity: 2 days ago
						</div>
					</div>
					{/* Quiz Activity Card */}
					<div className="bg-white rounded-xl shadow-lg p-6 flex flex-col gap-6">
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							Quiz Activity
						</h3>
						{/* Recent Quiz Results Table */}
						<div className="overflow-x-auto">
							<table className="w-full text-sm border rounded-lg mb-4">
								<thead>
									<tr className="bg-gray-100">
										<th className="py-2 px-3 text-left">Date</th>
										<th className="py-2 px-3 text-left">Quiz</th>
										<th className="py-2 px-3 text-left">Score</th>
										<th className="py-2 px-3 text-left">Questions</th>
										<th className="py-2 px-3 text-left">Status</th>
										<th className="py-2 px-3 text-left">Performance</th>
									</tr>
								</thead>
								<tbody>
									{/* Example data, replace with real quiz results */}
									<tr className="border-b hover:bg-gray-50">
										<td className="py-2 px-3 text-gray-600">2024-05-10</td>
										<td className="py-2 px-3 text-gray-600">Math Basics</td>
										<td className="py-2 px-3">
											<span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
												95%
											</span>
										</td>
										<td className="py-2 px-3 text-gray-600">19/20</td>
										<td className="py-2 px-3">
											<span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
												Excellent
											</span>
										</td>
										<td className="py-2 px-3 text-lg">🏆</td>
									</tr>
									<tr className="border-b hover:bg-gray-50">
										<td className="py-2 px-3 text-gray-600">2024-05-08</td>
										<td className="py-2 px-3 text-gray-600">Science Quiz</td>
										<td className="py-2 px-3">
											<span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
												72%
											</span>
										</td>
										<td className="py-2 px-3 text-gray-600">13/18</td>
										<td className="py-2 px-3">
											<span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
												Good
											</span>
										</td>
										<td className="py-2 px-3 text-lg">👍</td>
									</tr>
									<tr className="border-b hover:bg-gray-50">
										<td className="py-2 px-3 text-gray-600">2024-05-05</td>
										<td className="py-2 px-3 text-gray-600">English Test</td>
										<td className="py-2 px-3">
											<span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
												55%
											</span>
										</td>
										<td className="py-2 px-3 text-gray-600">11/20</td>
										<td className="py-2 px-3">
											<span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
												Needs Improvement
											</span>
										</td>
										<td className="py-2 px-3 text-lg">📈</td>
									</tr>
								</tbody>
							</table>
						</div>
						{/* Mini Trend Chart */}
						<div className="mb-4">
							<h4 className="text-md font-semibold text-gray-800 mb-2">
								Score Trend
							</h4>
							<div className="flex justify-center">
								<LineChart
									width={300}
									height={120}
									data={[
										{ date: "2024-05-05", score: 55 },
										{ date: "2024-05-08", score: 72 },
										{ date: "2024-05-10", score: 95 },
									]}>
									<XAxis
										dataKey="date"
										tick={{ fontSize: 12 }}
									/>
									<YAxis
										domain={[0, 100]}
										tick={{ fontSize: 12 }}
									/>
									<Tooltip />
									<Line
										type="monotone"
										dataKey="score"
										stroke="#7c3aed"
										strokeWidth={3}
										dot={{ r: 4 }}
										isAnimationActive={true}
										animationDuration={1200}
									/>
								</LineChart>
							</div>
						</div>
						{/* Admin Notes Section */}
						<div className="mb-2">
							<h4 className="text-md font-semibold text-gray-800 mb-2">
								Admin Notes
							</h4>
							<textarea
								className="w-full border rounded-lg p-2 text-sm"
								rows={3}
								placeholder="Add notes about this student..."
							/>
						</div>
						{/* Send Feedback Button */}
						<div className="flex justify-end">
							<button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
								Send Feedback
							</button>
						</div>
					</div>
				</motion.div>
			</main>

			{/* Student Detail Modal */}
			{showStudentModal && selectedStudent && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
						{/* Modal Header */}
						<div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
							<div className="flex items-center space-x-3">
								<div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
									<span className="text-white text-lg font-medium">
										{selectedStudent.name?.charAt(0) || "U"}
									</span>
								</div>
								<div>
									<h2 className="text-xl font-semibold text-gray-900">
										Student Details
									</h2>
									<p className="text-sm text-gray-500">
										{selectedStudent.name}
									</p>
								</div>
							</div>
							<button
								onClick={() => setShowStudentModal(false)}
								className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
								<FaTimes size={20} />
							</button>
						</div>

						{/* Modal Content */}
						<div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] custom-scrollbar">
							{/* Student Information */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
								<div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
									<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
										<FaUser className="mr-2 text-blue-500" />
										Personal Information
									</h3>
									<div className="space-y-3">
										<div className="flex justify-between">
											<span className="text-gray-600">Name:</span>
											<span className="font-medium">
												{selectedStudent.name}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Email:</span>
											<span className="font-medium">
												{selectedStudent.email}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Class:</span>
											<span className="font-medium">
												{selectedStudent.class || "Not set"}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Denomination:</span>
											<span className="font-medium">
												{selectedStudent.denomination || "Not set"}
											</span>
										</div>
									</div>
								</div>

								<div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
									<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
										<FaChartBar className="mr-2 text-green-500" />
										Performance Overview
									</h3>
									{(() => {
										const stats = calculateStudentStats(studentQuizResults);
										return (
											<div className="space-y-3">
												<div className="flex justify-between">
													<span className="text-gray-600">Total Quizzes:</span>
													<span className="font-medium">
														{stats.totalQuizzes}
													</span>
												</div>
												<div className="flex justify-between">
													<span className="text-gray-600">Average Score:</span>
													<span className="font-medium">
														{stats.averageScore}%
													</span>
												</div>
												<div className="flex justify-between">
													<span className="text-gray-600">Best Score:</span>
													<span className="font-medium text-green-600">
														{stats.bestScore}%
													</span>
												</div>
												<div className="flex justify-between">
													<span className="text-gray-600">
														Recent Activity:
													</span>
													<span className="font-medium">
														{stats.recentActivity} quizzes (7 days)
													</span>
												</div>
												<div className="flex justify-between">
													<span className="text-gray-600">Improvement:</span>
													<span
														className={`font-medium ${
															stats.improvement >= 0
																? "text-green-600"
																: "text-red-600"
														}`}>
														{stats.improvement >= 0 ? "+" : ""}
														{stats.improvement}%
													</span>
												</div>
											</div>
										);
									})()}
								</div>
							</div>

							{/* Quiz History - replaced with Pie Chart, Stats Summary, Recent Results Table, and Trend Chart */}
							<div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
									<FaHistory className="mr-2 text-purple-500" />
									Quiz Performance Overview
								</h3>
								{studentQuizResults.length > 0 ? (
									<>
										<div className="flex flex-col md:flex-row items-center justify-center gap-8">
											{/* Pie Chart and Stats Summary */}
											{(() => {
												const performanceCounts = {
													Excellent: 0,
													Good: 0,
													"Needs Improvement": 0,
												};
												studentQuizResults.forEach((result) => {
													const scorePercentage = Math.round(
														(result.score / result.total_questions) * 100
													);
													if (scorePercentage >= 80)
														performanceCounts.Excellent += 1;
													else if (scorePercentage >= 60)
														performanceCounts.Good += 1;
													else performanceCounts["Needs Improvement"] += 1;
												});
												const pieData = Object.entries(performanceCounts)
													.map(([name, value]) => ({ name, value }))
													.filter((d) => d.value > 0);
												const COLORS = ["#34d399", "#fbbf24", "#f87171"];
												const stats = calculateStudentStats(studentQuizResults);
												return (
													<>
														<div>
															<PieChart
																width={320}
																height={240}>
																<Pie
																	data={pieData}
																	dataKey="value"
																	nameKey="name"
																	cx="50%"
																	cy="50%"
																	outerRadius={80}
																	fill="#8884d8"
																	label
																	isAnimationActive={true}
																	animationDuration={1200}>
																	{pieData.map((entry, index) => (
																		<Cell
																			key={`cell-${index}`}
																			fill={COLORS[index % COLORS.length]}
																		/>
																	))}
																</Pie>
																<Tooltip />
																<Legend />
															</PieChart>
														</div>
														{/* Stats Summary */}
														<div className="space-y-3 min-w-[200px]">
															<div className="flex justify-between">
																<span className="text-gray-600">
																	Total Attempts:
																</span>
																<span className="font-medium">
																	{stats.totalQuizzes}
																</span>
															</div>
															<div className="flex justify-between">
																<span className="text-gray-600">
																	Average Score:
																</span>
																<span className="font-medium">
																	{stats.averageScore}%
																</span>
															</div>
															<div className="flex justify-between">
																<span className="text-gray-600">
																	Best Performance:
																</span>
																<span className="font-medium text-green-600">
																	{stats.bestScore}%
																</span>
															</div>
															<div className="flex justify-between">
																<span className="text-gray-600">
																	Recent Activity:
																</span>
																<span className="font-medium">
																	{stats.recentActivity} quizzes (7 days)
																</span>
															</div>
															<div className="flex justify-between">
																<span className="text-gray-600">
																	Improvement:
																</span>
																<span
																	className={`font-medium ${
																		stats.improvement >= 0
																			? "text-green-600"
																			: "text-red-600"
																	}`}>
																	{stats.improvement >= 0 ? "+" : ""}
																	{stats.improvement}%
																</span>
															</div>
														</div>
													</>
												);
											})()}
										</div>
										{/* Recent Quiz Results Table */}
										<div className="mt-8">
											<h4 className="text-md font-semibold text-gray-800 mb-2">
												Recent Quiz Results
											</h4>
											<div className="overflow-x-auto">
												<table className="w-full text-sm border rounded-lg">
													<thead>
														<tr className="bg-gray-100">
															<th className="py-2 px-3 text-left">Date</th>
															<th className="py-2 px-3 text-left">Score</th>
															<th className="py-2 px-3 text-left">Questions</th>
															<th className="py-2 px-3 text-left">Status</th>
															<th className="py-2 px-3 text-left">
																Performance
															</th>
														</tr>
													</thead>
													<tbody>
														{studentQuizResults.slice(0, 5).map((result) => {
															const scorePercentage = Math.round(
																(result.score / result.total_questions) * 100
															);
															const getStatusColor = (score) => {
																if (score >= 80)
																	return "bg-green-100 text-green-800";
																if (score >= 60)
																	return "bg-yellow-100 text-yellow-800";
																return "bg-red-100 text-red-800";
															};
															const getPerformanceIcon = (score) => {
																if (score >= 80) return "🏆";
																if (score >= 60) return "👍";
																return "📈";
															};
															return (
																<tr
																	key={`${result.id || result.student_email}-${
																		result.timestamp
																	}`}
																	className="border-b hover:bg-gray-50">
																	<td className="py-2 px-3 text-gray-600">
																		{new Date(
																			result.timestamp
																		).toLocaleDateString()}
																	</td>
																	<td className="py-2 px-3">
																		<span
																			className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
																				scorePercentage
																			)}`}>
																			{scorePercentage}%
																		</span>
																	</td>
																	<td className="py-2 px-3 text-gray-600">
																		{result.score}/{result.total_questions}
																	</td>
																	<td className="py-2 px-3">
																		<span
																			className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
																				scorePercentage
																			)}`}>
																			{scorePercentage >= 80
																				? "Excellent"
																				: scorePercentage >= 60
																				? "Good"
																				: "Needs Improvement"}
																		</span>
																	</td>
																	<td className="py-2 px-3 text-lg">
																		{getPerformanceIcon(scorePercentage)}
																	</td>
																</tr>
															);
														})}
													</tbody>
												</table>
											</div>
										</div>
										{/* Mini Trend Chart */}
										<div className="mt-8">
											<h4 className="text-md font-semibold text-gray-800 mb-2">
												Score Trend
											</h4>
											<div className="flex justify-center">
												<LineChart
													width={340}
													height={180}
													data={studentQuizResults
														.slice()
														.reverse()
														.map((result) => ({
															date: new Date(
																result.timestamp
															).toLocaleDateString(),
															score: Math.round(
																(result.score / result.total_questions) * 100
															),
														}))}>
													<XAxis
														dataKey="date"
														tick={{ fontSize: 12 }}
													/>
													<YAxis
														domain={[0, 100]}
														tick={{ fontSize: 12 }}
													/>
													<Tooltip />
													<Line
														type="monotone"
														dataKey="score"
														stroke="#7c3aed"
														strokeWidth={3}
														dot={{ r: 4 }}
														isAnimationActive={true}
														animationDuration={1200}
													/>
												</LineChart>
											</div>
										</div>
										{/* Send Feedback Button */}
										<div className="mt-6 flex justify-end">
											<button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
												Send Feedback
											</button>
										</div>
									</>
								) : (
									<div className="text-center py-8">
										<FaClipboardList className="text-gray-400 text-4xl mx-auto mb-4" />
										<p className="text-gray-500">No quiz attempts yet</p>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Edit Student Modal */}
			{showEditModal && editingStudent && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
						{/* Modal Header */}
						<div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
							<div className="flex items-center space-x-3">
								<div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
									<span className="text-white text-lg font-medium">
										{editingStudent.name?.charAt(0) || "U"}
									</span>
								</div>
								<div>
									<h2 className="text-xl font-semibold text-gray-900">
										Edit Student
									</h2>
									<p className="text-sm text-gray-500">{editingStudent.name}</p>
								</div>
							</div>
							<button
								onClick={handleCancelEdit}
								className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
								<FaTimes size={20} />
							</button>
						</div>

						{/* Modal Content */}
						<div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] custom-scrollbar">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
								<div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
									<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
										<FaUser className="mr-2 text-blue-500" />
										Personal Information
									</h3>
									<div className="space-y-3">
										<div className="flex justify-between">
											<span className="text-gray-600">Name:</span>
											<input
												type="text"
												name="name"
												value={editingStudent.name}
												onChange={handleEditChange}
												className="border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
											/>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Email:</span>
											<input
												type="text"
												name="email"
												value={editingStudent.email}
												onChange={handleEditChange}
												className="border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
											/>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Class:</span>
											<input
												type="text"
												name="class"
												value={editingStudent.class}
												onChange={handleEditChange}
												className="border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
											/>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Denomination:</span>
											<input
												type="text"
												name="denomination"
												value={editingStudent.denomination}
												onChange={handleEditChange}
												className="border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
											/>
										</div>
									</div>
								</div>
							</div>
							<div className="mt-6">
								<button
									onClick={handleSaveEdit}
									className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
									Save Changes
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default AdminDashboard;
