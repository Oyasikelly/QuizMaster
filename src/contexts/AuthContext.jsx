"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [userProfile, setUserProfile] = useState(null);
	const [loading, setLoading] = useState(true);
	const [signupRole, setSignupRole] = useState(null); // Temporary role during signup
	const router = useRouter();

	// Initialize auth state
	useEffect(() => {
		const initializeAuth = async () => {
			try {
				// Get current session
				const {
					data: { session },
				} = await supabase.auth.getSession();

				if (session?.user) {
					setUser(session.user);

					// Fetch user profile
					const { data: profile } = await supabase
						.from("users_profile")
						.select("*")
						.eq("id", session.user.id)
						.single();

					setUserProfile(profile);
				}
			} catch (error) {
				console.error("Auth initialization error:", error);
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

				// Fetch user profile
				const { data: profile } = await supabase
					.from("users_profile")
					.select("*")
					.eq("id", session.user.id)
					.single();

				setUserProfile(profile);
			} else if (event === "SIGNED_OUT") {
				setUser(null);
				setUserProfile(null);
				setSignupRole(null);
			}
		});

		return () => subscription.unsubscribe();
	}, []);

	// Set temporary role during signup (secure, server-side validated)
	const setSignupRoleData = (role, adminCode = null) => {
		// Only allow valid roles
		if (role === "admin" || role === "student") {
			setSignupRole({ role, adminCode });
		}
	};

	// Clear signup role after profile creation
	const clearSignupRole = () => {
		setSignupRole(null);
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

	// Check if user is admin
	const isAdmin = () => {
		return userProfile?.role === "admin";
	};

	// Check if user is student
	const isStudent = () => {
		return userProfile?.role === "student";
	};

	// Get current role
	const getCurrentRole = () => {
		return userProfile?.role || signupRole?.role;
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
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
