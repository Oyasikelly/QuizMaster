"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import {
	FaUser,
	FaEnvelope,
	FaGraduationCap,
	FaChurch,
	FaClipboardList,
	FaEdit,
	FaTrash,
	FaSave,
	FaTimes,
	FaSearch,
	FaFilter,
	FaEye,
	FaExclamationTriangle,
	FaCheck,
	FaTimes as FaTimesIcon,
} from "react-icons/fa";
import { FaTrophy, FaHistory, FaChartBar } from "react-icons/fa";

const withTimeout = (promise, ms) =>
	Promise.race([
		promise,
		new Promise((_, reject) =>
			setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
		),
	]);

// initialEditId/initialDeleteId: the Dashboard's Delete button and the
// Student Detail page's Edit button both deep-link here (now
// /admin/students?delete=<id> / ?edit=<id>, previously
// /admin/settings?tab=students&...). This component owns its own
// edit/delete UI, so it's the one place that can actually open it —
// the page just hands over which id to act on once its own student
// list has loaded.
const StudentManagement = ({ initialEditId, initialDeleteId } = {}) => {
	const [students, setStudents] = useState([]);
	const [quizResults, setQuizResults] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterClass, setFilterClass] = useState("all");
	const [editingStudent, setEditingStudent] = useState(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [studentToDelete, setStudentToDelete] = useState(null);
	const [selectedStudent, setSelectedStudent] = useState(null);
	const [showStudentDetails, setShowStudentDetails] = useState(false);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState(false);

	useEffect(() => {
		loadData();
	}, []);

	// Applies the deep-linked action once, the first time the target
	// student actually shows up in a loaded list — guarded by a ref so
	// closing the resulting form/modal doesn't reopen it on the next
	// unrelated re-render.
	const appliedInitialRef = useRef(false);
	useEffect(() => {
		if (appliedInitialRef.current || students.length === 0) return;
		if (initialEditId) {
			const target = students.find((s) => s.id === initialEditId);
			if (target) {
				setEditingStudent({ ...target });
				appliedInitialRef.current = true;
			}
		} else if (initialDeleteId) {
			const target = students.find((s) => s.id === initialDeleteId);
			if (target) {
				setStudentToDelete(target);
				setShowDeleteModal(true);
				appliedInitialRef.current = true;
			}
		}
	}, [students, initialEditId, initialDeleteId]);

	const loadData = async () => {
		try {
			setLoading(true);
			setLoadError(false);
			// Uses the scoped RPCs rather than plain table reads — see the
			// note in admin/dashboard/page.jsx's loadDashboardData for why.
			const { data: studentsData } = await withTimeout(supabase.rpc("get_scoped_students"), 10000);
			const { data: quizData } = await withTimeout(supabase.rpc("get_scoped_quiz_results"), 10000);

			// Calculate submission counts for each student based on the unified row
			const studentsWithCounts =
				studentsData?.map((student) => {
					const studentRows = quizData?.filter((result) => result.student_id === student.id) || [];
					let submissionCount = 0;
					let realScore = null;
					
					studentRows.forEach(resultRow => {
						if (resultRow.real_total > 0) {
							submissionCount++;
							if (realScore === null) {
								realScore = Math.round((resultRow.real_score / resultRow.real_total) * 100);
							}
						}
						if (resultRow.practice_normal_total > 0) submissionCount++;
						if (resultRow.practice_medium_total > 0) submissionCount++;
						if (resultRow.practice_hard_total > 0) submissionCount++;
						if (resultRow.practice_entire_total > 0) submissionCount++;
					});

					return { ...student, submissionCount, realScore };
				}) || [];

			setStudents(studentsWithCounts);
			setQuizResults(quizData || []);
		} catch (error) {
			console.error("Error loading data:", error);
			if (
				error.message?.includes("timed out") ||
				error.message?.includes("fetch") ||
				error.message?.includes("network")
			) {
				setLoadError(true);
			}
		} finally {
			setLoading(false);
		}
	};

	const handleEditStudent = (student) => {
		setEditingStudent({ ...student });
	};

	const handleViewStudent = (student) => {
		setSelectedStudent(student);
		setShowStudentDetails(true);
	};

	const handleSaveStudent = async () => {
		if (!editingStudent) return;

		try {
			const { data, error } = await supabase
				.from("users_profile")
				.update({
					name: editingStudent.name,
					email: editingStudent.email,
					class: editingStudent.class,
					denomination: editingStudent.denomination,
				})
				.eq("id", editingStudent.id)
				.select();

			if (error) {
				alert("Error updating student: " + error.message);
				return;
			}

			// An RLS mismatch doesn't error — it matches zero rows, which
			// looks identical to success unless checked explicitly.
			if (!data || data.length === 0) {
				alert("Update didn't apply — no permission to change this student's record.");
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

	const filteredStudents = students.filter((student) => {
		const matchesSearch =
			student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			student.email?.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesFilter =
			filterClass === "all" || student.class === filterClass;
		return matchesSearch && matchesFilter;
	});

	if (loadError) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border border-gray-100">
					<FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
					<h2 className="text-2xl font-bold text-gray-800 mb-2">Network Error</h2>
					<p className="text-gray-600 mb-8 leading-relaxed">
						We couldn't connect to the server. Please check your internet connection and try again.
					</p>
					<button
						onClick={loadData}
						className="w-full px-4 py-3 bg-brand-600 text-white rounded-lg shadow-lg hover:bg-brand-700 transition-colors font-medium">
						Retry Connection
					</button>
				</div>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="text-center">
					<div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">Loading students...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Search and Filter */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
					<input
						type="text"
						placeholder="Search students by name or email..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
					/>
				</div>
				<select
					value={filterClass}
					onChange={(e) => setFilterClass(e.target.value)}
					className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent">
					<option value="all">All Classes</option>
					<option value="yaya">Yaya</option>
					<option value="adult">Adult</option>
					<option value="adults">Adults</option>
				</select>
			</div>

			{/* Students Table */}
			<div className="bg-white rounded-xl shadow-lg overflow-hidden">
				<div className="overflow-x-auto">
					<table className="hidden md:table w-full">
						<thead className="bg-gray-50">
							<tr>
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
									Denomination
								</th>
								<th className="text-left py-3 px-4 font-medium text-gray-900">
									Real Quiz Score
								</th>
								<th className="text-left py-3 px-4 font-medium text-gray-900">
									Actions
								</th>
							</tr>
						</thead>
						<tbody>
							{filteredStudents.map((student) => (
								<tr
									key={student.id}
									className="border-b border-gray-100 hover:bg-gray-50">
									<td className="py-3 px-4">
										{editingStudent?.id === student.id ? (
											<input
												type="text"
												value={editingStudent.name}
												onChange={(e) =>
													setEditingStudent({
														...editingStudent,
														name: e.target.value,
													})
												}
												className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500"
											/>
										) : (
											<div className="flex items-center space-x-3">
												<div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-brand-600 rounded-full flex items-center justify-center">
													<span className="text-white text-sm font-medium">
														{student.name?.charAt(0) || "U"}
													</span>
												</div>
												<span className="font-medium text-gray-900">
													{student.name}
												</span>
											</div>
										)}
									</td>
									<td className="py-3 px-4">
										{editingStudent?.id === student.id ? (
											<input
												type="email"
												value={editingStudent.email}
												onChange={(e) =>
													setEditingStudent({
														...editingStudent,
														email: e.target.value,
													})
												}
												className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500"
											/>
										) : (
											<span className="text-gray-600">{student.email}</span>
										)}
									</td>
									<td className="py-3 px-4">
										{editingStudent?.id === student.id ? (
											<select
												value={editingStudent.class || ""}
												onChange={(e) =>
													setEditingStudent({
														...editingStudent,
														class: e.target.value,
													})
												}
												className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500">
												<option value="">Select Class</option>
												<option value="yaya">Yaya</option>
												<option value="adult">Adult</option>
												<option value="adults">Adults</option>
											</select>
										) : (
											<span className="text-gray-600">
												{student.class || "Not set"}
											</span>
										)}
									</td>
									<td className="py-3 px-4">
										{editingStudent?.id === student.id ? (
											<input
												type="text"
												value={editingStudent.denomination || ""}
												onChange={(e) =>
													setEditingStudent({
														...editingStudent,
														denomination: e.target.value,
													})
												}
												className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500"
											/>
										) : (
											<span className="text-gray-600">
												{student.denomination || "Not set"}
											</span>
										)}
									</td>
									<td className="py-3 px-4">
										<span className="flex items-center space-x-2">
											<FaTrophy className={student.realScore !== null ? "text-yellow-500" : "text-gray-400"} />
											<span className="font-medium text-gray-900">
												{student.realScore !== null ? `${student.realScore}%` : "Not Taken"}
											</span>
										</span>
									</td>
									<td className="py-3 px-4">
										<div className="flex space-x-2">
											{editingStudent?.id === student.id ? (
												<>
													<button
														onClick={handleSaveStudent}
														className="p-1 text-green-600 hover:text-green-800">
														<FaSave size={14} />
													</button>
													<button
														onClick={() => setEditingStudent(null)}
														className="p-1 text-gray-600 hover:text-gray-800">
														<FaTimesIcon size={14} />
													</button>
												</>
											) : (
												<>
													<button
														onClick={() => handleViewStudent(student)}
														className="p-1 text-brand-600 hover:text-brand-800"
														title="View Details">
														<FaEye size={14} />
													</button>
													<button
														onClick={() => handleEditStudent(student)}
														className="p-1 text-blue-600 hover:text-blue-800"
														title="Edit">
														<FaEdit size={14} />
													</button>
													<button
														onClick={() => {
															setStudentToDelete(student);
															setShowDeleteModal(true);
														}}
														className="p-1 text-red-600 hover:text-red-800"
														title="Delete">
														<FaTrash size={14} />
													</button>
												</>
											)}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Mobile cards */}
				<div className="md:hidden divide-y divide-gray-100">
					{filteredStudents.map((student) => {
						const isEditing = editingStudent?.id === student.id;
						return (
							<div key={student.id} className="p-4">
								{isEditing ? (
									<div className="space-y-2">
										<input
											type="text"
											value={editingStudent.name}
											onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
											placeholder="Name"
											className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
										/>
										<input
											type="email"
											value={editingStudent.email}
											onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
											placeholder="Email"
											className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
										/>
										<select
											value={editingStudent.class || ""}
											onChange={(e) => setEditingStudent({ ...editingStudent, class: e.target.value })}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500">
											<option value="">Select Class</option>
											<option value="yaya">Yaya</option>
											<option value="adult">Adult</option>
											<option value="adults">Adults</option>
										</select>
										<input
											type="text"
											value={editingStudent.denomination || ""}
											onChange={(e) => setEditingStudent({ ...editingStudent, denomination: e.target.value })}
											placeholder="Denomination"
											className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
										/>
										<div className="flex gap-2 pt-1">
											<button
												onClick={handleSaveStudent}
												className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">
												<FaSave size={12} /> Save
											</button>
											<button
												onClick={() => setEditingStudent(null)}
												className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">
												<FaTimesIcon size={12} /> Cancel
											</button>
										</div>
									</div>
								) : (
									<>
										<div className="flex items-center gap-3 mb-2">
											<div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-brand-600 rounded-full flex items-center justify-center flex-shrink-0">
												<span className="text-white text-sm font-medium">
													{student.name?.charAt(0) || "U"}
												</span>
											</div>
											<div className="min-w-0">
												<p className="font-medium text-gray-900 truncate">{student.name}</p>
												<p className="text-xs text-gray-500 truncate">{student.email}</p>
											</div>
										</div>
										<div className="flex flex-wrap gap-2 text-xs mb-3">
											<span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
												{student.class || "Class not set"}
											</span>
											<span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
												{student.denomination || "Denomination not set"}
											</span>
											<span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
												<FaTrophy size={10} className={student.realScore !== null ? "text-yellow-500" : "text-gray-400"} />
												{student.realScore !== null ? `${student.realScore}%` : "Not Taken"}
											</span>
										</div>
										<div className="flex gap-3">
											<button
												onClick={() => handleViewStudent(student)}
												className="flex items-center gap-1 text-brand-600 text-sm font-medium">
												<FaEye size={14} /> View
											</button>
											<button
												onClick={() => handleEditStudent(student)}
												className="flex items-center gap-1 text-blue-600 text-sm font-medium">
												<FaEdit size={14} /> Edit
											</button>
											<button
												onClick={() => {
													setStudentToDelete(student);
													setShowDeleteModal(true);
												}}
												className="flex items-center gap-1 text-red-600 text-sm font-medium">
												<FaTrash size={14} /> Delete
											</button>
										</div>
									</>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{/* Student Details Modal */}
			{showStudentDetails && selectedStudent && (
				<>
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
						<div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
							{/* Header */}
							<div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
								<div className="flex items-center space-x-4">
									<div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-brand-600 rounded-full flex items-center justify-center">
										<span className="text-white text-lg font-medium">
											{selectedStudent.name?.charAt(0) || "U"}
										</span>
									</div>
									<div>
										<h2 className="text-xl font-semibold text-gray-900">
											{selectedStudent.name}
										</h2>
										<p className="text-gray-600">{selectedStudent.email}</p>
									</div>
								</div>
								<button
									onClick={() => setShowStudentDetails(false)}
									className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
									<FaTimesIcon size={20} />
								</button>
							</div>

							{/* Content */}
							<div className="p-6 space-y-6">
								{/* Student Information */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="bg-gray-50 rounded-lg p-4">
										<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
											<FaUser className="mr-2 text-brand-600" />
											Personal Information
										</h3>
										<div className="space-y-3">
											<div>
												<label className="text-sm font-medium text-gray-700">
													Full Name
												</label>
												<p className="text-gray-900">{selectedStudent.name}</p>
											</div>
											<div>
												<label className="text-sm font-medium text-gray-700">
													Email
												</label>
												<p className="text-gray-900">{selectedStudent.email}</p>
											</div>
											<div>
												<label className="text-sm font-medium text-gray-700">
													Class
												</label>
												<p className="text-gray-900">
													{selectedStudent.class || "Not set"}
												</p>
											</div>
											<div>
												<label className="text-sm font-medium text-gray-700">
													Denomination
												</label>
												<p className="text-gray-900">
													{selectedStudent.denomination || "Not set"}
												</p>
											</div>
											<div>
												<label className="text-sm font-medium text-gray-700">
													Registration Date
												</label>
												<p className="text-gray-900">
													{selectedStudent.created_at
														? new Date(
																selectedStudent.created_at
														  ).toLocaleDateString()
														: "Not available"}
												</p>
											</div>
										</div>
									</div>

									<div className="bg-gray-50 rounded-lg p-4">
										<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
											<FaChartBar className="mr-2 text-blue-600" />
											Performance Overview
										</h3>
										<div className="space-y-3">
											<div>
												<label className="text-sm font-medium text-gray-700">
													Total Quiz Submissions
												</label>
												<p className="text-2xl font-bold text-blue-600">
													{selectedStudent.submissionCount || 0}
												</p>
											</div>
											<div>
												<label className="text-sm font-medium text-gray-700">
													Average Score
												</label>
												<p className="text-2xl font-bold text-green-600">
													{(() => {
														const resultRow = quizResults.find(
															(result) => result.student_id === selectedStudent.id
														);
														if (!resultRow || !resultRow.real_total) return "N/A";
														const avgScore = resultRow.real_score / resultRow.real_total;
														return `${Math.round(avgScore * 100)}%`;
													})()}
												</p>
											</div>
											<div>
												<label className="text-sm font-medium text-gray-700">
													Best Score
												</label>
												<p className="text-2xl font-bold text-brand-600">
													{(() => {
														const resultRow = quizResults.find(
															(result) => result.student_id === selectedStudent.id
														);
														if (!resultRow || !resultRow.real_total) return "N/A";
														const bestScore = resultRow.real_score / resultRow.real_total;
														return `${Math.round(bestScore * 100)}%`;
													})()}
												</p>
											</div>
										</div>
									</div>
								</div>

								{/* Quiz History */}
								<div className="bg-white border border-gray-200 rounded-lg">
									<div className="border-b border-gray-200 px-6 py-4">
										<h3 className="text-lg font-semibold text-gray-900 flex items-center">
											<FaHistory className="mr-2 text-brand-600" />
											Quiz History
										</h3>
									</div>
									<div className="overflow-x-auto">
										<table className="w-full">
											<thead className="bg-gray-50">
												<tr>
													<th className="text-left py-3 px-6 font-medium text-gray-900">
														Date
													</th>
													<th className="text-left py-3 px-6 font-medium text-gray-900">
														Mode
													</th>
													<th className="text-left py-3 px-6 font-medium text-gray-900">
														Score
													</th>
													<th className="text-left py-3 px-6 font-medium text-gray-900">
														Questions
													</th>
													<th className="text-left py-3 px-6 font-medium text-gray-900">
														Percentage
													</th>
													<th className="text-left py-3 px-6 font-medium text-gray-900">
														Status
													</th>
												</tr>
											</thead>
											<tbody>
												{(() => {
													const resultRow = quizResults.find(
														(result) => result.student_id === selectedStudent.id
													);
													
													const attempts = [];
													if (resultRow) {
														if (resultRow.real_total > 0) attempts.push({ id: 1, mode: "Real Quiz", score: resultRow.real_score, total: resultRow.real_total, timestamp: resultRow.timestamp });
														if (resultRow.practice_normal_total > 0) attempts.push({ id: 2, mode: resultRow.lesson ? `Practice: ${resultRow.lesson}` : "Practice (Normal)", score: resultRow.practice_normal_score, total: resultRow.practice_normal_total, timestamp: resultRow.timestamp });
														if (resultRow.practice_medium_total > 0) attempts.push({ id: 3, mode: resultRow.lesson ? `Practice: ${resultRow.lesson}` : "Practice (Medium)", score: resultRow.practice_medium_score, total: resultRow.practice_medium_total, timestamp: resultRow.timestamp });
														if (resultRow.practice_hard_total > 0) attempts.push({ id: 4, mode: resultRow.lesson ? `Practice: ${resultRow.lesson}` : "Practice (Hard)", score: resultRow.practice_hard_score, total: resultRow.practice_hard_total, timestamp: resultRow.timestamp });
														if (resultRow.practice_entire_total > 0) attempts.push({ id: 5, mode: "Practice (Entire Year)", score: resultRow.practice_entire_score, total: resultRow.practice_entire_total, timestamp: resultRow.timestamp });
													}

													if (attempts.length === 0) {
														return (
															<tr>
																<td
																	colSpan="6"
																	className="py-8 text-center text-gray-500">
																	No quiz submissions found for this student.
																</td>
															</tr>
														);
													}
													return attempts
														.sort(
															(a, b) =>
																new Date(b.timestamp) - new Date(a.timestamp)
														)
														.map((attempt) => {
															const percentage =
																(attempt.score / attempt.total) * 100;
															const status =
																percentage >= 80
																	? "Excellent"
																	: percentage >= 60
																	? "Good"
																	: percentage >= 40
																	? "Fair"
																	: "Needs Improvement";
															const statusColor =
																percentage >= 80
																	? "text-green-600 bg-green-100"
																	: percentage >= 60
																	? "text-blue-600 bg-blue-100"
																	: percentage >= 40
																	? "text-yellow-600 bg-yellow-100"
																	: "text-red-600 bg-red-100";

															return (
																<tr
																	key={attempt.id}
																	className="border-b border-gray-100 hover:bg-gray-50">
																	<td className="py-3 px-6 text-gray-900">
																		{new Date(
																			attempt.timestamp
																		).toLocaleDateString()}
																	</td>
																	<td className="py-3 px-6 font-medium text-gray-900">
																		{attempt.mode}
																	</td>
																	<td className="py-3 px-6 text-gray-900">
																		{attempt.score}/{attempt.total}
																	</td>
																	<td className="py-3 px-6 text-gray-900">
																		{attempt.total}
																	</td>
																	<td className="py-3 px-6">
																		<span
																			className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
																			{Math.round(percentage)}%
																		</span>
																	</td>
																	<td className="py-3 px-6">
																		<span
																			className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
																			{status}
																		</span>
																	</td>
																</tr>
															);
														});
												})()}
											</tbody>
										</table>
									</div>
								</div>

								{/* Performance Analytics */}
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
										<div className="flex items-center justify-between">
											<div>
												<p className="text-sm opacity-90">Total Submissions</p>
												<p className="text-2xl font-bold">
													{selectedStudent.submissionCount || 0}
												</p>
											</div>
											<FaClipboardList className="text-2xl opacity-80" />
										</div>
									</div>
									<div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
										<div className="flex items-center justify-between">
											<div>
												<p className="text-sm opacity-90">Average Score</p>
												<p className="text-2xl font-bold">
													{(() => {
														const resultRow = quizResults.find(
															(result) => result.student_id === selectedStudent.id
														);
														if (!resultRow) return "N/A";
														const attempts = [];
														if (resultRow.real_total > 0) attempts.push(resultRow.real_score / resultRow.real_total);
														if (resultRow.practice_normal_total > 0) attempts.push(resultRow.practice_normal_score / resultRow.practice_normal_total);
														if (resultRow.practice_medium_total > 0) attempts.push(resultRow.practice_medium_score / resultRow.practice_medium_total);
														if (resultRow.practice_hard_total > 0) attempts.push(resultRow.practice_hard_score / resultRow.practice_hard_total);
														if (resultRow.practice_entire_total > 0) attempts.push(resultRow.practice_entire_score / resultRow.practice_entire_total);
														
														if (attempts.length === 0) return "N/A";
														const avgScore = attempts.reduce((a, b) => a + b, 0) / attempts.length;
														return `${Math.round(avgScore * 100)}%`;
													})()}
												</p>
											</div>
											<FaChartBar className="text-2xl opacity-80" />
										</div>
									</div>
									<div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-lg p-4 text-white">
										<div className="flex items-center justify-between">
											<div>
												<p className="text-sm opacity-90">Best Performance</p>
												<p className="text-2xl font-bold">
													{(() => {
														const resultRow = quizResults.find(
															(result) => result.student_id === selectedStudent.id
														);
														if (!resultRow) return "N/A";
														const attempts = [];
														if (resultRow.real_total > 0) attempts.push(resultRow.real_score / resultRow.real_total);
														if (resultRow.practice_normal_total > 0) attempts.push(resultRow.practice_normal_score / resultRow.practice_normal_total);
														if (resultRow.practice_medium_total > 0) attempts.push(resultRow.practice_medium_score / resultRow.practice_medium_total);
														if (resultRow.practice_hard_total > 0) attempts.push(resultRow.practice_hard_score / resultRow.practice_hard_total);
														if (resultRow.practice_entire_total > 0) attempts.push(resultRow.practice_entire_score / resultRow.practice_entire_total);
														
														if (attempts.length === 0) return "N/A";
														const bestScore = Math.max(...attempts);
														return `${Math.round(bestScore * 100)}%`;
													})()}
												</p>
											</div>
											<FaTrophy className="text-2xl opacity-80" />
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</>
			)}

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
	);
};

export default StudentManagement;
