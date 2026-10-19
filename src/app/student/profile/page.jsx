"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../contexts/AuthContext";
import ParishPicker from "../../../components/ParishPicker";
import { DENOMINATIONS } from "../../../lib/denominations";
import {
	FaUser,
	FaEnvelope,
	FaPhone,
	FaGraduationCap,
	FaBuilding,
	FaTrophy,
	FaChartBar,
	FaHistory,
	FaEdit,
	FaSave,
	FaTimes,
	FaCog,
	FaSignOutAlt,
	FaMedal,
	FaStar,
	FaCalendar,
	FaClock,
	FaCheckCircle,
	FaExclamationTriangle,
	FaArrowLeft,
	FaChurch,
} from "react-icons/fa";
import {
	User,
	Mail,
	Phone,
	GraduationCap,
	Building,
	Trophy,
	BarChart3,
	History,
	Edit,
	Save,
	X,
	Settings,
	LogOut,
	Medal,
	Star,
	Calendar,
	Clock,
	CheckCircle,
	AlertTriangle,
	ArrowLeft,
	Shield,
	Target,
	TrendingUp,
} from "lucide-react";

const withTimeout = (promise, ms) =>
	Promise.race([
		promise,
		new Promise((_, reject) =>
			setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
		),
	]);

// Walks parent_id up from a student's org_id to resolve every level
// along the way, by name. Returns { province, zone, area, parish } with
// whichever levels don't apply left null -- a student's org_id can land
// at any of these four levels (a Zone or Area can itself be someone's
// actual church, not just a routing point to named Areas/Parishes
// under it), so showing all four separately is the only way to show
// exactly where someone is without implying every student has a named
// Parish specifically.
const resolveOrgChain = async (orgId) => {
	const chain = { province: null, zone: null, area: null, parish: null };
	let currentId = orgId;
	while (currentId) {
		const { data: org } = await supabase
			.from("organizations")
			.select("name, level, parent_id")
			.eq("id", currentId)
			.maybeSingle();
		if (!org) break;
		if (org.level in chain) chain[org.level] = org.name;
		currentId = org.parent_id;
	}
	return chain;
};

const StudentProfile = () => {
	// authLoading: AuthContext hasn't finished its own async session check
	// yet (not to be confused with this component's own `loading` below,
	// which tracks fetching this student's profile/quiz data). A direct
	// visit or hard reload of this page always bounced a logged-in
	// student straight back to /authenticate -- confirmed via real
	// browser testing, 100% reproducible, not a flake: loadProfileData's
	// `if (!user)` check ran on first mount, before AuthContext's
	// session check had resolved, so `user` was still its initial null
	// and this page treated that as "not logged in" every single time.
	const { user, userProfile, signOut, loading: authLoading } = useAuth();
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [quizHistory, setQuizHistory] = useState([]);
	// "View All" used to route to /quiz/results, which is built to show
	// the outcome of a single just-finished attempt (from session state
	// right after submitting), not a general history list -- navigating
	// there cold showed NaN since no such attempt was in context. The
	// full history is already loaded above; this just reveals the rest
	// of it in place instead.
	const [showAllHistory, setShowAllHistory] = useState(false);
	const [profileData, setProfileData] = useState(null);
	const [stats, setStats] = useState({
		totalQuizzes: 0,
		averageScore: 0,
		bestScore: 0,
		lastQuizDate: null,
	});
	const [editForm, setEditForm] = useState({
		name: "",
		class: "",
		phone: "",
		dateOfBirth: "",
		gender: "",
		denomination: "",
	});
	const [error, setError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [loadError, setLoadError] = useState(false);
	const router = useRouter();

	// Current Province/Zone/Area/Parish, resolved for display only (by
	// walking parent_id up from org_id). A Zone or Area can itself BE
	// someone's church — not every zone has named areas under it, not
	// every area has named parishes — so a student's org_id can land at
	// any of these four levels, not just "parish" specifically; showing
	// all four (blank where not applicable) makes that visible instead
	// of forcing everyone into one generically-labeled "Parish" field.
	// The picker below always starts fresh (see ParishPicker) —
	// selecting something there is what actually changes org_id; leaving
	// it alone keeps whatever's already set, shown here read-only.
	const [currentOrgChain, setCurrentOrgChain] = useState({ province: null, zone: null, area: null, parish: null });
	// Only set once the user actively picks something; null means "don't
	// touch org_id on save," not "clear it."
	const [selectedOrgId, setSelectedOrgId] = useState(null);

	const loadProfileData = async () => {
		if (authLoading) return;
		if (!user) {
			router.push("/authenticate");
			return;
		}

		setLoading(true);
		setLoadError(false);
		try {
			// Load user profile
			const { data: profile, error: profileError } = await withTimeout(
				supabase
					.from("users_profile")
					.select("*")
					.eq("id", user.id)
					.single(),
				10000
			);

			if (profile) {
				setEditForm({
					name: profile.name || "",
					class: profile.class || "",
					phone: profile.phone || "",
					dateOfBirth: profile.date_of_birth || "",
					gender: profile.gender || "",
					denomination: profile.denomination || "",
				});
				setProfileData(profile);

				if (profile.org_id) {
					setCurrentOrgChain(await resolveOrgChain(profile.org_id));
				} else {
					setCurrentOrgChain({ province: null, zone: null, area: null, parish: null });
				}
			} else if (profileError) {
				setError("Failed to load profile data");
			}

			// Load quiz history - try email first, then student_id
			const { data: quizResultsByEmail } = await withTimeout(
				supabase
					.from("quiz_results")
					.select("*")
					.eq("email", user.email)
					.order("timestamp", { ascending: false }),
				10000
			);

			// If no results by email, try with student_id
			let rawQuizResults = quizResultsByEmail;
			if (!quizResultsByEmail || quizResultsByEmail.length === 0) {
				const { data: quizResultsById } = await withTimeout(
					supabase
						.from("quiz_results")
						.select("*")
						.eq("student_id", user.id)
						.order("timestamp", { ascending: false }),
					10000
				);
				rawQuizResults = quizResultsById;
			}

			const extractAttempts = (results) => {
				const attempts = [];
				(results || []).forEach((row) => {
					if (row.real_total > 0) attempts.push({ id: 1, student_id: row.student_id, timestamp: row.timestamp, score: row.real_score, total_questions: row.real_total, mode: "Real Quiz", category: row.category });
					if (row.practice_normal_total > 0) attempts.push({ id: 2, student_id: row.student_id, timestamp: row.timestamp, score: row.practice_normal_score, total_questions: row.practice_normal_total, mode: "Practice (Normal)", category: row.category });
					if (row.practice_medium_total > 0) attempts.push({ id: 3, student_id: row.student_id, timestamp: row.timestamp, score: row.practice_medium_score, total_questions: row.practice_medium_total, mode: "Practice (Medium)", category: row.category });
					if (row.practice_hard_total > 0) attempts.push({ id: 4, student_id: row.student_id, timestamp: row.timestamp, score: row.practice_hard_score, total_questions: row.practice_hard_total, mode: "Practice (Hard)", category: row.category });
					if (row.practice_entire_total > 0) attempts.push({ id: 5, student_id: row.student_id, timestamp: row.timestamp, score: row.practice_entire_score, total_questions: row.practice_entire_total, mode: "Practice (Entire Year)", category: row.category });
				});
				return attempts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
			};

			const quizResults = extractAttempts(rawQuizResults);

			setQuizHistory(quizResults || []);
			if (quizResults && quizResults.length > 0) {
				const scores = quizResults.map(
					(q) => (q.score / q.total_questions) * 100
				);
				const totalQuizzes = quizResults.length;
				const averageScore = scores.reduce((a, b) => a + b, 0) / totalQuizzes;
				const bestScore = Math.max(...scores);
				const lastQuizDate = quizResults[0]?.timestamp;
				setStats({
					totalQuizzes,
					averageScore: Math.round(averageScore),
					bestScore: Math.round(bestScore),
					lastQuizDate,
				});
			} else {
				setStats({ totalQuizzes: 0, averageScore: 0, bestScore: 0, lastQuizDate: null });
			}
		} catch (err) {
			console.error("Error loading profile data:", err);
			if (
				err.message?.includes("timed out") ||
				err.message?.includes("fetch") ||
				err.message?.includes("network")
			) {
				setLoadError(true);
			} else {
				setError("Failed to load profile data");
			}
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadProfileData();
	}, [user, authLoading, router]);

	useEffect(() => {
		if (error || successMessage) {
			const timer = setTimeout(() => {
				setError("");
				setSuccessMessage("");
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [error, successMessage]);

	const handleEdit = () => {
		setIsEditing(true);
		setError("");
		setSuccessMessage("");
	};

	const handleCancel = () => {
		setIsEditing(false);
		setEditForm({
			name: profileData?.name || "",
			class: profileData?.class || "",
			phone: profileData?.phone || "",
			dateOfBirth: profileData?.date_of_birth || "",
			gender: profileData?.gender || "",
			denomination: profileData?.denomination || "",
		});
		setSelectedOrgId(null);
		setError("");
		setSuccessMessage("");
	};

	const handleSave = async () => {
		if (!editForm.name.trim()) {
			setError("Name is required");
			return;
		}
		if (!editForm.denomination) {
			setError("Denomination is required");
			return;
		}

		try {
			// First, let's check if the profile exists and we can read it
			const { data: existingProfile, error: checkError } = await supabase
				.from("users_profile")
				.select("*")
				.eq("id", user.id)
				.single();

			if (checkError) {
				console.error("Error checking existing profile:", checkError);
				setError("Failed to check existing profile");
				return;
			}

			if (!existingProfile) {
				// console.error("No existing profile found");
				setError("No profile found to update");
				return;
			}

			// Now try to update. org_id is deliberately omitted unless the
			// user actively picked something in ParishPicker this session —
			// an untouched picker must never silently clear an existing value.
			const updateData = {
				name: editForm.name,
				class: editForm.class,
				phone: editForm.phone || null,
				date_of_birth: editForm.dateOfBirth || null,
				gender: editForm.gender || null,
				denomination: editForm.denomination,
			};
			if (selectedOrgId) {
				updateData.org_id = selectedOrgId;
			}

			const { data: updateResult, error: updateError } = await supabase
				.from("users_profile")
				.update(updateData)
				.eq("id", user.id)
				.select();

			if (updateError) {
				// console.error("Update error details:", updateError);
				setError(`Failed to update profile: ${updateError.message}`);
				return;
			}

			// A Postgres/RLS permission mismatch doesn't error here — it
			// just matches zero rows, which looks identical to success
			// unless this is checked explicitly. (This exact failure mode
			// is what silently broke this form for a while — see
			// supabase/migrations/20240101000020_fix_users_profile_self_update.sql.)
			if (!updateResult || updateResult.length === 0) {
				setError("Update didn't apply — no permission to change this profile. Please try again or contact an admin.");
				return;
			}

			// Refresh profile data after successful update
			const { data: updatedProfile, error: refreshError } = await supabase
				.from("users_profile")
				.select("*")
				.eq("id", user.id)
				.single();

			if (updatedProfile) {
				setProfileData(updatedProfile);
				if (updatedProfile.org_id) {
					setCurrentOrgChain(await resolveOrgChain(updatedProfile.org_id));
				}
			}
			setSelectedOrgId(null);

			setSuccessMessage("Profile updated successfully!");
			setIsEditing(false);
		} catch (err) {
			// console.error("Save error:", err);
			setError("An error occurred while updating profile");
		}
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setEditForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleSignOut = async () => {
		await signOut();
	};

	if (loadError) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
				<div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border border-gray-100">
					<FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
					<h2 className="text-2xl font-bold text-gray-800 mb-2">Network Error</h2>
					<p className="text-gray-600 mb-8 leading-relaxed">
						We couldn't connect to the server. Please check your internet connection and try again.
					</p>
					<button
						onClick={loadProfileData}
						className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all font-semibold">
						Retry Connection
					</button>
				</div>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">Loading Profile...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
			{/* Header */}
			<header className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-4">
						<div className="flex items-center space-x-3">
							<button
								onClick={() => router.push("/student/home")}
								className="p-2 text-gray-600 hover:text-gray-800 transition-colors">
								<FaArrowLeft size={20} />
							</button>
							<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
								<FaUser className="text-white" />
							</div>
							<div>
								<h1 className="text-xl font-semibold text-gray-900">
									My Profile
								</h1>
								<p className="text-sm text-gray-500">Student Dashboard</p>
							</div>
						</div>
						{/* <div className="flex items-center space-x-4">
							<button
								onClick={() => router.push("/student/home")}
								className="p-2 text-gray-600 hover:text-gray-800 transition-colors">
								<FaCog size={20} />
							</button>
							<button
								onClick={handleSignOut}
								className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
								<FaSignOutAlt />
								<span>Sign Out</span>
							</button>
						</div> */}
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Profile Card */}
					<div className="lg:col-span-1">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="bg-white rounded-2xl shadow-lg p-6">
							<div className="text-center mb-6">
								<div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
									<FaUser
										className="text-white"
										size={40}
									/>
								</div>
								<h2 className="text-2xl font-bold text-gray-800 mb-2">
									{profileData?.name || "Student"}
								</h2>
								<p className="text-gray-600">{user?.email}</p>
								<div className="mt-2">
									<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
										<FaGraduationCap className="mr-1" />
										{profileData?.class || "Student"}
									</span>
								</div>
							</div>

							{/* Profile Actions */}
							<div className="space-y-3">
								<button
									onClick={handleEdit}
									className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
									<FaEdit />
									<span>Edit Profile</span>
								</button>
							</div>
						</motion.div>
					</div>

					{/* Main Content */}
					<div className="lg:col-span-2 space-y-6">
						{/* Stats Cards */}
						{/* <motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.1 }}
							className="grid grid-cols-1 md:grid-cols-4 gap-4">
							<div className="bg-white rounded-xl p-4 shadow-sm">
								<div className="flex items-center">
									<div className="p-2 bg-blue-100 rounded-lg">
										<Trophy
											className="text-blue-600"
											size={20}
										/>
									</div>
									<div className="ml-3">
										<p className="text-sm font-medium text-gray-600">
											Total Quizzes
										</p>
										<p className="text-2xl font-bold text-gray-900">
											{stats.totalQuizzes}
										</p>
									</div>
								</div>
							</div>

							<div className="bg-white rounded-xl p-4 shadow-sm">
								<div className="flex items-center">
									<div className="p-2 bg-green-100 rounded-lg">
										<TrendingUp
											className="text-green-600"
											size={20}
										/>
									</div>
									<div className="ml-3">
										<p className="text-sm font-medium text-gray-600">
											Average Score
										</p>
										<p className="text-2xl font-bold text-gray-900">
											{stats.averageScore}%
										</p>
									</div>
								</div>
							</div>

							<div className="bg-white rounded-xl p-4 shadow-sm">
								<div className="flex items-center">
									<div className="p-2 bg-yellow-100 rounded-lg">
										<Medal
											className="text-yellow-600"
											size={20}
										/>
									</div>
									<div className="ml-3">
										<p className="text-sm font-medium text-gray-600">
											Best Score
										</p>
										<p className="text-2xl font-bold text-gray-900">
											{stats.bestScore}%
										</p>
									</div>
								</div>
							</div>

							<div className="bg-white rounded-xl p-4 shadow-sm">
								<div className="flex items-center">
									<div className="p-2 bg-purple-100 rounded-lg">
										<Calendar
											className="text-purple-600"
											size={20}
										/>
									</div>
									<div className="ml-3">
										<p className="text-sm font-medium text-gray-600">
											Last Quiz
										</p>
										<p className="text-sm font-bold text-gray-900">
											{stats.lastQuizDate
												? new Date(stats.lastQuizDate).toLocaleDateString()
												: "Never"}
										</p>
									</div>
								</div>
							</div>
						</motion.div> */}

						{/* Profile Information */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2 }}
							className="bg-white rounded-2xl shadow-lg p-6">
							<div className="flex items-center justify-between mb-6">
								<h3 className="text-xl font-semibold text-gray-800">
									Profile Information
								</h3>
								{isEditing && (
									<div className="flex space-x-2">
										<button
											onClick={handleSave}
											className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
											<FaSave size={14} />
											<span>Save</span>
										</button>
										<button
											onClick={handleCancel}
											className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
											<FaTimes size={14} />
											<span>Cancel</span>
										</button>
									</div>
								)}
							</div>

							{/* Error/Success Messages */}
							{error && (
								<motion.div
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">
									<FaExclamationTriangle size={16} />
									<span className="text-sm">{error}</span>
								</motion.div>
							)}

							{successMessage && (
								<motion.div
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 mb-4">
									<FaCheckCircle size={16} />
									<span className="text-sm">{successMessage}</span>
								</motion.div>
							)}

							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Full Name
									</label>
									{isEditing ? (
										<input
											type="text"
											name="name"
											value={editForm.name}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										/>
									) : (
										<div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
											<FaUser className="text-gray-400" />
											<span>{profileData?.name || "Not set"}</span>
										</div>
									)}
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Email
									</label>
									<div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
										<FaEnvelope className="text-gray-400" />
										<span>{user?.email}</span>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Class
									</label>
									{isEditing ? (
										<select
											name="class"
											value={editForm.class}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
											<option value="">Select your class</option>
											<option value="yaya">Yaya</option>
											<option value="adult">Adult</option>
											<option value="teenagers">Teenagers</option>
										</select>
									) : (
										<div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
											<FaGraduationCap className="text-gray-400" />
											<span>{profileData?.class || "Not set"}</span>
										</div>
									)}
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Denomination
									</label>
									{isEditing ? (
										<select
											name="denomination"
											value={editForm.denomination}
											onChange={handleChange}
											required
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
											<option value="">Select denomination</option>
											{DENOMINATIONS.map((d) => (
												<option key={d} value={d}>
													{d}
												</option>
											))}
										</select>
									) : (
										<div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
											<FaChurch className="text-gray-400" />
											<span>{profileData?.denomination || "Not set"}</span>
										</div>
									)}
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Phone Number
									</label>
									{isEditing ? (
										<input
											type="tel"
											name="phone"
											value={editForm.phone}
											onChange={handleChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										/>
									) : (
										<div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
											<FaPhone className="text-gray-400" />
											<span>{profileData?.phone || "Not set"}</span>
										</div>
									)}
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Date of Birth
										</label>
										{isEditing ? (
											<input
												type="date"
												name="dateOfBirth"
												value={editForm.dateOfBirth}
												onChange={handleChange}
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
											/>
										) : (
											<div className="p-3 bg-gray-50 rounded-lg">
												<span>{profileData?.date_of_birth || "Not set"}</span>
											</div>
										)}
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Gender
										</label>
										{isEditing ? (
											<select
												name="gender"
												value={editForm.gender}
												onChange={handleChange}
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
												<option value="">Select</option>
												<option value="male">Male</option>
												<option value="female">Female</option>
											</select>
										) : (
											<div className="p-3 bg-gray-50 rounded-lg capitalize">
												<span>{profileData?.gender || "Not set"}</span>
											</div>
										)}
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Location
									</label>
									<div className="grid grid-cols-2 gap-2 mb-3">
										<div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
											<FaBuilding className="text-gray-400 flex-shrink-0" />
											<span className="truncate">Province: {currentOrgChain.province || "Not set"}</span>
										</div>
										<div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
											<FaBuilding className="text-gray-400 flex-shrink-0" />
											<span className="truncate">Zone: {currentOrgChain.zone || "Not set"}</span>
										</div>
										<div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
											<FaBuilding className="text-gray-400 flex-shrink-0" />
											<span className="truncate">Area: {currentOrgChain.area || "Not set"}</span>
										</div>
										<div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
											<FaChurch className="text-gray-400 flex-shrink-0" />
											<span className="truncate">Parish: {currentOrgChain.parish || "Not set"}</span>
										</div>
									</div>
									{isEditing && (
										<>
											<ParishPicker
												label="Change parish"
												onChange={setSelectedOrgId}
											/>
											<p className="text-xs text-gray-400 mt-1">
												Leave unselected to keep your current location.
											</p>
										</>
									)}
								</div>
							</div>
						</motion.div>

						{/* Recent Quiz History */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3 }}
							className="bg-white rounded-2xl shadow-lg p-6">
							<div className="flex items-center justify-between mb-6">
								<h3 className="text-xl font-semibold text-gray-800">
									Recent Quiz History
								</h3>
								{quizHistory.length > 5 && (
									<button
										onClick={() => setShowAllHistory((v) => !v)}
										className="text-blue-600 hover:text-blue-700 font-medium">
										{showAllHistory ? "Show Less" : "View All"}
									</button>
								)}
							</div>

							{quizHistory.length > 0 ? (
								<div className="space-y-3">
									{(showAllHistory ? quizHistory : quizHistory.slice(0, 5)).map((quiz, index) => {
										const percentage = Math.round(
											(quiz.score / quiz.total_questions) * 100
										);
										return (
											<div
												key={quiz.id || `${quiz.timestamp}-${index}`}
												className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
												<div className="flex items-center space-x-3">
													<div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
														<FaChartBar className="text-blue-600" />
													</div>
													<div>
														<p className="font-medium text-gray-900">
															{quiz.category || "Quiz"} - <span className="text-blue-600">{quiz.mode}</span>
														</p>
														<p className="text-sm text-gray-500">
															{new Date(quiz.timestamp).toLocaleDateString()}
														</p>
													</div>
												</div>
												<div className="text-right">
													<p className="font-bold text-lg text-gray-900">
														{percentage}%
													</p>
													<p className="text-sm text-gray-500">
														{quiz.score}/{quiz.total_questions} correct
													</p>
												</div>
											</div>
										);
									})}
								</div>
							) : (
								<div className="text-center py-8">
									<FaHistory
										className="text-gray-400 mx-auto mb-4"
										size={48}
									/>
									<p className="text-gray-500">No quiz history yet</p>
									<button
										onClick={() =>
											router.push(
												`/quiz/${profileData?.class?.toLowerCase() || "adult"}`
											)
										}
										className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
										Take Your First Quiz
									</button>
								</div>
							)}
						</motion.div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default StudentProfile;
