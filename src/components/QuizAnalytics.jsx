"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import {
	FaChartBar,
	FaChartLine,
	FaTrophy,
	FaUsers,
	FaClipboardList,
	FaCalendar,
	FaClock,
	FaMedal,
	FaExclamationTriangle,
	FaCheck,
	FaTimes,
	FaDownload,
	FaFilter,
} from "react-icons/fa";

const QuizAnalytics = () => {
	const [quizResults, setQuizResults] = useState([]);
	const [students, setStudents] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filterPeriod, setFilterPeriod] = useState("all");
	const [filterClass, setFilterClass] = useState("all");

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {
			setLoading(true);
			// Load quiz results
			const { data: quizData } = await supabase
				.from("quiz_results")
				.select("*")
				.order("timestamp", { ascending: false });

			// Load students
			const { data: studentsData } = await supabase
				.from("users_profile")
				.select("*")
				.eq("role", "student");

			setQuizResults(quizData || []);
			setStudents(studentsData || []);
		} catch (error) {
			console.error("Error loading analytics data:", error);
		} finally {
			setLoading(false);
		}
	};

	const getFilteredResults = () => {
		let filtered = [...quizResults];

		// Filter by period
		if (filterPeriod !== "all") {
			const now = new Date();
			const periodMap = {
				week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
				month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
				quarter: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
			};
			if (periodMap[filterPeriod]) {
				filtered = filtered.filter(
					(result) => new Date(result.timestamp) >= periodMap[filterPeriod]
				);
			}
		}

		// Filter by class
		if (filterClass !== "all") {
			const studentIds = students
				.filter((student) => student.class === filterClass)
				.map((student) => student.id);
			filtered = filtered.filter((result) =>
				studentIds.includes(result.student_id)
			);
		}

		return filtered;
	};

	const calculateStats = (results) => {
		if (!results.length)
			return {
				totalQuizzes: 0,
				averageScore: 0,
				bestScore: 0,
				totalStudents: 0,
			};

		const totalQuizzes = results.length;
		const averageScore = Math.round(
			results.reduce(
				(sum, quiz) => sum + (quiz.score / quiz.total_questions) * 100,
				0
			) / totalQuizzes
		);
		const bestScore = Math.max(
			...results.map((quiz) => (quiz.score / quiz.total_questions) * 100)
		);
		const uniqueStudents = new Set(results.map((result) => result.student_id))
			.size;

		return {
			totalQuizzes,
			averageScore,
			bestScore,
			totalStudents: uniqueStudents,
		};
	};

	const getPerformanceDistribution = (results) => {
		const distribution = {
			excellent: 0, // 80-100%
			good: 0, // 60-79%
			average: 0, // 40-59%
			poor: 0, // 0-39%
		};

		results.forEach((result) => {
			const percentage = (result.score / result.total_questions) * 100;
			if (percentage >= 80) distribution.excellent++;
			else if (percentage >= 60) distribution.good++;
			else if (percentage >= 40) distribution.average++;
			else distribution.poor++;
		});

		return distribution;
	};

	const getTopPerformers = (results, limit = 5) => {
		const studentScores = {};

		results.forEach((result) => {
			const percentage = (result.score / result.total_questions) * 100;
			if (!studentScores[result.student_id]) {
				studentScores[result.student_id] = [];
			}
			studentScores[result.student_id].push(percentage);
		});

		const averageScores = Object.entries(studentScores).map(
			([studentId, scores]) => ({
				studentId,
				averageScore:
					scores.reduce((sum, score) => sum + score, 0) / scores.length,
				quizCount: scores.length,
			})
		);

		return averageScores
			.sort((a, b) => b.averageScore - a.averageScore)
			.slice(0, limit);
	};

	const filteredResults = getFilteredResults();
	const stats = calculateStats(filteredResults);
	const performanceDistribution = getPerformanceDistribution(filteredResults);
	const topPerformers = getTopPerformers(filteredResults);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="text-center">
					<div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">Loading analytics...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-4">
				<select
					value={filterPeriod}
					onChange={(e) => setFilterPeriod(e.target.value)}
					className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
					<option value="all">All Time</option>
					<option value="week">Last Week</option>
					<option value="month">Last Month</option>
					<option value="quarter">Last Quarter</option>
				</select>
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

			{/* Overview Stats */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
							<FaUsers className="text-orange-600" />
						</div>
						<div>
							<p className="text-sm text-gray-500">Active Students</p>
							<p className="text-2xl font-bold text-gray-900">
								{stats.totalStudents}
							</p>
						</div>
					</div>
				</div>
			</motion.div>

			{/* Performance Distribution */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className="bg-white rounded-xl shadow-lg p-6">
				<h3 className="text-lg font-semibold text-gray-900 mb-4">
					Performance Distribution
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div className="bg-green-50 rounded-lg p-4">
						<div className="flex items-center space-x-3">
							<FaCheck className="text-green-600 text-xl" />
							<div>
								<p className="text-sm text-green-600">Excellent (80-100%)</p>
								<p className="text-2xl font-bold text-green-900">
									{performanceDistribution.excellent}
								</p>
							</div>
						</div>
					</div>
					<div className="bg-blue-50 rounded-lg p-4">
						<div className="flex items-center space-x-3">
							<FaChartBar className="text-blue-600 text-xl" />
							<div>
								<p className="text-sm text-blue-600">Good (60-79%)</p>
								<p className="text-2xl font-bold text-blue-900">
									{performanceDistribution.good}
								</p>
							</div>
						</div>
					</div>
					<div className="bg-yellow-50 rounded-lg p-4">
						<div className="flex items-center space-x-3">
							<FaChartLine className="text-yellow-600 text-xl" />
							<div>
								<p className="text-sm text-yellow-600">Average (40-59%)</p>
								<p className="text-2xl font-bold text-yellow-900">
									{performanceDistribution.average}
								</p>
							</div>
						</div>
					</div>
					<div className="bg-red-50 rounded-lg p-4">
						<div className="flex items-center space-x-3">
							<FaExclamationTriangle className="text-red-600 text-xl" />
							<div>
								<p className="text-sm text-red-600">
									Needs Improvement (0-39%)
								</p>
								<p className="text-2xl font-bold text-red-900">
									{performanceDistribution.poor}
								</p>
							</div>
						</div>
					</div>
				</div>
			</motion.div>

			{/* Top Performers */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
				className="bg-white rounded-xl shadow-lg p-6">
				<h3 className="text-lg font-semibold text-gray-900 mb-4">
					Top Performers
				</h3>
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-gray-200">
								<th className="text-left py-3 px-4 font-medium text-gray-900">
									Rank
								</th>
								<th className="text-left py-3 px-4 font-medium text-gray-900">
									Student
								</th>
								<th className="text-left py-3 px-4 font-medium text-gray-900">
									Average Score
								</th>
								<th className="text-left py-3 px-4 font-medium text-gray-900">
									Quiz Count
								</th>
								<th className="text-left py-3 px-4 font-medium text-gray-900">
									Performance
								</th>
							</tr>
						</thead>
						<tbody>
							{topPerformers.map((performer, index) => {
								const student = students.find(
									(s) => s.id === performer.studentId
								);
								const performance =
									performer.averageScore >= 80
										? "Excellent"
										: performer.averageScore >= 60
										? "Good"
										: "Needs Improvement";

								return (
									<tr
										key={performer.studentId}
										className="border-b border-gray-100 hover:bg-gray-50">
										<td className="py-3 px-4">
											<div className="flex items-center space-x-2">
												{index < 3 ? (
													<FaTrophy
														className={`text-${
															index === 0
																? "yellow"
																: index === 1
																? "gray"
																: "orange"
														}-500`}
													/>
												) : (
													<span className="text-gray-400">#{index + 1}</span>
												)}
											</div>
										</td>
										<td className="py-3 px-4">
											<div className="flex items-center space-x-3">
												<div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
													<span className="text-white text-sm font-medium">
														{student?.name?.charAt(0) || "U"}
													</span>
												</div>
												<span className="font-medium text-gray-900">
													{student?.name || "Unknown Student"}
												</span>
											</div>
										</td>
										<td className="py-3 px-4">
											<span className="font-medium text-gray-900">
												{performer.averageScore.toFixed(1)}%
											</span>
										</td>
										<td className="py-3 px-4 text-gray-600">
											{performer.quizCount}
										</td>
										<td className="py-3 px-4">
											<span
												className={`px-2 py-1 rounded-full text-xs font-medium ${
													performer.averageScore >= 80
														? "bg-green-100 text-green-800"
														: performer.averageScore >= 60
														? "bg-blue-100 text-blue-800"
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
			</motion.div>

			{/* Recent Activity */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.3 }}
				className="bg-white rounded-xl shadow-lg p-6">
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-lg font-semibold text-gray-900">
						Recent Quiz Activity
					</h3>
					<button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
						<FaDownload size={14} />
						<span>Export Data</span>
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
									Score
								</th>
								<th className="text-left py-3 px-4 font-medium text-gray-900">
									Questions
								</th>
								<th className="text-left py-3 px-4 font-medium text-gray-900">
									Date
								</th>
								<th className="text-left py-3 px-4 font-medium text-gray-900">
									Performance
								</th>
							</tr>
						</thead>
						<tbody>
							{filteredResults.slice(0, 10).map((result) => {
								const student = students.find(
									(s) => s.id === result.student_id
								);
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
										<td className="py-3 px-4">
											<div className="flex items-center space-x-3">
												<div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
													<span className="text-white text-sm font-medium">
														{student?.name?.charAt(0) || "U"}
													</span>
												</div>
												<span className="font-medium text-gray-900">
													{student?.name || "Unknown Student"}
												</span>
											</div>
										</td>
										<td className="py-3 px-4 text-gray-900">
											{result.score}/{result.total_questions}
										</td>
										<td className="py-3 px-4 text-gray-600">
											{result.total_questions}
										</td>
										<td className="py-3 px-4 text-gray-600">
											{new Date(result.timestamp).toLocaleDateString()}
										</td>
										<td className="py-3 px-4">
											<span
												className={`px-2 py-1 rounded-full text-xs font-medium ${
													percentage >= 80
														? "bg-green-100 text-green-800"
														: percentage >= 60
														? "bg-blue-100 text-blue-800"
														: "bg-red-100 text-red-800"
												}`}>
												{percentage}% - {performance}
											</span>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</motion.div>
		</div>
	);
};

export default QuizAnalytics;
