"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import { isAdminRole } from "../../../lib/roles";
import AdminShell from "../../../components/AdminShell";
import { FaShieldAlt, FaExclamationTriangle } from "react-icons/fa";

const withTimeout = (promise, ms) =>
	Promise.race([
		promise,
		new Promise((_, reject) =>
			setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
		),
	]);

// Student Management and Quiz Analytics used to live here as tabs, but
// "Settings" implying configuration while actually hiding two of the
// most-used admin screens hurt discoverability — they're now their own
// top-level pages (/admin/students, /admin/analytics). This page is back
// to holding only real settings: today that's just Quiz Scheduling.
export default function AdminSettings() {
	const [user, setUser] = useState(null);
	const [orgName, setOrgName] = useState("");
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState(false);
	const router = useRouter();

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
				supabase.from("users_profile").select("role, name, email, org_id").eq("id", user.id).single(),
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
	}, [router]);

	useEffect(() => {
		getUser();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event) => {
			if (event === "SIGNED_OUT") router.push("/authenticate");
		});

		return () => subscription.unsubscribe();
	}, [getUser, router]);

	const handleQuizSchedule = () => {
		router.push("/admin/quiz-settings");
	};

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
			<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="flex items-center gap-3 mb-6">
					<div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center">
						<FaShieldAlt className="text-white" size={16} />
					</div>
					<h1 className="font-display text-xl font-semibold text-gray-900">Settings</h1>
				</div>

				{/* Only ever held one real, working control. General Settings
				    toggles and an Admin Invite Code field used to sit here too
				    but were never connected to anything (local-only state, a
				    stub `alert()` save) — removed rather than left as a
				    convincing-looking no-op. The real admin invite code lives
				    in an env var (NEXT_PUBLIC_ADMIN_INVITE_CODE), which a web
				    form can't change anyway. */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
					<h3 className="font-display text-lg font-semibold text-gray-900 mb-1">Quiz Scheduling</h3>
					<p className="text-sm text-gray-500 mb-4">
						Set the active window, time limit, and question count for the real quiz.
					</p>
					<button
						onClick={handleQuizSchedule}
						className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors">
						Open Quiz Scheduling
					</button>
				</motion.div>
			</div>
		</AdminShell>
	);
}
