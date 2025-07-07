"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import {
	FaPlus,
	FaEdit,
	FaTrash,
	FaEye,
	FaSave,
	FaTimes,
	FaCheck,
	FaClock,
	FaUsers,
	FaChartBar,
	FaQuestionCircle,
	FaCog,
} from "react-icons/fa";

const QuizManagement = () => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [quizzes, setQuizzes] = useState([]);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [editingQuiz, setEditingQuiz] = useState(null);
	const [formData, setFormData] = useState({
		title: "",
		description: "",
		category: "",
		timeLimit: 60,
		questionCount: 10,
		isActive: true,
		questions: [],
	});
	const [currentQuestion, setCurrentQuestion] = useState({
		question: "",
		options: ["", "", "", ""],
		correctAnswer: 0,
		explanation: "",
	});

	useEffect(() => {
		checkAuth();
		loadQuizzes();

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
	}, []);

	const checkAuth = async () => {
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

			const { data: profile } = await supabase
				.from("users_profile")
				.select("role")
				.eq("id", user.id)
				.single();

			if (profile?.role !== "admin") {
				router.push("/access-denied");
				return;
			}

			setUser(user);
		} catch (error) {
			console.error("Auth error:", error);
		} finally {
			setLoading(false);
		}
	};

	const loadQuizzes = async () => {
		try {
			const { data, error } = await supabase
				.from("quiz_settings")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) throw error;
			setQuizzes(data || []);
		} catch (error) {
			console.error("Error loading quizzes:", error);
		}
	};

	const handleCreateQuiz = async () => {
		try {
			const { data, error } = await supabase
				.from("quiz_settings")
				.insert([formData])
				.select();

			if (error) throw error;

			setQuizzes([...quizzes, data[0]]);
			setShowCreateModal(false);
			resetForm();
		} catch (error) {
			console.error("Error creating quiz:", error);
		}
	};

	const handleUpdateQuiz = async () => {
		try {
			const { error } = await supabase
				.from("quiz_settings")
				.update(formData)
				.eq("id", editingQuiz.id);

			if (error) throw error;

			setQuizzes(
				quizzes.map((q) =>
					q.id === editingQuiz.id ? { ...q, ...formData } : q
				)
			);
			setEditingQuiz(null);
			resetForm();
		} catch (error) {
			console.error("Error updating quiz:", error);
		}
	};

	const handleDeleteQuiz = async (quizId) => {
		if (!confirm("Are you sure you want to delete this quiz?")) return;

		try {
			const { error } = await supabase
				.from("quiz_settings")
				.delete()
				.eq("id", quizId);

			if (error) throw error;

			setQuizzes(quizzes.filter((q) => q.id !== quizId));
		} catch (error) {
			console.error("Error deleting quiz:", error);
		}
	};

	const resetForm = () => {
		setFormData({
			title: "",
			description: "",
			category: "",
			timeLimit: 60,
			questionCount: 10,
			isActive: true,
			questions: [],
		});
		setCurrentQuestion({
			question: "",
			options: ["", "", "", ""],
			correctAnswer: 0,
			explanation: "",
		});
	};

	const addQuestion = () => {
		if (
			!currentQuestion.question ||
			currentQuestion.options.some((opt) => !opt)
		) {
			alert("Please fill in all question fields");
			return;
		}

		setFormData({
			...formData,
			questions: [...formData.questions, currentQuestion],
		});

		setCurrentQuestion({
			question: "",
			options: ["", "", "", ""],
			correctAnswer: 0,
			explanation: "",
		});
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">Loading Quiz Management...</p>
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
						<div>
							<h1 className="text-2xl font-bold text-gray-900">
								Quiz Management
							</h1>
							<p className="text-gray-600">Create and manage quizzes</p>
						</div>
						<button
							onClick={() => setShowCreateModal(true)}
							className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
							<FaPlus />
							<span>Create Quiz</span>
						</button>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Quiz List */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{quizzes.map((quiz) => (
						<motion.div
							key={quiz.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="bg-white rounded-xl shadow-lg p-6">
							<div className="flex justify-between items-start mb-4">
								<div>
									<h3 className="text-lg font-semibold text-gray-900">
										{quiz.title}
									</h3>
									<p className="text-gray-600 text-sm">{quiz.description}</p>
								</div>
								<span
									className={`px-2 py-1 rounded-full text-xs font-medium ${
										quiz.isActive
											? "bg-green-100 text-green-800"
											: "bg-red-100 text-red-800"
									}`}>
									{quiz.isActive ? "Active" : "Inactive"}
								</span>
							</div>

							<div className="space-y-2 mb-4">
								<div className="flex items-center space-x-2 text-sm text-gray-600">
									<FaClock />
									<span>{quiz.timeLimit} minutes</span>
								</div>
								<div className="flex items-center space-x-2 text-sm text-gray-600">
									<FaQuestionCircle />
									<span>{quiz.questionCount} questions</span>
								</div>
								<div className="flex items-center space-x-2 text-sm text-gray-600">
									<FaUsers />
									<span>{quiz.category}</span>
								</div>
							</div>

							<div className="flex space-x-2">
								<button
									onClick={() => setEditingQuiz(quiz)}
									className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-blue-600 hover:text-blue-800 transition-colors">
									<FaEdit size={14} />
									<span className="text-sm">Edit</span>
								</button>
								<button
									onClick={() => handleDeleteQuiz(quiz.id)}
									className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-red-600 hover:text-red-800 transition-colors">
									<FaTrash size={14} />
									<span className="text-sm">Delete</span>
								</button>
							</div>
						</motion.div>
					))}
				</div>

				{/* Create/Edit Modal */}
				{(showCreateModal || editingQuiz) && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
						<motion.div
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
							<div className="p-6">
								<div className="flex justify-between items-center mb-6">
									<h2 className="text-xl font-semibold text-gray-900">
										{editingQuiz ? "Edit Quiz" : "Create New Quiz"}
									</h2>
									<button
										onClick={() => {
											setShowCreateModal(false);
											setEditingQuiz(null);
											resetForm();
										}}
										className="text-gray-400 hover:text-gray-600">
										<FaTimes size={24} />
									</button>
								</div>

								<form
									onSubmit={(e) => {
										e.preventDefault();
										editingQuiz ? handleUpdateQuiz() : handleCreateQuiz();
									}}>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Quiz Title
											</label>
											<input
												type="text"
												value={formData.title}
												onChange={(e) =>
													setFormData({ ...formData, title: e.target.value })
												}
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
												required
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Category
											</label>
											<select
												value={formData.category}
												onChange={(e) =>
													setFormData({ ...formData, category: e.target.value })
												}
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
												required>
												<option value="">Select category</option>
												<option value="bible">Bible Study</option>
												<option value="theology">Theology</option>
												<option value="church-history">Church History</option>
												<option value="ethics">Christian Ethics</option>
											</select>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Time Limit (minutes)
											</label>
											<input
												type="number"
												value={formData.timeLimit}
												onChange={(e) =>
													setFormData({
														...formData,
														timeLimit: parseInt(e.target.value),
													})
												}
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
												min="1"
												required
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Question Count
											</label>
											<input
												type="number"
												value={formData.questionCount}
												onChange={(e) =>
													setFormData({
														...formData,
														questionCount: parseInt(e.target.value),
													})
												}
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
												min="1"
												required
											/>
										</div>
									</div>

									<div className="mb-6">
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Description
										</label>
										<textarea
											value={formData.description}
											onChange={(e) =>
												setFormData({
													...formData,
													description: e.target.value,
												})
											}
											rows={3}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
											required
										/>
									</div>

									<div className="flex items-center space-x-2 mb-6">
										<input
											type="checkbox"
											id="isActive"
											checked={formData.isActive}
											onChange={(e) =>
												setFormData({ ...formData, isActive: e.target.checked })
											}
											className="rounded"
										/>
										<label
											htmlFor="isActive"
											className="text-sm text-gray-700">
											Active Quiz
										</label>
									</div>

									{/* Questions Section */}
									<div className="mb-6">
										<h3 className="text-lg font-semibold text-gray-900 mb-4">
											Questions
										</h3>

										{/* Add Question Form */}
										<div className="bg-gray-50 rounded-lg p-4 mb-4">
											<div className="mb-4">
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Question
												</label>
												<textarea
													value={currentQuestion.question}
													onChange={(e) =>
														setCurrentQuestion({
															...currentQuestion,
															question: e.target.value,
														})
													}
													rows={2}
													className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
													placeholder="Enter your question..."
												/>
											</div>

											<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
												{currentQuestion.options.map((option, index) => (
													<div key={index}>
														<label className="block text-sm font-medium text-gray-700 mb-2">
															Option {index + 1}
														</label>
														<input
															type="text"
															value={option}
															onChange={(e) => {
																const newOptions = [...currentQuestion.options];
																newOptions[index] = e.target.value;
																setCurrentQuestion({
																	...currentQuestion,
																	options: newOptions,
																});
															}}
															className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
															placeholder={`Option ${index + 1}`}
														/>
													</div>
												))}
											</div>

											<div className="mb-4">
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Correct Answer
												</label>
												<select
													value={currentQuestion.correctAnswer}
													onChange={(e) =>
														setCurrentQuestion({
															...currentQuestion,
															correctAnswer: parseInt(e.target.value),
														})
													}
													className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
													{currentQuestion.options.map((option, index) => (
														<option
															key={index}
															value={index}>
															Option {index + 1}: {option || "..."}
														</option>
													))}
												</select>
											</div>

											<div className="mb-4">
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Explanation (Optional)
												</label>
												<textarea
													value={currentQuestion.explanation}
													onChange={(e) =>
														setCurrentQuestion({
															...currentQuestion,
															explanation: e.target.value,
														})
													}
													rows={2}
													className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
													placeholder="Explain why this is the correct answer..."
												/>
											</div>

											<button
												type="button"
												onClick={addQuestion}
												className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
												<FaPlus size={14} />
												<span>Add Question</span>
											</button>
										</div>

										{/* Questions List */}
										{formData.questions.length > 0 && (
											<div className="space-y-3">
												<h4 className="font-medium text-gray-900">
													Added Questions ({formData.questions.length})
												</h4>
												{formData.questions.map((question, index) => (
													<div
														key={index}
														className="bg-white border border-gray-200 rounded-lg p-4">
														<div className="flex justify-between items-start mb-2">
															<h5 className="font-medium text-gray-900">
																Question {index + 1}
															</h5>
															<button
																type="button"
																onClick={() => {
																	const newQuestions =
																		formData.questions.filter(
																			(_, i) => i !== index
																		);
																	setFormData({
																		...formData,
																		questions: newQuestions,
																	});
																}}
																className="text-red-600 hover:text-red-800">
																<FaTrash size={14} />
															</button>
														</div>
														<p className="text-gray-700 mb-2">
															{question.question}
														</p>
														<div className="space-y-1">
															{question.options.map((option, optIndex) => (
																<div
																	key={optIndex}
																	className={`text-sm ${
																		optIndex === question.correctAnswer
																			? "text-green-600 font-medium"
																			: "text-gray-600"
																	}`}>
																	{optIndex + 1}. {option}
																	{optIndex === question.correctAnswer && (
																		<span className="ml-2 text-green-600">
																			✓ Correct
																		</span>
																	)}
																</div>
															))}
														</div>
													</div>
												))}
											</div>
										)}
									</div>

									<div className="flex justify-end space-x-3">
										<button
											type="button"
											onClick={() => {
												setShowCreateModal(false);
												setEditingQuiz(null);
												resetForm();
											}}
											className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
											Cancel
										</button>
										<button
											type="submit"
											className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
											<FaSave size={14} />
											<span>{editingQuiz ? "Update Quiz" : "Create Quiz"}</span>
										</button>
									</div>
								</form>
							</div>
						</motion.div>
					</div>
				)}
			</main>
		</div>
	);
};

export default QuizManagement;
