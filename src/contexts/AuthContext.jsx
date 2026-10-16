"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import { isAdminRole } from "../lib/roles";

const AuthContext = createContext();

const withTimeout = (promise, ms) =>
	Promise.race([
		promise,
		new Promise((_, reject) =>
			setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
		),
	]);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

// Keyed by email, not a single slot — a single slot meant signing up a
// second account (e.g. testing student then admin signup in the same
// browser) silently overwrote the first's pending role, or cleared it
// out from under it on completion. Every pending role is looked up
// against whichever account is actually logged in.
const SIGNUP_ROLES_STORAGE_KEY = "quizmaster_signup_roles";

const readStoredSignupRoles = () => {
	if (typeof window === "undefined") return {};
	try {
		const raw = window.localStorage.getItem(SIGNUP_ROLES_STORAGE_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
};

const writeStoredSignupRoles = (map) => {
	try {
		window.localStorage.setItem(SIGNUP_ROLES_STORAGE_KEY, JSON.stringify(map));
	} catch {
		// localStorage unavailable (private browsing etc.) — signup still
		// works as long as the user doesn't reload before setup-profile.
	}
};

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [userProfile, setUserProfile] = useState(null);
	const [loading, setLoading] = useState(true);
	// Survives the page reload that happens between signup and completing
	// /setup-profile (email confirmation round-trip) — resolved per the
	// currently authenticated user's email, not a single last-set value.
	const [signupRole, setSignupRole] = useState(null);
	const router = useRouter();

	// Resolve this user's pending signup role (if any) from the stored
	// map, only relevant before their profile row exists.
	const resolveSignupRoleForEmail = (email) => {
		if (!email) return;
		const stored = readStoredSignupRoles()[email];
		if (stored) setSignupRole(stored);
	};

	// Initialize auth state
	useEffect(() => {
		const initializeAuth = async () => {
			try {
				// Get current session with a 15-second timeout
				const {
					data: { session },
				} = await withTimeout(supabase.auth.getSession(), 15000);

				if (session?.user) {
					setUser(session.user);

					// Fetch user profile with a 10-second timeout
					const { data: profile } = await withTimeout(
						supabase
							.from("users_profile")
							.select("*")
							.eq("id", session.user.id)
							.single(),
						10000
					);

					setUserProfile(profile);
					if (!profile) resolveSignupRoleForEmail(session.user.email);
				}
			} catch (error) {
				console.error("Auth initialization error:", error);
				// On timeout, gracefully stop loading so pages can show their own error UI
			} finally {
				setLoading(false);
			}
		};

		initializeAuth();

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			console.log("Auth state changed:", event);

			if (event === "SIGNED_IN" && session?.user) {
				setUser(session.user);

				// Fetch user profile with timeout
				try {
					const { data: profile } = await withTimeout(
						supabase
							.from("users_profile")
							.select("*")
							.eq("id", session.user.id)
							.single(),
						10000
					);
					setUserProfile(profile);
					if (!profile) resolveSignupRoleForEmail(session.user.email);
				} catch (profileError) {
					console.error("Profile fetch on sign-in timed out:", profileError);
					// Deliberately not resolving signupRole here: a timeout isn't
					// confirmation the profile doesn't exist, and doing so could
					// make an existing confirmed user's setup-profile redirect
					// check (which skips itself while signupRole is set) misfire.
				}
			} else if (event === "SIGNED_OUT") {
				setUser(null);
				setUserProfile(null);
				setSignupRole(null);
			}
		});

		return () => subscription.unsubscribe();
	}, []);

	// Set temporary role during signup (secure, server-side validated).
	// Keyed by email so it survives signing up multiple accounts before
	// either one completes setup-profile.
	const setSignupRoleData = (role, adminCode = null, email = null) => {
		if ((role === "admin" || role === "student") && email) {
			const value = { role, adminCode };
			setSignupRole(value);
			const map = readStoredSignupRoles();
			map[email] = value;
			writeStoredSignupRoles(map);
		}
	};

	// Clear this account's signup role after its profile is created.
	const clearSignupRole = (email = null) => {
		setSignupRole(null);
		if (email) {
			const map = readStoredSignupRoles();
			delete map[email];
			writeStoredSignupRoles(map);
		}
	};

	// Sign out function
	const signOut = async () => {
		try {
			await supabase.auth.signOut();
			router.push("/");
		} catch (error) {
			console.error("Sign out error:", error);
		}
	};

	// Check if user is admin (any admin-like role, not just the legacy
	// literal "admin" — see src/lib/roles.js)
	const isAdmin = () => {
		return isAdminRole(userProfile?.role);
	};

	// Check if user is student
	const isStudent = () => {
		return userProfile?.role === "student";
	};

	// Get current role
	const getCurrentRole = () => {
		return userProfile?.role || signupRole?.role;
	};

	// The user's organization (Region/Province/Zone/Area/Parish), once
	// assigned — null for every account today (Phase 1 just added the
	// column; nothing assigns it yet, see roadmap task t08).
	const getOrgId = () => {
		return userProfile?.org_id ?? null;
	};

	const value = {
		user,
		userProfile,
		loading,
		signupRole,
		setSignupRoleData,
		clearSignupRole,
		signOut,
		isAdmin,
		isStudent,
		getCurrentRole,
		getOrgId,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
