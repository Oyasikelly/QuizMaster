"use client";

import { useState, useEffect } from "react";
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

const StudentManagement = () => {
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

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {
			setLoading(true);
			// Load students
			const { data: studentsData } = await supabase
				.from("users_profile")
				.select("*")
				.eq("role", "student");

			// Load quiz results
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

	const filteredStudents = students.filter((student) => {
		const matchesSearch =
			student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			student.email?.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesFilter =
			filterClass === "all" || student.class === filterClass;
		return matchesSearch && matchesFilter;
	});

	if (loading) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="text-center">
					<div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
						className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
					/>
				</div>
				<select
					value={filterClass}
					onChange={(e) => setFilterClass(e.target.value)}
					className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
					<option value="all">All Classes</option>
					<option value="yaya">Yaya</option>
					<option value="adult">Adult</option>
					<option value="adults">Adults</option>
				</select>
			</div>

			{/* Students Table */}
			<div className="bg-white rounded-xl shadow-lg overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full">
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
									Quiz Submissions
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
												className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
											/>
										) : (
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
												className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
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
												className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500">
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
												className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
											/>
										) : (
											<span className="text-gray-600">
												{student.denomination || "Not set"}
											</span>
										)}
									</td>
									<td className="py-3 px-4">
										<span className="flex items-center space-x-2">
											<FaClipboardList className="text-blue-500" />
											<span className="font-medium text-gray-900">
												{student.submissionCount || 0}
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
														className="p-1 text-purple-600 hover:text-purple-800"
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
			</div>

			{/* Student Details Modal */}
			{showStudentDetails && selectedStudent && (
				<>
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
						<div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
							{/* Header */}
							<div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
								<div className="flex items-center space-x-4">
									<div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
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
											<FaUser className="mr-2 text-purple-600" />
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
														const studentResults = quizResults.filter(
															(result) =>
																result.student_id === selectedStudent.id
														);
														if (studentResults.length === 0) return "N/A";
														const avgScore =
															studentResults.reduce(
																(sum, result) =>
																	sum + result.score / result.total_questions,
																0
															) / studentResults.length;
														return `${Math.round(avgScore * 100)}%`;
													})()}
												</p>
											</div>
											<div>
												<label className="text-sm font-medium text-gray-700">
													Best Score
												</label>
												<p className="text-2xl font-bold text-purple-600">
													{(() => {
														const studentResults = quizResults.filter(
															(result) =>
																result.student_id === selectedStudent.id
														);
														if (studentResults.length === 0) return "N/A";
														const bestScore = Math.max(
															...studentResults.map(
																(result) =>
																	result.score / result.total_questions
															)
														);
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
											<FaHistory className="mr-2 text-indigo-600" />
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
													const studentResults = quizResults.filter(
														(result) => result.student_id === selectedStudent.id
													);
													if (studentResults.length === 0) {
														return (
															<tr>
																<td
																	colSpan="5"
																	className="py-8 text-center text-gray-500">
																	No quiz submissions found for this student.
																</td>
															</tr>
														);
													}
													return studentResults
														.sort(
															(a, b) =>
																new Date(b.timestamp) - new Date(a.timestamp)
														)
														.map((result) => {
															const percentage =
																(result.score / result.total_questions) * 100;
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
																	key={result.id}
																	className="border-b border-gray-100 hover:bg-gray-50">
																	<td className="py-3 px-6 text-gray-900">
																		{new Date(
																			result.timestamp
																		).toLocaleDateString()}
																	</td>
																	<td className="py-3 px-6 text-gray-900">
																		{result.score}/{result.total_questions}
																	</td>
																	<td className="py-3 px-6 text-gray-900">
																		{result.total_questions}
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
														const studentResults = quizResults.filter(
															(result) =>
																result.student_id === selectedStudent.id
														);
														if (studentResults.length === 0) return "N/A";
														const avgScore =
															studentResults.reduce(
																(sum, result) =>
																	sum + result.score / result.total_questions,
																0
															) / studentResults.length;
														return `${Math.round(avgScore * 100)}%`;
													})()}
												</p>
											</div>
											<FaChartBar className="text-2xl opacity-80" />
										</div>
									</div>
									<div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
										<div className="flex items-center justify-between">
											<div>
												<p className="text-sm opacity-90">Best Performance</p>
												<p className="text-2xl font-bold">
													{(() => {
														const studentResults = quizResults.filter(
															(result) =>
																result.student_id === selectedStudent.id
														);
														if (studentResults.length === 0) return "N/A";
														const bestScore = Math.max(
															...studentResults.map(
																(result) =>
																	result.score / result.total_questions
															)
														);
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
