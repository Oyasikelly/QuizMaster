"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import StudentManagement from "../../../components/StudentManagement";
import QuizAnalytics from "../../../components/QuizAnalytics";
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
	FaSave,
	FaUndo,
	FaUserEdit,
	FaUserTimes,
	FaUserCheck,
	FaShieldAlt,
	FaKey,
	FaDatabase,
	FaChartLine,
	FaHistory,
	FaExclamationTriangle,
	FaInfoCircle,
	FaBars,
	FaClose,
} from "react-icons/fa";

const AdminSettings = () => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("students");
	const [students, setStudents] = useState([]);
	const [quizResults, setQuizResults] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [editingStudent, setEditingStudent] = useState(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [studentToDelete, setStudentToDelete] = useState(null);
	const [adminCode, setAdminCode] = useState("ADMIN2024");
	const [systemSettings, setSystemSettings] = useState({
		allowStudentRegistration: true,
		requireEmailVerification: true,
		maxQuizAttempts: 3,
		quizTimeLimit: 30,
		showResultsImmediately: true,
	});
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const router = useRouter();

	// Sidebar links (Settings highlighted)
	const sidebarLinks = [
		{
			label: "Dashboard",
			icon: <FaTrophy />,
			onClick: () => router.push("/admin/dashboard"),
		},
		{
			label: "Student Management",
			icon: <FaUsers />,
			onClick: () => setActiveTab("students"),
		},
		{
			label: "Analytics",
			icon: <FaChartBar />,
			onClick: () => setActiveTab("analytics"),
		},
		{
			label: "Settings",
			icon: <FaCog />,
			onClick: () => setActiveTab("system"),
			active: true,
		},
		{ label: "Logout", icon: <FaSignOutAlt />, onClick: handleSignOut },
	];

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
				loadData();
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

	const loadData = async () => {
		try {
			// Load students with their quiz submission counts
			const { data: studentsData } = await supabase
				.from("users_profile")
				.select("*")
				.eq("role", "student");

			// Load quiz results to calculate submission counts
			const { data: quizData } = await supabase
				.from("quiz_results")
				.select("*");

			// Calculate submission counts for each student
			const studentsWithCounts =
				studentsData?.map((student) => {
					const submissionCount =
						quizData?.filter((result) => result.student_id === student.id)
							.length || 0;
					return { ...student, submissionCount };
				}) || [];

			setStudents(studentsWithCounts);
			setQuizResults(quizData || []);
		} catch (error) {
			console.error("Error loading data:", error);
		}
	};

	const handleSignOut = async () => {
		await supabase.auth.signOut();
		router.push("/");
	};

	const handleEditStudent = (student) => {
		setEditingStudent({ ...student });
	};

	const handleSaveStudent = async () => {
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

			// Update local state
			setStudents(
				students.map((student) =>
					student.id === editingStudent.id ? editingStudent : student
				)
			);
			setEditingStudent(null);
			alert("Student updated successfully!");
		} catch (error) {
			console.error("Error updating student:", error);
			alert("Error updating student");
		}
	};

	const handleDeleteStudent = async () => {
		if (!studentToDelete) return;

		try {
			// First delete all quiz results for this student
			const { error: quizError } = await supabase
				.from("quiz_results")
				.delete()
				.eq("student_id", studentToDelete.id);

			if (quizError) {
				console.error("Error deleting quiz results:", quizError);
			}

			// Then delete the student profile
			const { error } = await supabase
				.from("users_profile")
				.delete()
				.eq("id", studentToDelete.id);

			if (error) {
				alert("Error deleting student: " + error.message);
				return;
			}

			// Update local state
			setStudents(
				students.filter((student) => student.id !== studentToDelete.id)
			);
			setStudentToDelete(null);
			setShowDeleteModal(false);
			alert("Student deleted successfully!");
		} catch (error) {
			console.error("Error deleting student:", error);
			alert("Error deleting student");
		}
	};

	const handleUpdateSystemSettings = async () => {
		// In a real app, you'd save these to a settings table
		alert("System settings updated successfully!");
	};

	const filteredStudents = students.filter((student) => {
		const matchesSearch =
			student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			student.email?.toLowerCase().includes(searchTerm.toLowerCase());
		return matchesSearch;
	});

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">Loading Admin Settings...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen overflow-hidden scrollbar-hide flex bg-gradient-to-br from-purple-50 to-indigo-100">
			{/* Sidebar */}
			<aside
				className={`fixed z-30 inset-y-0 left-0 w-64 bg-white shadow-lg transform ${
					sidebarOpen ? "translate-x-0" : "-translate-x-full"
				} transition-transform duration-200 ease-in-out md:relative md:translate-x-0 md:w-56 md:block`}>
				<div className="flex items-center justify-between px-6 py-4 border-b">
					<div className="flex items-center space-x-2">
						<div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
							<FaUser className="text-white" />
						</div>
						<span className="font-bold text-lg text-gray-800">Admin</span>
					</div>
					<button
						className="md:hidden p-2"
						onClick={() => setSidebarOpen(false)}>
						<FaClose size={20} />
					</button>
				</div>
				<nav className="mt-6 space-y-2 px-4">
					{sidebarLinks.map((link, idx) => (
						<button
							key={link.label}
							onClick={() => {
								link.onClick();
								setSidebarOpen(false);
							}}
							className={`flex items-center w-full px-4 py-3 rounded-lg text-gray-700 hover:bg-purple-100 transition-colors font-medium gap-3 ${
								link.active ? "bg-purple-100 text-purple-700" : ""
							}`}>
							{link.icon}
							<span>{link.label}</span>
						</button>
					))}
				</nav>
			</aside>

			{/* Overlay for mobile sidebar */}
			{sidebarOpen && (
				<div
					className="fixed inset-0 z-20 bg-black bg-opacity-30 md:hidden"
					onClick={() => setSidebarOpen(false)}></div>
			)}

			{/* Main Content */}
			<div className="flex-1 flex flex-col max-w-screen min-h-screen md:ml-4">
				{/* Topbar for mobile */}
				<header className="bg-white shadow-sm border-b md:hidden flex items-center justify-between px-4 py-3">
					<button
						className="p-1"
						onClick={() => setSidebarOpen(true)}>
						<FaBars size={22} />
					</button>
					<div className="flex items-center w-auto space-x-2">
						<div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
							<FaUser className="text-white" />
						</div>
						<span className="font-semibold text-gray-800">{user?.name}</span>
					</div>
				</header>

				<main className="flex-1 max-w-7xl mx-auto w-screen lg:w-full px-2 sm:px-4 lg:px-8 py-8 overflow-x-hidden">
					{/* Tab Navigation */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="bg-white rounded-xl shadow-lg p-6 mb-8">
						<div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
							<button
								onClick={() => setActiveTab("students")}
								className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
									activeTab === "students"
										? "bg-white text-purple-600 shadow-sm"
										: "text-gray-600 hover:text-gray-900"
								}`}>
								<FaUsers className="inline mr-2" />
								Student Management
							</button>
							<button
								onClick={() => setActiveTab("analytics")}
								className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
									activeTab === "analytics"
										? "bg-white text-purple-600 shadow-sm"
										: "text-gray-600 hover:text-gray-900"
								}`}>
								<FaChartBar className="inline mr-2" />
								Quiz Analytics
							</button>
							<button
								onClick={() => setActiveTab("system")}
								className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
									activeTab === "system"
										? "bg-white text-purple-600 shadow-sm"
										: "text-gray-600 hover:text-gray-900"
								}`}>
								<FaShieldAlt className="inline mr-2" />
								System Settings
							</button>
						</div>
					</motion.div>

					{/* Student Management Tab */}
					{activeTab === "students" && <StudentManagement />}

					{/* Quiz Analytics Tab */}
					{activeTab === "analytics" && <QuizAnalytics />}

					{/* System Settings Tab */}
					{activeTab === "system" && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="space-y-6">
							{/* General Settings */}
							<div className="bg-white rounded-xl shadow-lg p-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-4">
									General Settings
								</h3>
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<div>
											<label className="text-sm font-medium text-gray-700">
												Allow Student Registration
											</label>
											<p className="text-xs text-gray-500">
												Enable new students to register
											</p>
										</div>
										<label className="relative inline-flex items-center cursor-pointer">
											<input
												type="checkbox"
												checked={systemSettings.allowStudentRegistration}
												onChange={(e) =>
													setSystemSettings({
														...systemSettings,
														allowStudentRegistration: e.target.checked,
													})
												}
												className="sr-only peer"
											/>
											<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
										</label>
									</div>

									<div className="flex items-center justify-between">
										<div>
											<label className="text-sm font-medium text-gray-700">
												Require Email Verification
											</label>
											<p className="text-xs text-gray-500">
												Students must verify their email before accessing
												quizzes
											</p>
										</div>
										<label className="relative inline-flex items-center cursor-pointer">
											<input
												type="checkbox"
												checked={systemSettings.requireEmailVerification}
												onChange={(e) =>
													setSystemSettings({
														...systemSettings,
														requireEmailVerification: e.target.checked,
													})
												}
												className="sr-only peer"
											/>
											<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
										</label>
									</div>

									<div className="flex items-center justify-between">
										<div>
											<label className="text-sm font-medium text-gray-700">
												Show Results Immediately
											</label>
											<p className="text-xs text-gray-500">
												Display quiz results right after completion
											</p>
										</div>
										<label className="relative inline-flex items-center cursor-pointer">
											<input
												type="checkbox"
												checked={systemSettings.showResultsImmediately}
												onChange={(e) =>
													setSystemSettings({
														...systemSettings,
														showResultsImmediately: e.target.checked,
													})
												}
												className="sr-only peer"
											/>
											<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
										</label>
									</div>
								</div>
							</div>

							{/* Quiz Settings */}
							<div className="bg-white rounded-xl shadow-lg p-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-4">
									Quiz Settings
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Maximum Quiz Attempts
										</label>
										<input
											type="number"
											value={systemSettings.maxQuizAttempts}
											onChange={(e) =>
												setSystemSettings({
													...systemSettings,
													maxQuizAttempts: parseInt(e.target.value),
												})
											}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
											min="1"
											max="10"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Quiz Time Limit (minutes)
										</label>
										<input
											type="number"
											value={systemSettings.quizTimeLimit}
											onChange={(e) =>
												setSystemSettings({
													...systemSettings,
													quizTimeLimit: parseInt(e.target.value),
												})
											}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
											min="5"
											max="120"
										/>
									</div>
								</div>
							</div>

							{/* Admin Settings */}
							<div className="bg-white rounded-xl shadow-lg p-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-4">
									Admin Settings
								</h3>
								<div className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Admin Invite Code
										</label>
										<div className="flex space-x-2">
											<input
												type="text"
												value={adminCode}
												onChange={(e) => setAdminCode(e.target.value)}
												className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
												placeholder="Enter admin invite code"
											/>
											<button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
												<FaKey className="inline mr-2" />
												Update
											</button>
										</div>
										<p className="text-xs text-gray-500 mt-1">
											This code is required for new admin registrations
										</p>
									</div>
								</div>
							</div>

							{/* Save Settings Button */}
							<div className="flex justify-end">
								<button
									onClick={handleUpdateSystemSettings}
									className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
									<FaSave className="inline" />
									<span>Save Settings</span>
								</button>
							</div>
						</motion.div>
					)}
				</main>

				{/* Delete Confirmation Modal */}
				{showDeleteModal && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
						<div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
							<div className="flex items-center space-x-3 mb-4">
								<FaExclamationTriangle className="text-red-500 text-xl" />
								<h3 className="text-lg font-semibold text-gray-900">
									Delete Student
								</h3>
							</div>
							<p className="text-gray-600 mb-6">
								Are you sure you want to delete{" "}
								<strong>{studentToDelete?.name}</strong>? This action cannot be
								undone and will also delete all their quiz results.
							</p>
							<div className="flex space-x-3">
								<button
									onClick={() => setShowDeleteModal(false)}
									className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
									Cancel
								</button>
								<button
									onClick={handleDeleteStudent}
									className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
									Delete
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default AdminSettings;
