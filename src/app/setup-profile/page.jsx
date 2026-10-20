"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { motion } from "framer-motion";
import {
	Brain,
	XCircle,
	ArrowRight,
	CheckCircle,
	Sparkles,
	Shield,
	User,
	GraduationCap,
	Building,
	Crown,
	Settings,
	Users,
	BarChart3,
} from "lucide-react";
import {
	FaUser,
	FaEnvelope,
	FaGraduationCap,
	FaLock,
	FaEye,
	FaEyeSlash,
	FaCrown,
	FaKey,
	FaBuilding,
	FaShieldAlt,
	FaUsers,
	FaChartBar,
	FaCog,
	FaPhone,
} from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import ParishPicker from "../../components/ParishPicker";
import { isAdminRole } from "../../lib/roles";
import { DENOMINATIONS } from "../../lib/denominations";

const SetupProfilePage = () => {
	const [formData, setFormData] = useState({
		name: "",
		classname: "",
		role: "student",
		phone: "",
		address: "",
		dateOfBirth: "",
		gender: "",
		denomination: "",
		// Self-reported, free text -- not tied to an admin-managed
		// hierarchy (see ParishPicker). Optional, like phone/DOB/gender.
		zone: "",
		area: "",
		parish: "",
		// Admin-specific fields
		position: "",
		department: "",
	});
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	const { user, signupRole, clearSignupRole, getCurrentRole } = useAuth();

	// Get the current role from context
	const userRole = getCurrentRole() || "student";

	// Optional: zones/areas/parishes aren't seeded yet, so this can't be
	// required without locking people out today.
	const [selectedOrgId, setSelectedOrgId] = useState(null);

	useEffect(() => {
		// If no user is authenticated, redirect to login
		if (!user) {
			router.push("/authenticate");
			return;
		}

		// If user already has a profile, redirect to appropriate dashboard
		if (user && !signupRole) {
			// Check if user already has a profile
			const checkProfile = async () => {
				const { data: profile } = await supabase
					.from("users_profile")
					.select("role")
					.eq("id", user.id)
					.single();

				if (profile) {
					if (isAdminRole(profile.role)) {
						router.push("/admin/dashboard");
					} else {
						router.push("/student/home");
					}
				}
			};
			checkProfile();
		}
	}, [user, signupRole, router]);

	useEffect(() => {
		if (error) {
			const timer = setTimeout(() => setError(""), 2000);
			return () => clearTimeout(timer);
		}
	}, [error]);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		// Validation based on role. Phone/DOB/gender/parish are collected
		// but intentionally NOT required for students: the org tree only
		// has provinces seeded so far (no zones/areas/parishes yet), and a
		// student with no org_id just falls back to the bundled JSON
		// content, not a lockout. An admin is different: they become
		// province_admin, scoped entirely by org_id via
		// my_scoped_org_ids() — with no org_id picked they'd see nothing
		// at all, so it's required here.
		if (userRole === "admin") {
			if (!formData.name || !formData.position || !formData.department || !formData.denomination || !selectedOrgId) {
				setError("All admin fields are required, including your province and denomination.");
				setIsLoading(false);
				return;
			}
		} else {
			if (!formData.name || !formData.classname || !formData.denomination) {
				setError("All student fields are required, including denomination.");
				setIsLoading(false);
				return;
			}
		}

		try {
			// Self-signup admins become province_admin, scoped to whatever
			// org they pick above via my_scoped_org_ids() (already fully
			// supported by RLS — see 20240101000016). super_admin is
			// deliberately NOT reachable from signup; it's only ever
			// granted by an existing super_admin's own action.
			const profileData = {
				id: user.id,
				email: user.email,
				name: formData.name,
				role: userRole === "admin" ? "province_admin" : userRole,
				phone: formData.phone || null,
				address: formData.address || null,
				date_of_birth: formData.dateOfBirth || null,
				gender: formData.gender || null,
				denomination: formData.denomination,
				zone: formData.zone || null,
				area: formData.area || null,
				parish: formData.parish || null,
				org_id: selectedOrgId,
			};

			// Add role-specific fields
			if (userRole === "admin") {
				profileData.position = formData.position;
				profileData.department = formData.department;
			} else {
				profileData.class = formData.classname;
			}

			const { error: insertError } = await supabase
				.from("users_profile")
				.insert([profileData]);

			if (insertError) {
				setError(insertError.message);
				setIsLoading(false);
				return;
			}

			// Clear signup role from context
			clearSignupRole(user.email);

			// Redirect based on role
			if (userRole === "admin") {
				router.push("/admin/dashboard");
			} else {
				router.push("/student/home");
			}
		} catch (err) {
			setError("An error occurred. Please try again.");
			setIsLoading(false);
		}
	};

	return (
		<div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
			{/* Animated Background Elements */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
				<div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
				<div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
			</div>

			<div className="relative z-10 flex items-center justify-center min-h-screen p-4">
				<div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide">
					<motion.div
						initial={{ opacity: 0, scale: 0.9, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl overflow-hidden my-8 relative">
						<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"></div>
						<div className="absolute top-4 right-4 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
						<div className="absolute bottom-4 left-4 w-2 h-2 bg-green-400 rounded-full animate-ping delay-1000"></div>

						<div className="relative p-6 sm:p-8 pb-4">
							{/* Header */}
							<div className="text-center mb-8">
								<motion.div
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									transition={{ delay: 0.2 }}
									className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg ${
										userRole === "admin"
											? "bg-gradient-to-r from-purple-500 to-indigo-600"
											: "bg-gradient-to-r from-blue-500 to-purple-600"
									}`}>
									{userRole === "admin" ? (
										<FaShieldAlt
											className="text-white"
											size={32}
										/>
									) : (
										<User
											className="text-white"
											size={32}
										/>
									)}
								</motion.div>
								<h2 className="text-2xl font-bold text-gray-800 mb-2">
									{userRole === "admin"
										? "Admin Profile Setup"
										: "Complete Your Profile"}
								</h2>
								<p className="text-gray-600">
									{userRole === "admin"
										? "Set up your administrator account"
										: "Set up your account to get started with QuizMaster"}
								</p>
							</div>

							{/* Form */}
							<form
								onSubmit={handleSubmit}
								className="space-y-4">
								{/* Name Field */}
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.3 }}
									className="relative">
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Full Name
									</label>
									<div className="relative">
										<FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
										<input
											type="text"
											name="name"
											value={formData.name}
											onChange={handleChange}
											className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
											placeholder="Enter your full name"
										/>
									</div>
								</motion.div>

								{/* Shared fields: phone, date of birth, gender (all optional) */}
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.35 }}
									className="relative">
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Phone Number
									</label>
									<div className="relative">
										<FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
										<input
											type="tel"
											name="phone"
											value={formData.phone}
											onChange={handleChange}
											className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
											placeholder="Enter your phone number"
										/>
									</div>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.355 }}
									className="relative">
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Address
									</label>
									<input
										type="text"
										name="address"
										value={formData.address}
										onChange={handleChange}
										className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
										placeholder="Enter your home address"
									/>
								</motion.div>

								<div className="grid grid-cols-2 gap-3">
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.37 }}
										className="relative">
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Date of Birth
										</label>
										<input
											type="date"
											name="dateOfBirth"
											value={formData.dateOfBirth}
											onChange={handleChange}
											className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
										/>
									</motion.div>
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.38 }}
										className="relative">
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Gender
										</label>
										<select
											name="gender"
											value={formData.gender}
											onChange={handleChange}
											className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
											<option value="">Select</option>
											<option value="male">Male</option>
											<option value="female">Female</option>
										</select>
									</motion.div>
								</div>

								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.385 }}
									className="relative">
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Denomination <span className="text-red-500">*</span>
									</label>
									<select
										name="denomination"
										value={formData.denomination}
										onChange={handleChange}
										required
										className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
										<option value="">Select denomination</option>
										{DENOMINATIONS.map((d) => (
											<option key={d} value={d}>
												{d}
											</option>
										))}
									</select>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.39 }}>
									<ParishPicker onChange={setSelectedOrgId} />
								</motion.div>

								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.395 }}
									className="grid grid-cols-3 gap-2">
									<input
										type="text"
										name="zone"
										value={formData.zone}
										onChange={handleChange}
										placeholder="Zone"
										className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
									/>
									<input
										type="text"
										name="area"
										value={formData.area}
										onChange={handleChange}
										placeholder="Area"
										className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
									/>
									<input
										type="text"
										name="parish"
										value={formData.parish}
										onChange={handleChange}
										placeholder="Parish"
										className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
									/>
								</motion.div>

								{/* Admin-specific fields */}
								{userRole === "admin" && (
									<>
										{/* Position Field */}
										<motion.div
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: 0.5 }}
											className="relative">
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Position
											</label>
											<div className="relative">
												<FaCrown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
												<input
													type="text"
													name="position"
													value={formData.position}
													onChange={handleChange}
													className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
													placeholder="e.g., Administrator, Manager"
												/>
											</div>
										</motion.div>

										{/* Department Field */}
										<motion.div
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: 0.6 }}
											className="relative">
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Department
											</label>
											<div className="relative">
												<FaBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
												<input
													type="text"
													name="department"
													value={formData.department}
													onChange={handleChange}
													className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
													placeholder="e.g., Education, IT, Management"
												/>
											</div>
										</motion.div>
									</>
								)}

								{/* Student-specific fields */}
								{userRole === "student" && (
									<>
										{/* Class Field */}
										<motion.div
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: 0.4 }}
											className="relative">
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Class
											</label>
											<div className="relative">
												<FaGraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
												<select
													name="classname"
													value={formData.classname}
													onChange={handleChange}
													className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
													<option value="">Select your class</option>
													<option value="yaya">Yaya</option>
													<option value="adult">Adult</option>
													<option value="teenagers">Teenagers</option>
												</select>
											</div>
										</motion.div>
									</>
								)}

								{/* Error Message */}
								{error && (
									<motion.div
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
										<XCircle size={16} />
										<span className="text-sm">{error}</span>
									</motion.div>
								)}

								{/* Submit Button */}
								<motion.button
									type="submit"
									disabled={isLoading}
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									className={`w-full py-3 px-6 rounded-xl font-medium text-white transition-all ${
										isLoading
											? "bg-gray-400 cursor-not-allowed"
											: userRole === "admin"
											? "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
											: "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
									} flex items-center justify-center space-x-2`}>
									{isLoading ? (
										<>
											<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
											<span>Setting up profile...</span>
										</>
									) : (
										<>
											<span>
												{userRole === "admin"
													? "Complete Admin Setup"
													: "Complete Setup"}
											</span>
											<ArrowRight size={16} />
										</>
									)}
								</motion.button>
							</form>
						</div>
					</motion.div>
				</div>
			</div>
		</div>
	);
};

export default SetupProfilePage;
