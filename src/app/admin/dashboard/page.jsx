"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import { isAdminRole, roleLabel } from "../../../lib/roles";
import AdminShell from "../../../components/AdminShell";
import {
	FaUser,
	FaUsers,
	FaChartBar,
	FaClipboardList,
	FaDownload,
	FaEye,
	FaTimes,
	FaHistory,
	FaExclamationTriangle,
} from "react-icons/fa";

const withTimeout = (promise, ms) =>
	Promise.race([
		promise,
		new Promise((_, reject) =>
			setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
		),
	]);
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
	const [orgName, setOrgName] = useState("");
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState(false);
	const [stats, setStats] = useState({
		totalStudents: 0,
		totalQuizzes: 0,
		averageScore: 0,
		recentActivity: [],
	});
	const [students, setStudents] = useState([]);
	const [quizResults, setQuizResults] = useState([]);
	const [showStudentModal, setShowStudentModal] = useState(false);
	const [selectedStudent, setSelectedStudent] = useState(null);
	const [studentQuizResults, setStudentQuizResults] = useState([]);
	const [showExportModal, setShowExportModal] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const router = useRouter();

	const extractAttempts = (results) => {
		const attempts = [];
		(results || []).forEach((row) => {
			if (row.real_total > 0) attempts.push({ student_id: row.student_id, email: row.email, timestamp: row.timestamp, score: row.real_score, total_questions: row.real_total, mode: "Real Quiz", quiz_title: "Real Quiz", category: row.category });
			if (row.practice_normal_total > 0) attempts.push({ student_id: row.student_id, email: row.email, timestamp: row.timestamp, score: row.practice_normal_score, total_questions: row.practice_normal_total, mode: "Practice (Normal)", quiz_title: row.lesson ? `Practice: ${row.lesson}` : "Practice (Normal)", category: row.category });
			if (row.practice_medium_total > 0) attempts.push({ student_id: row.student_id, email: row.email, timestamp: row.timestamp, score: row.practice_medium_score, total_questions: row.practice_medium_total, mode: "Practice (Medium)", quiz_title: row.lesson ? `Practice: ${row.lesson}` : "Practice (Medium)", category: row.category });
			if (row.practice_hard_total > 0) attempts.push({ student_id: row.student_id, email: row.email, timestamp: row.timestamp, score: row.practice_hard_score, total_questions: row.practice_hard_total, mode: "Practice (Hard)", quiz_title: row.lesson ? `Practice: ${row.lesson}` : "Practice (Hard)", category: row.category });
			if (row.practice_entire_total > 0) attempts.push({ student_id: row.student_id, email: row.email, timestamp: row.timestamp, score: row.practice_entire_score, total_questions: row.practice_entire_total, mode: "Practice (Entire Year)", quiz_title: "Practice (Entire Year)", category: row.category });
		});
		return attempts.sort((a, b) => {
			const timeDiff = new Date(b.timestamp) - new Date(a.timestamp);
			if (timeDiff !== 0) return timeDiff;
			if (a.mode === "Real Quiz") return -1;
			if (b.mode === "Real Quiz") return 1;
			return 0;
		});
	};

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
			await loadDashboardData();
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

	const loadDashboardData = async () => {
		try {
			// Load students. Uses get_scoped_students() rather than a plain
			// `.from("users_profile").select()` — production's RLS
			// enforcement for this exact request shape was found to be
			// unreliable (confirmed via direct testing: the same policy
			// logic, verified correct when run explicitly, was not being
			// applied consistently by Supabase's gateway for this plain
			// table read). The RPC does the identical scoping check
			// explicitly in its own body instead of depending on it.
			const { data: studentsData } = await withTimeout(supabase.rpc("get_scoped_students"), 10000);

			// Only keep students in a real class (case-insensitive). "adults"
			// (plural) was briefly a selectable duplicate of "adult" in
			// StudentManagement's own dropdown -- removed there, so no new
			// students can land on it; this stays just the three real values.
			const filteredStudentsData = (studentsData || []).filter((student) => {
				const cls = (student.class || "").toLowerCase();
				return cls === "yaya" || cls === "adult" || cls === "teenagers";
			});

			// Resolve each student's org name — RLS already limits which
			// students come back at all (a province_admin only ever sees
			// their own province; a super_admin sees every province under
			// Region 70), so this is purely for display grouping, not an
			// access check.
			const orgIds = [...new Set(filteredStudentsData.map((s) => s.org_id).filter(Boolean))];
			let orgNameById = {};
			if (orgIds.length > 0) {
				const { data: orgsData } = await supabase
					.from("organizations")
					.select("id, name")
					.in("id", orgIds);
				orgNameById = Object.fromEntries((orgsData || []).map((o) => [o.id, o.name]));
			}
			filteredStudentsData.forEach((s) => {
				s.orgName = s.org_id ? orgNameById[s.org_id] || "Unassigned" : "Unassigned";
			});

			// Load quiz results — see get_scoped_students() note above; same
			// reasoning applies here.
			const { data: rawQuizDataUnsorted } = await withTimeout(supabase.rpc("get_scoped_quiz_results"), 10000);
			const rawQuizData = [...(rawQuizDataUnsorted || [])].sort(
				(a, b) => new Date(b.timestamp) - new Date(a.timestamp)
			);

			const quizData = extractAttempts(rawQuizData);

			// Calculate submission counts and quiz stats for each student (match by email)
			const studentsWithStats =
				filteredStudentsData?.map((student) => {
					const studentResults =
						quizData?.filter((result) => result.email === student.email) || [];
					const realResults = studentResults.filter(r => r.mode === "Real Quiz");

					const submissionCount = studentResults.length;
					let averageScore = 0,
						bestScore = 0,
						recentScore = 0;
					if (realResults.length > 0) {
						const scores = realResults.map(
							(q) => (q.score / q.total_questions) * 100
						);
						averageScore = Math.round(
							scores.reduce((a, b) => a + b, 0) / scores.length
						);
						bestScore = Math.round(Math.max(...scores));
						recentScore = Math.round(
							(realResults[0].score / realResults[0].total_questions) *
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
			const realQuizData = quizData?.filter(q => q.mode === "Real Quiz") || [];
			const totalQuizzes =
				realQuizData.filter((q) =>
					filteredStudentsData.some((s) => s.email === q.email)
				).length || 0;
			const filteredQuizData =
				quizData?.filter((q) =>
					filteredStudentsData.some((s) => s.email === q.email)
				) || [];
			const filteredRealQuizData =
				realQuizData.filter((q) =>
					filteredStudentsData.some((s) => s.email === q.email)
				) || [];
			const averageScore =
				filteredRealQuizData.length > 0
					? Math.round(
							filteredRealQuizData.reduce(
								(sum, quiz) => sum + (quiz.score / quiz.total_questions) * 100,
								0
							) / filteredRealQuizData.length
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
			throw error; // Rethrow so getUser can catch network errors
		}
	};

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			await loadDashboardData();
		} catch (error) {
			console.error("Error refreshing data:", error);
		} finally {
			setIsRefreshing(false);
		}
	};

	const handleViewStudent = async (student) => {
		try {
			// Get detailed student quiz results
			const { data: rawStudentResults, error } = await supabase
				.from("quiz_results")
				.select("*")
				.eq("email", student.email)
				.order("timestamp", { ascending: false });

			if (error) {
				console.error("Error fetching student results:", error);
				return;
			}

			setSelectedStudent(student);
			setStudentQuizResults(extractAttempts(rawStudentResults || []));
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

		const realResults = results.filter((q) => q.mode === "Real Quiz");
		const totalQuizzes = realResults.length;
		
		let averageScore = 0, bestScore = 0, worstScore = 0;
		if (totalQuizzes > 0) {
			const scores = realResults.map(
				(quiz) => (quiz.score / quiz.total_questions) * 100
			);
			averageScore = Math.round(
				scores.reduce((sum, score) => sum + score, 0) / totalQuizzes
			);
			bestScore = Math.max(...scores);
			worstScore = Math.min(...scores);
		}

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

	// Powers only the scope banner's province count now — full
	// per-student management (search, edit, delete, the collapsible
	// province breakdown) lives at /admin/students; duplicating it here
	// too meant two separate fetches of the same data that could drift
	// out of sync, and the user flagged the redundancy directly.
	const isSuperAdminView = user?.role === "super_admin";
	const groupedByOrg = {};
	students.forEach((student) => {
		const org = student.orgName || "Unassigned";
		if (!groupedByOrg[org]) groupedByOrg[org] = [];
		groupedByOrg[org].push(student);
	});

	const sortedOrgNames = Object.keys(groupedByOrg).sort();

	// The Export modal's "Export by Class" section needs the distinct
	// class values actually present — it used to read a top-level
	// `groupedByClass` that only existed to feed the now-removed
	// Student Management table, so removing that table left this
	// referencing an undefined variable: opening Export crashed outright
	// for every admin, regardless of role.
	const availableClasses = [...new Set(students.map((s) => s.class).filter(Boolean))].sort();

	const handleExportResults = () => {
		try {
			// Prepare data for export
			const exportData = quizResults.map((result) => {
				const student = students.find((s) => s.email === result.email);
				const scorePercentage = Math.round(
					(result.score / result.total_questions) * 100
				);

				return {
					"Student Name": student?.name || "Unknown",
					Email: result.email,
					Class: student?.class || "Not set",
					Mode: result.mode,
					Score: `${result.score}/${result.total_questions}`,
					Percentage: `${scorePercentage}%`,
					Performance:
						scorePercentage >= 80
							? "Excellent"
							: scorePercentage >= 60
							? "Good"
							: "Needs Improvement",
					Date: new Date(result.timestamp).toLocaleDateString(),
					Time: new Date(result.timestamp).toLocaleTimeString(),
				};
			});

			// Group by class
			const groupedByClass = {};
			exportData.forEach((result) => {
				const className = result.Class;
				if (!groupedByClass[className]) {
					groupedByClass[className] = [];
				}
				groupedByClass[className].push(result);
			});

			// Create CSV content
			let csvContent = "data:text/csv;charset=utf-8,";

			// Add header
			const headers = [
				"Student Name",
				"Email",
				"Class",
				"Mode",
				"Score",
				"Percentage",
				"Performance",
				"Date",
				"Time",
			];
			csvContent += headers.join(",") + "\n";

			// Add data rows
			Object.keys(groupedByClass).forEach((className) => {
				// Add class header
				csvContent += `\n${className} Class Results\n`;
				csvContent += headers.join(",") + "\n";

				// Add class data
				groupedByClass[className].forEach((result) => {
					const row = headers.map((header) => {
						const value = result[header];
						// Escape commas and quotes in CSV
						return `"${String(value).replace(/"/g, '""')}"`;
					});
					csvContent += row.join(",") + "\n";
				});
			});

			// Create and download file
			const encodedUri = encodeURI(csvContent);
			const link = document.createElement("a");
			link.setAttribute("href", encodedUri);
			link.setAttribute(
				"download",
				`quiz-results-${new Date().toISOString().split("T")[0]}.csv`
			);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			// Show success message
			alert(
				`Export successful! Downloaded ${exportData.length} quiz results grouped by class.`
			);
		} catch (error) {
			console.error("Error exporting results:", error);
			alert("Error exporting results. Please try again.");
		}
	};

	const handleExportDetailedResults = () => {
		try {
			// Create detailed export with summary statistics
			const exportData = quizResults.map((result) => {
				const student = students.find((s) => s.email === result.email);
				const scorePercentage = Math.round(
					(result.score / result.total_questions) * 100
				);

				return {
					"Student Name": student?.name || "Unknown",
					Email: result.email,
					Class: student?.class || "Not set",
					Mode: result.mode,
					Score: `${result.score}/${result.total_questions}`,
					Percentage: `${scorePercentage}%`,
					Performance:
						scorePercentage >= 80
							? "Excellent"
							: scorePercentage >= 60
							? "Good"
							: "Needs Improvement",
					Date: new Date(result.timestamp).toLocaleDateString(),
					Time: new Date(result.timestamp).toLocaleTimeString(),
				};
			});

			// Group by class and add summary statistics
			const groupedByClass = {};
			exportData.forEach((result) => {
				const className = result.Class;
				if (!groupedByClass[className]) {
					groupedByClass[className] = [];
				}
				groupedByClass[className].push(result);
			});

			// Create CSV content with summary
			let csvContent = "data:text/csv;charset=utf-8,";

			// Add overall summary
			csvContent += "QUIZ RESULTS SUMMARY\n";
			csvContent += `Total Results: ${exportData.length}\n`;
			csvContent += `Export Date: ${new Date().toLocaleDateString()}\n`;
			csvContent += `Export Time: ${new Date().toLocaleTimeString()}\n\n`;

			// Add class summaries
			Object.keys(groupedByClass).forEach((className) => {
				const classResults = groupedByClass[className];
				const classScores = classResults.map((r) =>
					parseInt(r.Percentage.replace("%", ""))
				);
				const avgScore = Math.round(
					classScores.reduce((a, b) => a + b, 0) / classScores.length
				);
				const bestScore = Math.max(...classScores);
				const worstScore = Math.min(...classScores);

				csvContent += `${className} CLASS SUMMARY\n`;
				csvContent += `Total Students: ${classResults.length}\n`;
				csvContent += `Average Score: ${avgScore}%\n`;
				csvContent += `Best Score: ${bestScore}%\n`;
				csvContent += `Worst Score: ${worstScore}%\n\n`;
			});

			// Add detailed results by class
			Object.keys(groupedByClass).forEach((className) => {
				csvContent += `${className} CLASS DETAILED RESULTS\n`;
				const headers = [
					"Student Name",
					"Email",
					"Class",
					"Mode",
					"Score",
					"Percentage",
					"Performance",
					"Date",
					"Time",
				];
				csvContent += headers.join(",") + "\n";

				groupedByClass[className].forEach((result) => {
					const row = headers.map((header) => {
						const value = result[header];
						return `"${String(value).replace(/"/g, '""')}"`;
					});
					csvContent += row.join(",") + "\n";
				});
				csvContent += "\n";
			});

			// Create and download file
			const encodedUri = encodeURI(csvContent);
			const link = document.createElement("a");
			link.setAttribute("href", encodedUri);
			link.setAttribute(
				"download",
				`detailed-quiz-results-${new Date().toISOString().split("T")[0]}.csv`
			);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			alert(
				`Detailed export successful! Downloaded ${exportData.length} quiz results with class summaries.`
			);
		} catch (error) {
			console.error("Error exporting detailed results:", error);
			alert("Error exporting detailed results. Please try again.");
		}
	};

	const handleExportByClass = (className) => {
		try {
			// Filter results by class
			const classResults = quizResults.filter((result) => {
				const student = students.find((s) => s.email === result.email);
				return student?.class?.toLowerCase() === className.toLowerCase();
			});

			if (classResults.length === 0) {
				alert(`No results found for ${className} class.`);
				return;
			}

			// Prepare data for export
			const exportData = classResults.map((result) => {
				const student = students.find((s) => s.email === result.email);
				const scorePercentage = Math.round(
					(result.score / result.total_questions) * 100
				);

				return {
					"Student Name": student?.name || "Unknown",
					Email: result.email,
					Class: student?.class || "Not set",
					Score: `${result.score}/${result.total_questions}`,
					Percentage: `${scorePercentage}%`,
					Performance:
						scorePercentage >= 80
							? "Excellent"
							: scorePercentage >= 60
							? "Good"
							: "Needs Improvement",
					Date: new Date(result.timestamp).toLocaleDateString(),
					Time: new Date(result.timestamp).toLocaleTimeString(),
				};
			});

			// Create CSV content
			let csvContent = "data:text/csv;charset=utf-8,";

			// Add class summary
			const classScores = exportData.map((r) =>
				parseInt(r.Percentage.replace("%", ""))
			);
			const avgScore = Math.round(
				classScores.reduce((a, b) => a + b, 0) / classScores.length
			);
			const bestScore = Math.max(...classScores);
			const worstScore = Math.min(...classScores);

			csvContent += `${className.toUpperCase()} CLASS RESULTS\n`;
			csvContent += `Total Students: ${exportData.length}\n`;
			csvContent += `Average Score: ${avgScore}%\n`;
			csvContent += `Best Score: ${bestScore}%\n`;
			csvContent += `Worst Score: ${worstScore}%\n`;
			csvContent += `Export Date: ${new Date().toLocaleDateString()}\n\n`;

			// Add headers
			const headers = [
				"Student Name",
				"Email",
				"Class",
				"Score",
				"Percentage",
				"Performance",
				"Date",
				"Time",
			];
			csvContent += headers.join(",") + "\n";

			// Add data rows
			exportData.forEach((result) => {
				const row = headers.map((header) => {
					const value = result[header];
					return `"${String(value).replace(/"/g, '""')}"`;
				});
				csvContent += row.join(",") + "\n";
			});

			// Create and download file
			const encodedUri = encodeURI(csvContent);
			const link = document.createElement("a");
			link.setAttribute("href", encodedUri);
			link.setAttribute(
				"download",
				`${className.toLowerCase()}-quiz-results-${
					new Date().toISOString().split("T")[0]
				}.csv`
			);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			alert(
				`${className} class export successful! Downloaded ${exportData.length} results.`
			);
		} catch (error) {
			console.error("Error exporting class results:", error);
			alert("Error exporting class results. Please try again.");
		}
	};

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
					<p className="text-gray-600">Loading Admin Dashboard...</p>
				</div>
			</div>
		);
	}

	return (
		<AdminShell user={user} orgName={orgName} active="dashboard">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Scope banner */}
				<div className="mb-6 rounded-xl bg-gradient-to-r from-brand-600 to-brand-800 text-white px-6 py-4 shadow-lg flex items-center justify-between flex-wrap gap-2">
						<div>
							<p className="text-xs uppercase tracking-wide text-indigo-100">
								{roleLabel(user?.role)}
							</p>
							<p className="text-lg font-semibold">
								{isSuperAdminView
									? `${orgName || "Region 70"} — all provinces`
									: orgName || "No province assigned"}
							</p>
						</div>
						{isSuperAdminView && (
							<span className="text-xs bg-white/20 px-3 py-1 rounded-full">
								{sortedOrgNames.length} province{sortedOrgNames.length === 1 ? "" : "s"} with students
							</span>
						)}
					</div>

					{/* Stats Overview */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8 w-full max-w-full">
						<div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 w-full max-w-full overflow-x-auto">
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
									<FaUsers className="text-blue-600" size={18} />
								</div>
								<div>
									<p className="text-sm text-gray-500 mb-0.5">Total Students</p>
									<p className="font-display text-3xl font-bold text-gray-900 tabular-nums">
										{stats.totalStudents}
									</p>
								</div>
							</div>
						</div>
						<div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 w-full max-w-full overflow-x-auto">
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
									<FaClipboardList className="text-emerald-600" size={18} />
								</div>
								<div>
									<p className="text-sm text-gray-500 mb-0.5">Total Quizzes</p>
									<p className="font-display text-3xl font-bold text-gray-900 tabular-nums">
										{stats.totalQuizzes}
									</p>
								</div>
							</div>
						</div>
						<div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 w-full max-w-full overflow-x-auto">
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
									<FaChartBar className="text-brand-600" size={18} />
								</div>
								<div>
									<p className="text-sm text-gray-500 mb-0.5">Average Score</p>
									<p className="font-display text-3xl font-bold text-gray-900 tabular-nums">
										{stats.averageScore}%
									</p>
								</div>
							</div>
						</div>
					</motion.div>

					{/* Quiz Results */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
						className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8 w-full max-w-full overflow-x-auto">
						<div className="flex justify-between items-center mb-6">
							<h2 className="font-display text-xl font-semibold text-gray-900">
								Recent Quiz Results
							</h2>
							<div className="flex gap-3">
								<button
									onClick={handleRefresh}
									disabled={isRefreshing}
									className="flex items-center space-x-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 transition-colors border border-brand-100 disabled:opacity-50">
									<svg
										className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										xmlns="http://www.w3.org/2000/svg">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
									</svg>
									<span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
								</button>
								<button
									onClick={() => setShowExportModal(true)}
									className="flex items-center space-x-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm">
									<FaDownload size={14} />
									<span>Export</span>
								</button>
							</div>
						</div>

						<div className="overflow-x-auto w-full max-w-full">
							<table className="w-full max-w-full">
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
											Quiz Mode
										</th>
										<th className="text-left py-3 px-4 font-medium text-gray-900">
											Score
										</th>
										<th className="text-left py-3 px-4 font-medium text-gray-900">
											Questions
										</th>
										<th className="text-left py-3 px-4 font-medium text-gray-900">
											Date & Time
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
													<span className={`px-2 py-1 rounded-full text-xs font-medium ${result.mode === "Real Quiz" ? "bg-indigo-100 text-indigo-800" : "bg-purple-100 text-purple-800"}`}>
														{result.quiz_title || result.mode}
													</span>
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
												<td className="py-3 px-4 text-gray-600 whitespace-nowrap">
													<div className="text-sm">
														{new Date(result.timestamp).toLocaleDateString()}
													</div>
													<div className="text-xs text-gray-400 mt-0.5">
														{new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
													</div>
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
						id="analytics-section"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
						className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-full">
						{/* Performance Analytics Card */}
						<div className="bg-white rounded-xl shadow-lg p-6 flex flex-col gap-6 w-full max-w-full overflow-x-auto">
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								Performance Analytics
							</h3>
							{/* Pie Chart and Stats Summary */}
							<div className="flex flex-col md:flex-row items-center gap-8 w-full max-w-full">
								{(() => {
									// Calculate performance counts from quizResults
									const performanceCounts = {
										Excellent: 0,
										Good: 0,
										"Needs Improvement": 0,
									};
									(quizResults || []).forEach((result) => {
										const percent = result.total_questions
											? result.score / result.total_questions
											: 0;
										if (percent >= 0.8) performanceCounts.Excellent += 1;
										else if (percent >= 0.6) performanceCounts.Good += 1;
										else performanceCounts["Needs Improvement"] += 1;
									});
									const pieData = Object.entries(performanceCounts)
										.map(([name, value]) => ({ name, value }))
										.filter((d) => d.value > 0);
									const COLORS = ["#34d399", "#fbbf24", "#f87171"];

									// Stats from fetched data
									const totalQuizzes = quizResults ? quizResults.length : 0;
									const averageScore =
										quizResults && quizResults.length
											? Math.round(
													quizResults.reduce(
														(acc, q) =>
															acc +
															(q.total_questions
																? (q.score / q.total_questions) * 100
																: 0),
														0
													) / quizResults.length
											  )
											: 0;
									const bestScore =
										quizResults && quizResults.length
											? Math.round(
													Math.max(
														...quizResults.map((q) =>
															q.total_questions
																? (q.score / q.total_questions) * 100
																: 0
														)
													)
											  )
											: 0;
									const recentActivity =
										quizResults && quizResults.length
											? quizResults.filter((q) => {
													const quizDate = new Date(q.timestamp);
													const now = new Date();
													const diff = (now - quizDate) / (1000 * 60 * 60 * 24);
													return diff <= 7;
											  }).length
											: 0;
									const improvement = (() => {
										// Calculate improvement as difference between last and first quiz score
										if (!quizResults || quizResults.length < 2) return 0;
										const sorted = [...quizResults].sort(
											(a, b) => new Date(a.timestamp) - new Date(b.timestamp)
										);
										const first = sorted[0];
										const last = sorted[sorted.length - 1];
										const firstScore = first.total_questions
											? (first.score / first.total_questions) * 100
											: 0;
										const lastScore = last.total_questions
											? (last.score / last.total_questions) * 100
											: 0;
										return Math.round(lastScore - firstScore);
									})();

									return (
										<>
											<div className="max-w-full overflow-x-auto">
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
											<div className="space-y-2 min-w-[180px] max-w-full">
												<div className="flex justify-between">
													<span className="text-gray-600">Total Attempts:</span>
													<span className="font-medium">{totalQuizzes}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-gray-600">Average Score:</span>
													<span className="font-medium">{averageScore}%</span>
												</div>
												<div className="flex justify-between">
													<span className="text-gray-600">
														Best Performance:
													</span>
													<span className="font-medium text-green-600">
														{bestScore}%
													</span>
												</div>
												<div className="flex justify-between">
													<span className="text-gray-600">
														Recent Activity:
													</span>
													<span className="font-medium">
														{recentActivity} quizzes (7 days)
													</span>
												</div>
												<div className="flex justify-between">
													<span className="text-gray-600">Improvement:</span>
													<span
														className={`font-medium ${
															improvement >= 0
																? "text-green-600"
																: "text-red-600"
														}`}>
														{improvement >= 0 ? "+" : ""}
														{improvement}%
													</span>
												</div>
											</div>
										</>
									);
								})()}
							</div>
							{/* Badges/Achievements */}
							<div className="mt-4 flex flex-wrap gap-2 max-w-full">
								{(quizResults?.length ?? 0) >= 10 && (
									<span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
										10 Quizzes Completed
									</span>
								)}
								{(() => {
									const averageScore =
										quizResults && quizResults.length
											? Math.round(
													quizResults.reduce(
														(acc, q) =>
															acc +
															(q.total_questions
																? (q.score / q.total_questions) * 100
																: 0),
														0
													) / quizResults.length
											  )
											: 0;
									if (averageScore >= 90) {
										return (
											<span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
												High Scorer
											</span>
										);
									}
									return null;
								})()}
								{(() => {
									const improvement =
										quizResults && quizResults.length >= 2
											? (() => {
													const sorted = [...quizResults].sort(
														(a, b) =>
															new Date(a.timestamp) - new Date(b.timestamp)
													);
													const first = sorted[0];
													const last = sorted[sorted.length - 1];
													const firstScore = first.total_questions
														? (first.score / first.total_questions) * 100
														: 0;
													const lastScore = last.total_questions
														? (last.score / last.total_questions) * 100
														: 0;
													return lastScore - firstScore;
											  })()
											: 0;
									if (improvement >= 10) {
										return (
											<span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
												Most Improved
											</span>
										);
									}
									return null;
								})()}
							</div>
							{/* Last Login/Activity */}
							<div className="mt-2 text-sm text-gray-500 max-w-full">
								Last login:{" "}
								{user?.last_sign_in_at
									? new Date(user.last_sign_in_at).toLocaleDateString()
									: "N/A"}
								&nbsp;&bull;&nbsp;Last activity:{" "}
								{quizResults && quizResults.length
									? (() => {
											const sorted = [...quizResults].sort(
												(a, b) => new Date(b.timestamp) - new Date(a.timestamp)
											);
											const last = sorted[0];
											const lastDate = new Date(last.timestamp);
											const now = new Date();
											const diffDays = Math.floor(
												(now - lastDate) / (1000 * 60 * 60 * 24)
											);
											return diffDays === 0
												? "Today"
												: diffDays === 1
												? "1 day ago"
												: `${diffDays} days ago`;
									  })()
									: "No activity"}
							</div>
						</div>
						{/* Quiz Activity Card */}
						<div className="bg-white rounded-xl shadow-lg p-6 flex flex-col gap-6 w-full max-w-full overflow-x-auto">
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								Quiz Activity
							</h3>
							{/* Recent Quiz Results Table */}
							<div className="overflow-x-auto w-full max-w-full">
								<table className="w-full text-sm border rounded-lg mb-4 max-w-full">
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
										{(quizResults || []).slice(0, 3).map((result, idx) => {
											const percent = result.total_questions
												? (result.score / result.total_questions) * 100
												: 0;
											let status = "";
											let badge = "";
											if (percent >= 80) {
												status = "Excellent";
												badge = "🏆";
											} else if (percent >= 60) {
												status = "Good";
												badge = "👍";
											} else {
												status = "Needs Improvement";
												badge = "📈";
											}
											return (
												<tr
													key={result.id || idx}
													className="border-b hover:bg-gray-50">
													<td className="py-2 px-3 text-gray-600">
														{result.timestamp
															? new Date(result.timestamp).toLocaleDateString()
															: ""}
													</td>
													<td className="py-2 px-3 text-gray-600">
														{result.quiz_title || "Quiz"}
													</td>
													<td className="py-2 px-3">
														<span
															className={`px-2 py-1 rounded-full text-xs font-medium ${
																percent >= 80
																	? "bg-green-100 text-green-800"
																	: percent >= 60
																	? "bg-yellow-100 text-yellow-800"
																	: "bg-red-100 text-red-800"
															}`}>
															{Math.round(percent)}%
														</span>
													</td>
													<td className="py-2 px-3 text-gray-600">
														{result.score}/{result.total_questions}
													</td>
													<td className="py-2 px-3">
														<span
															className={`px-2 py-1 rounded-full text-xs font-medium ${
																percent >= 80
																	? "bg-green-100 text-green-800"
																	: percent >= 60
																	? "bg-yellow-100 text-yellow-800"
																	: "bg-red-100 text-red-800"
															}`}>
															{status}
														</span>
													</td>
													<td className="py-2 px-3 text-lg">{badge}</td>
												</tr>
											);
										})}
										{(!quizResults || quizResults.length === 0) && (
											<tr>
												<td
													colSpan={6}
													className="py-4 text-center text-gray-400">
													No recent quiz activity.
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
							{/* Mini Trend Chart */}
							<div className="mb-4 w-full max-w-full overflow-x-auto">
								<h4 className="text-md font-semibold text-gray-800 mb-2">
									Score Trend
								</h4>
								<div className="flex justify-center w-full max-w-full">
									<LineChart
										width={300}
										height={120}
										data={
											(quizResults || [])
												.slice(0, 5)
												.reverse()
												.map((result) => ({
													date: result.timestamp
														? new Date(result.timestamp).toLocaleDateString()
														: "",
													score: result.total_questions
														? Math.round(
																(result.score / result.total_questions) * 100
														  )
														: 0,
												})) || []
										}>
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
							<div className="mb-2 w-full max-w-full">
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
							<div className="flex justify-end w-full max-w-full">
								<button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
									Send Feedback
								</button>
							</div>
						</div>
					</motion.div>
			</div>

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
										<div className="flex justify-between">
											<span className="text-gray-600">Province:</span>
											<span className="font-medium">
												{selectedStudent.orgName || "Not assigned"}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Zone / Area / Parish:</span>
											<span className="font-medium">
												{[selectedStudent.zone, selectedStudent.area, selectedStudent.parish]
													.filter(Boolean)
													.join(" · ") || "Not set"}
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
															<th className="py-2 px-3 text-left">Date & Time</th>
															<th className="py-2 px-3 text-left">Quiz / Mode</th>
															<th className="py-2 px-3 text-left">Score</th>
															<th className="py-2 px-3 text-left">Questions</th>
															<th className="py-2 px-3 text-left">Status</th>
														</tr>
													</thead>
													<tbody>
														{studentQuizResults.map((result) => {
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
																	<td className="py-2 px-3 whitespace-nowrap">
																		<div className="text-gray-600 text-sm">
																			{new Date(result.timestamp).toLocaleDateString()}
																		</div>
																		<div className="text-gray-400 text-xs mt-0.5">
																			{new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
																		</div>
																	</td>
																	<td className="py-2 px-3">
																		<span className={`px-2 py-1 rounded-full text-xs font-medium ${result.mode === "Real Quiz" ? "bg-indigo-100 text-indigo-800" : "bg-purple-100 text-purple-700"}`}>
																			{result.quiz_title || result.mode}
																		</span>
																	</td>
																	<td className="py-2 px-3">
																		<span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(scorePercentage)}`}>
																			{scorePercentage}%
																		</span>
																	</td>
																	<td className="py-2 px-3 text-gray-600 text-xs">
																		{result.score}/{result.total_questions}
																	</td>
																	<td className="py-2 px-3">
																		<span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(scorePercentage)}`}>
																			{scorePercentage >= 80 ? "Excellent" : scorePercentage >= 60 ? "Good" : "Needs Improvement"}
																		</span>
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

			{/* Export Modal */}
			{showExportModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
						{/* Modal Header */}
						<div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
							<div className="flex items-center space-x-3">
								<div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
									<FaDownload className="text-white text-xl" />
								</div>
								<div>
									<h2 className="text-xl font-semibold text-gray-900">
										Export Quiz Results
									</h2>
									<p className="text-sm text-gray-500">
										Choose your export format
									</p>
								</div>
							</div>
							<button
								onClick={() => setShowExportModal(false)}
								className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
								<FaTimes size={20} />
							</button>
						</div>

						{/* Modal Content */}
						<div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] custom-scrollbar">
							<div className="space-y-6">
								{/* Export Options */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{/* All Results */}
									<div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
										<h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
											<FaDownload className="mr-2 text-purple-600" />
											All Results
										</h3>
										<p className="text-sm text-gray-600 mb-4">
											Export all quiz results grouped by class
										</p>
										<button
											onClick={() => {
												handleExportResults();
												setShowExportModal(false);
											}}
											className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
											Export All ({quizResults.length} results)
										</button>
									</div>

									{/* Detailed Results */}
									<div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-blue-200">
										<h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
											<FaChartBar className="mr-2 text-blue-600" />
											Detailed Report
										</h3>
										<p className="text-sm text-gray-600 mb-4">
											Export with class summaries and statistics
										</p>
										<button
											onClick={() => {
												handleExportDetailedResults();
												setShowExportModal(false);
											}}
											className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
											Export Detailed
										</button>
									</div>
								</div>

								{/* Export by Class */}
								<div className="bg-gray-50 rounded-xl p-6">
									<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
										<FaUsers className="mr-2 text-gray-600" />
										Export by Class
									</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										{availableClasses.map((className) => {
											const classResults = quizResults.filter((result) => {
												const student = students.find(
													(s) => s.email === result.email
												);
												return (
													student?.class?.toLowerCase() ===
													className.toLowerCase()
												);
											});

											return (
												<button
													key={className}
													onClick={() => {
														handleExportByClass(className);
														setShowExportModal(false);
													}}
													className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
													<div className="flex items-center space-x-2">
														<span className="font-medium text-gray-900">
															{className}
														</span>
														<span className="text-sm text-gray-500">
															({classResults.length} results)
														</span>
													</div>
													<FaDownload className="text-purple-600" />
												</button>
											);
										})}
									</div>
								</div>

								{/* Export Summary */}
								<div className="bg-green-50 rounded-xl p-4 border border-green-200">
									<h4 className="font-semibold text-green-800 mb-2">
										Export Summary
									</h4>
									<div className="text-sm text-green-700 space-y-1">
										<p>• Total Results: {quizResults.length}</p>
										<p>
											• Classes Available: {availableClasses.length}
										</p>
										<p>
											• Date Range:{" "}
											{quizResults.length > 0
												? `${new Date(
														Math.min(
															...quizResults.map((r) => new Date(r.timestamp))
														)
												  ).toLocaleDateString()} - ${new Date(
														Math.max(
															...quizResults.map((r) => new Date(r.timestamp))
														)
												  ).toLocaleDateString()}`
												: "No data"}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</AdminShell>
	);
};

export default AdminDashboard;
