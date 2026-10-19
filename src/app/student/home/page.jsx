"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import {
	FaUser,
	FaTrophy,
	FaHistory,
	FaChartBar,
	FaClipboardList,
} from "react-icons/fa";
import { Heart, Brain, ArrowRight } from "lucide-react";
import MenuBar from "../../../components/MenuBar";
import { useAuth } from "../../../contexts/AuthContext";
import { isAdminRole } from "../../../lib/roles";

const withTimeout = (promise, ms) =>
	Promise.race([
		promise,
		new Promise((_, reject) => setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)),
	]);

const MODE_LABELS = {
	real: "Real Quiz",
	practice_normal: "Practice (Normal)",
	practice_medium: "Practice (Medium)",
	practice_hard: "Practice (Hard)",
	practice_entire: "Practice (Entire Year)",
};

// Flattens a quiz_results row (one row can carry several completed
// modes at once — real, practice_normal, etc.) into one entry per
// mode actually attempted. Same shape as student/profile's own
// extraction, kept local here since this page only needs the last
// few, not the full history.
const extractAttempts = (results) => {
	const attempts = [];
	(results || []).forEach((row) => {
		if (row.real_total > 0) attempts.push({ timestamp: row.timestamp, score: row.real_score, total: row.real_total, mode: MODE_LABELS.real });
		if (row.practice_normal_total > 0) attempts.push({ timestamp: row.timestamp, score: row.practice_normal_score, total: row.practice_normal_total, mode: MODE_LABELS.practice_normal });
		if (row.practice_medium_total > 0) attempts.push({ timestamp: row.timestamp, score: row.practice_medium_score, total: row.practice_medium_total, mode: MODE_LABELS.practice_medium });
		if (row.practice_hard_total > 0) attempts.push({ timestamp: row.timestamp, score: row.practice_hard_score, total: row.practice_hard_total, mode: MODE_LABELS.practice_hard });
		if (row.practice_entire_total > 0) attempts.push({ timestamp: row.timestamp, score: row.practice_entire_score, total: row.practice_entire_total, mode: MODE_LABELS.practice_entire });
	});
	return attempts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

const StudentHome = () => {
	const { user: authUser, userProfile, loading } = useAuth();
	const router = useRouter();

	const [statsLoading, setStatsLoading] = useState(true);
	const [stats, setStats] = useState({ totalQuizzes: 0, averageScore: 0, bestScore: 0 });
	const [recentActivity, setRecentActivity] = useState([]);

	useEffect(() => {
		if (!loading) {
			if (!authUser || !userProfile) {
				router.push("/authenticate");
			} else if (isAdminRole(userProfile.role)) {
				// An admin-type account landing here (direct URL, stale link,
				// the login-redirect bug this fixed) belongs on their own
				// dashboard, not bounced out to the login page looking like
				// they'd been signed out.
				router.push("/admin/dashboard");
			} else if (userProfile.role !== "student") {
				router.push("/authenticate");
			}
		}
	}, [authUser, userProfile, loading, router]);

	useEffect(() => {
		if (!authUser) return;

		// Stale-while-revalidate: a returning tab (the browser discarded it
		// in the background and reloads it fresh on refocus, or any other
		// full remount) otherwise shows an empty skeleton for a beat even
		// though nothing actually changed. Showing last-known numbers
		// immediately, then quietly replacing them once the real fetch
		// resolves, makes that feel instant instead of a visible reload.
		const cacheKey = `qm_student_stats_${authUser.id}`;
		let hadCache = false;
		try {
			const cached = localStorage.getItem(cacheKey);
			if (cached) {
				const parsed = JSON.parse(cached);
				setStats(parsed.stats);
				setRecentActivity(parsed.recentActivity);
				setStatsLoading(false);
				hadCache = true;
			}
		} catch {
			// localStorage unavailable (private browsing, etc.) — falls
			// through to the normal loading-skeleton path below.
		}

		const loadStats = async () => {
			if (!hadCache) setStatsLoading(true);
			try {
				let { data: rows } = await withTimeout(
					supabase.from("quiz_results").select("*").eq("email", authUser.email).order("timestamp", { ascending: false }),
					10000
				);
				if (!rows || rows.length === 0) {
					const { data: byId } = await withTimeout(
						supabase.from("quiz_results").select("*").eq("student_id", authUser.id).order("timestamp", { ascending: false }),
						10000
					);
					rows = byId;
				}
				const attempts = extractAttempts(rows);
				const newStats =
					attempts.length > 0
						? {
								totalQuizzes: attempts.length,
								averageScore: Math.round(
									attempts.reduce((sum, a) => sum + (a.score / a.total) * 100, 0) / attempts.length
								),
								bestScore: Math.round(Math.max(...attempts.map((a) => (a.score / a.total) * 100))),
						  }
						: { totalQuizzes: 0, averageScore: 0, bestScore: 0 };
				const newRecentActivity = attempts.slice(0, 5);

				setStats(newStats);
				setRecentActivity(newRecentActivity);
				try {
					localStorage.setItem(cacheKey, JSON.stringify({ stats: newStats, recentActivity: newRecentActivity }));
				} catch {
					// Non-fatal — just means next load won't have a cache to show.
				}
			} catch (err) {
				console.error("Error loading dashboard stats:", err);
			} finally {
				setStatsLoading(false);
			}
		};
		loadStats();
	}, [authUser]);

	// Quiz options based on class
	let quizOptions = [];
	const userClass = userProfile?.class?.toLowerCase();
	if (userClass === "yaya") {
		quizOptions = [
			{
				title: "Yaya Quiz",
				description: "Specialized content for caregivers",
				icon: <Heart className="w-8 h-8" />,
				path: "/quiz/yaya",
			},
			{
				title: "Adults Quiz",
				description: "Comprehensive knowledge for mature learners",
				icon: <Brain className="w-8 h-8" />,
				path: "/quiz/adults",
			},
		];
	} else if (userClass === "adult" || userClass === "adults") {
		quizOptions = [
			{
				title: "Adults Quiz",
				description: "Comprehensive knowledge for mature learners",
				icon: <Brain className="w-8 h-8" />,
				path: "/quiz/adults",
			},
			{
				title: "Yaya Quiz",
				description: "Specialized content for caregivers",
				icon: <Heart className="w-8 h-8" />,
				path: "/quiz/yaya",
			},
		];
	}

	const statCards = [
		{ label: "Total Quizzes", value: stats.totalQuizzes, icon: <FaClipboardList />, color: "text-brand-600 bg-brand-50" },
		{ label: "Average Score", value: `${stats.averageScore}%`, icon: <FaChartBar />, color: "text-blue-600 bg-blue-50" },
		{ label: "Best Score", value: `${stats.bestScore}%`, icon: <FaTrophy />, color: "text-green-600 bg-green-50" },
	];

	return (
		<div className="min-h-screen bg-background">
			<MenuBar />

			<header className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-4">
						<div className="flex items-center space-x-3 min-w-0">
							<div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center">
								<FaUser className="text-white" />
							</div>
							<div className="min-w-0">
								<h1 className="font-display text-lg sm:text-xl font-semibold text-gray-900 truncate">
									Welcome,{" "}
									{loading ? (
										<span className="inline-block h-6 w-32 bg-gray-200 animate-pulse rounded align-middle"></span>
									) : (
										userProfile?.name || "Student"
									)}
									!
								</h1>
								<p className="text-sm text-gray-500 truncate">
									{loading ? (
										<span className="inline-block h-4 w-48 bg-gray-200 animate-pulse rounded"></span>
									) : (
										authUser?.email
									)}
								</p>
							</div>
						</div>
					</div>
				</div>
			</header>

			{/* News banner */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
				<div className="w-full overflow-hidden bg-gradient-to-r from-brand-600 via-brand-700 to-brand-800 rounded-xl shadow-lg">
					<div className="flex items-center">
						<div className="relative z-10 flex-shrink-0 bg-gray-900 text-white px-3 sm:px-5 py-3 font-bold text-sm sm:text-base">
							📢 NEWS
						</div>
						<div className="overflow-hidden flex-1">
							<motion.div
								animate={{ x: ["100%", "-100%"] }}
								transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
								className="whitespace-nowrap py-3 px-4 text-white font-medium text-sm sm:text-base md:text-lg">
								The first Real quiz for 2026/2027 is currently going on! Lesson 1-4 ONLY
							</motion.div>
						</div>
					</div>
				</div>
			</div>

			{/* Hero: quiz launch cards */}
			<section className="relative px-4 sm:px-6 py-12 sm:py-16 overflow-hidden">
				<div className="max-w-7xl mx-auto text-center">
					<div className="absolute inset-0 overflow-hidden pointer-events-none">
						<div className="absolute top-20 left-10 w-72 h-72 bg-brand-300/20 rounded-full blur-3xl animate-pulse"></div>
						<div className="absolute top-40 right-20 w-96 h-96 bg-brand-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
					</div>

					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						className="relative z-10">
						<h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold mb-4 text-gray-900">
							Ready to Test Your Knowledge?
						</h2>
						<p className="text-base sm:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
							{loading ? "Loading your quizzes..." : "Choose a category below to begin"}
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
							{loading ? (
								<>
									<div className="bg-white/50 p-8 rounded-3xl shadow-xl border border-white/50 h-56 sm:h-64 animate-pulse"></div>
									<div className="bg-white/50 p-8 rounded-3xl shadow-xl border border-white/50 h-56 sm:h-64 animate-pulse"></div>
								</>
							) : (
								quizOptions.map((category, index) => (
									<motion.div
										key={category.title}
										initial={{ opacity: 0, y: 30 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.6, delay: index * 0.2 }}
										whileHover={{ y: -8 }}
										className="group">
										<button
											onClick={() => router.push(category.path)}
											className="w-full h-full bg-brand-50 p-8 sm:p-10 rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-brand-100 flex flex-col items-center text-center">
											<div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300">
												{category.icon}
											</div>
											<h3 className="font-display text-xl sm:text-2xl font-bold text-gray-900 mb-2">
												{category.title.toUpperCase()}
											</h3>
											<p className="text-sm text-gray-500 mb-5">{category.description}</p>
											<div className="mt-auto flex items-center text-brand-600 font-semibold group-hover:translate-x-2 transition-transform duration-300">
												<span>Start Quiz</span>
												<ArrowRight className="w-4 h-4 ml-2" />
											</div>
										</button>
									</motion.div>
								))
							)}
						</div>
					</motion.div>
				</div>
			</section>

			{/* Progress + recent activity */}
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
				<h3 className="font-display text-xl sm:text-2xl font-bold text-gray-900 mb-4">Your Progress</h3>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
					{statCards.map((card) => (
						<div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
							<div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${card.color}`}>
								{card.icon}
							</div>
							<div className="min-w-0">
								<p className="text-sm text-gray-500">{card.label}</p>
								{statsLoading ? (
									<div className="h-6 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
								) : (
									<p className="text-2xl font-bold text-gray-900">{card.value}</p>
								)}
							</div>
						</div>
					))}
				</div>

				<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
					<h3 className="font-display text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
						<FaHistory className="text-brand-500" /> Recent Activity
					</h3>
					{statsLoading ? (
						<div className="space-y-2">
							{[1, 2, 3].map((i) => (
								<div key={i} className="h-12 bg-gray-100 animate-pulse rounded-lg"></div>
							))}
						</div>
					) : recentActivity.length === 0 ? (
						<p className="text-sm text-gray-400 text-center py-6">
							No quizzes taken yet — pick a category above to get started!
						</p>
					) : (
						<div className="space-y-2">
							{recentActivity.map((entry, i) => {
								const pct = Math.round((entry.score / entry.total) * 100);
								return (
									<div key={i} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-gray-50">
										<div className="min-w-0">
											<p className="font-medium text-gray-800 truncate">{entry.mode}</p>
											<p className="text-xs text-gray-400">{new Date(entry.timestamp).toLocaleString()}</p>
										</div>
										<div className="flex items-center gap-2 flex-shrink-0">
											<span className="text-sm text-gray-500">{entry.score}/{entry.total}</span>
											<span
												className={`px-2 py-0.5 rounded-full text-xs font-medium ${
													pct >= 80 ? "bg-green-100 text-green-700" : pct >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
												}`}>
												{pct}%
											</span>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</section>
		</div>
	);
};

export default StudentHome;
