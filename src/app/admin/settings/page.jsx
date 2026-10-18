"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import { isAdminRole } from "../../../lib/roles";
import AdminShell from "../../../components/AdminShell";
import StudentManagement from "../../../components/StudentManagement";
import QuizAnalytics from "../../../components/QuizAnalytics";
import {
	FaUsers,
	FaChartBar,
	FaShieldAlt,
	FaExclamationTriangle,
} from "react-icons/fa";

const withTimeout = (promise, ms) =>
	Promise.race([
		promise,
		new Promise((_, reject) =>
			setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
		),
	]);

function AdminSettingsInner() {
	const [user, setUser] = useState(null);
	const [orgName, setOrgName] = useState("");
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState(false);
	const [activeTab, setActiveTab] = useState("students");
	const [students, setStudents] = useState([]);
	const [quizResults, setQuizResults] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [editingStudent, setEditingStudent] = useState(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [studentToDelete, setStudentToDelete] = useState(null);
	const router = useRouter();
	const searchParams = useSearchParams();

	const loadData = useCallback(async () => {
		try {
			// Uses the scoped RPCs rather than plain table reads — see the
			// note in admin/dashboard/page.jsx's loadDashboardData for why.
			const { data: studentsData = [] } = await withTimeout(supabase.rpc("get_scoped_students"), 10000);
			const { data: quizData = [] } = await withTimeout(supabase.rpc("get_scoped_quiz_results"), 10000);
			const studentsWithCounts = studentsData.map((student) => ({
				...student,
				submissionCount: quizData.filter((r) => r.student_id === student.id)
					.length,
			}));
			setStudents(studentsWithCounts);
			setQuizResults(quizData);
		} catch (error) {
			console.error("Error loading data:", error);
			throw error; // Let getUser catch it
		}
	}, []);

	const getUser = useCallback(async () => {
		setLoading(true);
		setLoadError(false);
		try {
			const {
				data: { session },
				error: sessionError,
			} = await withTimeout(supabase.auth.getSession(), 10000);
			if (sessionError || !session) {
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
			const { data: profile } = await withTimeout(
				supabase
					.from("users_profile")
					.select("role, name, email, org_id")
					.eq("id", user.id)
					.single(),
				10000
			);
			if (!isAdminRole(profile?.role)) {
				router.push("/authenticate");
				return;
			}
			setUser({ ...user, ...profile });
			if (profile.org_id) {
				const { data: org } = await supabase
					.from("organizations")
					.select("name")
					.eq("id", profile.org_id)
					.maybeSingle();
				setOrgName(org?.name || "");
			}
			await loadData();
		} catch (error) {
			console.error("Init error:", error);
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
	}, [router, loadData]);

	// Fetch user and data
	useEffect(() => {
		getUser();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event) => {
			if (event === "SIGNED_OUT") router.push("/authenticate");
		});

		return () => subscription.unsubscribe();
	}, [getUser, router]);

	// Dashboard and the Student Detail page link here as
	// /admin/settings?tab=students&delete=<id> or &edit=<id> — this was
	// previously a dead link (confirmed: nothing on this page ever read
	// these params, so clicking Delete/Edit silently landed on the plain
	// Students tab with no modal and no prefilled edit state).
	useEffect(() => {
		if (!searchParams || students.length === 0) return;
		const tab = searchParams.get("tab");
		if (tab) setActiveTab(tab);

		const deleteId = searchParams.get("delete");
		if (deleteId) {
			const target = students.find((s) => s.id === deleteId);
			if (target) {
				setStudentToDelete(target);
				setShowDeleteModal(true);
			}
		}

		const editId = searchParams.get("edit");
		if (editId) {
			const target = students.find((s) => s.id === editId);
			if (target) setEditingStudent({ ...target });
		}
	}, [searchParams, students]);

	// Student edit/save/delete handlers
	const handleEditStudent = (student) => setEditingStudent({ ...student });

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
			setStudents((prev) =>
				prev.map((s) => (s.id === editingStudent.id ? editingStudent : s))
			);
			setEditingStudent(null);
			alert("Student updated successfully!");
		} catch {
			alert("Error updating student");
		}
	};

	const handleDeleteStudent = async () => {
		if (!studentToDelete) return;
		try {
			await supabase
				.from("quiz_results")
				.delete()
				.eq("student_id", studentToDelete.id);
			const { error } = await supabase
				.from("users_profile")
				.delete()
				.eq("id", studentToDelete.id);
			if (error) {
				alert("Error deleting student: " + error.message);
				return;
			}
			setStudents((prev) => prev.filter((s) => s.id !== studentToDelete.id));
			setStudentToDelete(null);
			setShowDeleteModal(false);
			alert("Student deleted successfully!");
		} catch {
			alert("Error deleting student");
		}
	};

	const handleQuizSchedule = () => {
		router.push("/admin/quiz-settings");
	};

	// Filtered students (for search, if needed)
	const filteredStudents = useMemo(
		() =>
			students.filter(
				(student) =>
					student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					student.email?.toLowerCase().includes(searchTerm.toLowerCase())
			),
		[students, searchTerm]
	);

	if (loadError) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center p-4">
				<div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full">
					<FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
					<h2 className="text-xl font-bold text-gray-800 mb-2">Network Error</h2>
					<p className="text-gray-600 mb-6">
						We couldn't connect to the server. Please check your internet connection and try again.
					</p>
					<button
						onClick={getUser}
						className="w-full px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium">
						Retry Connection
					</button>
				</div>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">Loading Admin Settings...</p>
				</div>
			</div>
		);
	}

	return (
		<AdminShell user={user} orgName={orgName} active="settings">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Tab Navigation */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
					<div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
						<button
							onClick={() => setActiveTab("students")}
							className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 py-2 px-1 sm:px-4 rounded-md font-medium text-xs sm:text-sm transition-colors min-w-0 ${
								activeTab === "students"
									? "bg-white text-brand-600 shadow-sm"
									: "text-gray-600 hover:text-gray-900"
							}`}>
							<FaUsers className="flex-shrink-0" />
							<span className="truncate">
								<span className="sm:hidden">Students</span>
								<span className="hidden sm:inline">Student Management</span>
							</span>
						</button>
						<button
							onClick={() => setActiveTab("analytics")}
							className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 py-2 px-1 sm:px-4 rounded-md font-medium text-xs sm:text-sm transition-colors min-w-0 ${
								activeTab === "analytics"
									? "bg-white text-brand-600 shadow-sm"
									: "text-gray-600 hover:text-gray-900"
							}`}>
							<FaChartBar className="flex-shrink-0" />
							<span className="truncate">
								<span className="sm:hidden">Analytics</span>
								<span className="hidden sm:inline">Quiz Analytics</span>
							</span>
						</button>
						<button
							onClick={() => setActiveTab("system")}
							className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 py-2 px-1 sm:px-4 rounded-md font-medium text-xs sm:text-sm transition-colors min-w-0 ${
								activeTab === "system"
									? "bg-white text-brand-600 shadow-sm"
									: "text-gray-600 hover:text-gray-900"
							}`}>
							<FaShieldAlt className="flex-shrink-0" />
							<span className="truncate">
								<span className="sm:hidden">Settings</span>
								<span className="hidden sm:inline">System Settings</span>
							</span>
						</button>
					</div>
				</motion.div>

					{/* Student Management Tab */}
					{activeTab === "students" && <StudentManagement />}

					{/* Quiz Analytics Tab */}
					{activeTab === "analytics" && <QuizAnalytics />}

					{/* System Settings Tab — only ever held one real, working
					    control (Quiz Scheduling). The rest (General Settings
					    toggles, Admin Invite Code field) looked interactive but
					    weren't connected to anything: systemSettings/adminCode
					    were local-only state, and Save was a stub `alert()` —
					    nothing ever persisted. Removed rather than left as a
					    convincing-looking no-op. The real admin invite code
					    lives in an env var (NEXT_PUBLIC_ADMIN_INVITE_CODE),
					    which a web form can't change anyway. */}
					{activeTab === "system" && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
							<h3 className="font-display text-lg font-semibold text-gray-900 mb-1">
								Quiz Scheduling
							</h3>
							<p className="text-sm text-gray-500 mb-4">
								Set the active window, time limit, and question count for the real quiz.
							</p>
							<button
								onClick={handleQuizSchedule}
								className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors">
								Open Quiz Scheduling
							</button>
						</motion.div>
					)}
			</div>

			{/* Delete Confirmation Modal */}
			{showDeleteModal && (
				<DeleteModal
					student={studentToDelete}
					onCancel={() => setShowDeleteModal(false)}
					onDelete={handleDeleteStudent}
				/>
			)}
		</AdminShell>
	);
}

// Delete confirmation modal
function DeleteModal({ student, onCancel, onDelete }) {
	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
				<div className="flex items-center space-x-3 mb-4">
					<FaExclamationTriangle className="text-red-500 text-xl" />
					<h3 className="text-lg font-semibold text-gray-900">
						Delete Student
					</h3>
				</div>
				<p className="text-gray-600 mb-6">
					Are you sure you want to delete <strong>{student?.name}</strong>? This
					action cannot be undone and will also delete all their quiz results.
				</p>
				<div className="flex space-x-3">
					<button
						onClick={onCancel}
						className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
						Cancel
					</button>
					<button
						onClick={onDelete}
						className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
						Delete
					</button>
				</div>
			</div>
		</div>
	);
}

export default function AdminSettings() {
	return (
		<Suspense fallback={null}>
			<AdminSettingsInner />
		</Suspense>
	);
}
