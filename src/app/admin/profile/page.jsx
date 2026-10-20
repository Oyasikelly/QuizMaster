"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { isAdminRole, roleLabel } from "../../../lib/roles";
import AdminShell from "../../../components/AdminShell";
import { DENOMINATIONS } from "../../../lib/denominations";
import { FaUser, FaIdBadge, FaSave } from "react-icons/fa";

const AdminProfile = () => {
	const router = useRouter();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [successMsg, setSuccessMsg] = useState("");

	const [currentUser, setCurrentUser] = useState(null);
	const [orgName, setOrgName] = useState("");

	// Account-level fields (email, role, province, join date) are
	// read-only here by design — role/province changes stay a
	// super_admin-only action via Admin Management, consistent with
	// admin_set_user_role being the only path that can touch `role` at
	// all (see 20240101000023).
	const [account, setAccount] = useState({ email: "", role: "", createdAt: null });

	const [form, setForm] = useState({
		name: "",
		phone: "",
		address: "",
		position: "",
		department: "",
		dateOfBirth: "",
		gender: "",
		denomination: "",
	});

	useEffect(() => {
		const init = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) {
				router.push("/authenticate");
				return;
			}

			const { data: profile, error: profileError } = await supabase
				.from("users_profile")
				.select("role, name, email, phone, address, position, department, date_of_birth, gender, denomination, org_id, created_at")
				.eq("id", user.id)
				.single();

			if (profileError || !isAdminRole(profile?.role)) {
				router.push("/authenticate");
				return;
			}

			setCurrentUser({ ...user, ...profile });
			setAccount({ email: profile.email || user.email || "", role: profile.role, createdAt: profile.created_at });
			setForm({
				name: profile.name || "",
				phone: profile.phone || "",
				address: profile.address || "",
				position: profile.position || "",
				department: profile.department || "",
				dateOfBirth: profile.date_of_birth || "",
				gender: profile.gender || "",
				denomination: profile.denomination || "",
			});

			if (profile.org_id) {
				const { data: org } = await supabase
					.from("organizations")
					.select("name")
					.eq("id", profile.org_id)
					.maybeSingle();
				setOrgName(org?.name || "");
			}

			setLoading(false);
		};
		init();
	}, [router]);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleSave = async (e) => {
		e.preventDefault();
		setError("");
		setSuccessMsg("");
		if (!form.name.trim()) {
			setError("Name is required.");
			return;
		}
		if (!form.denomination) {
			setError("Denomination is required.");
			return;
		}
		setSaving(true);
		const { error: updateError } = await supabase
			.from("users_profile")
			.update({
				name: form.name.trim(),
				phone: form.phone.trim() || null,
				address: form.address.trim() || null,
				position: form.position.trim() || null,
				department: form.department.trim() || null,
				date_of_birth: form.dateOfBirth || null,
				gender: form.gender || null,
				denomination: form.denomination,
			})
			.eq("id", currentUser.id);
		setSaving(false);
		if (updateError) {
			setError(`Couldn't save: ${updateError.message}`);
			return;
		}
		setSuccessMsg("Profile updated.");
		setTimeout(() => setSuccessMsg(""), 4000);
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">Loading your profile...</p>
				</div>
			</div>
		);
	}

	return (
		<AdminShell user={currentUser} orgName={orgName} active="profile">
			<div className="max-w-3xl mx-auto p-4 sm:p-8">
				<div className="flex items-center gap-3 mb-6">
					<div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center text-white text-lg font-semibold">
						{form.name?.charAt(0)?.toUpperCase() || "A"}
					</div>
					<div>
						<h1 className="font-display text-xl font-semibold text-gray-900">My Profile</h1>
						<p className="text-sm text-gray-500">{roleLabel(account.role)}</p>
					</div>
				</div>

				{error && (
					<div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
						<span>{error}</span>
						<button onClick={() => setError("")} className="text-red-400 hover:text-red-600">✕</button>
					</div>
				)}
				{successMsg && (
					<div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 mb-4 text-sm">
						{successMsg}
					</div>
				)}

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
					<div className="bg-white rounded-xl shadow p-5">
						<h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
							<FaIdBadge className="text-brand-500" size={14} /> Account Information
						</h3>
						<div className="space-y-2 text-sm">
							<div className="flex justify-between gap-3">
								<span className="text-gray-500">Email</span>
								<span className="font-medium text-gray-900 truncate">{account.email}</span>
							</div>
							<div className="flex justify-between gap-3">
								<span className="text-gray-500">Role</span>
								<span className="font-medium text-gray-900">{roleLabel(account.role)}</span>
							</div>
							<div className="flex justify-between gap-3">
								<span className="text-gray-500">Province</span>
								<span className="font-medium text-gray-900">{orgName || "Not assigned"}</span>
							</div>
							<div className="flex justify-between gap-3">
								<span className="text-gray-500">Member since</span>
								<span className="font-medium text-gray-900">
									{account.createdAt ? new Date(account.createdAt).toLocaleDateString() : "—"}
								</span>
							</div>
						</div>
						<p className="text-xs text-gray-400 mt-3">
							Role and province can only be changed by a Super Admin, from Admin Management.
						</p>
					</div>

					<form onSubmit={handleSave} className="bg-white rounded-xl shadow p-5">
						<h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
							<FaUser className="text-brand-500" size={14} /> Personal Information
						</h3>
						<div className="space-y-2">
							<input
								type="text"
								name="name"
								value={form.name}
								onChange={handleChange}
								placeholder="Full name"
								className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
							/>
							<input
								type="tel"
								name="phone"
								value={form.phone}
								onChange={handleChange}
								placeholder="Phone number"
								className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
							/>
							<input
								type="text"
								name="address"
								value={form.address}
								onChange={handleChange}
								placeholder="Address"
								className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
							/>
							<input
								type="text"
								name="position"
								value={form.position}
								onChange={handleChange}
								placeholder="Position (e.g. Administrator)"
								className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
							/>
							<input
								type="text"
								name="department"
								value={form.department}
								onChange={handleChange}
								placeholder="Department (e.g. Education)"
								className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
							/>
							<select
								name="denomination"
								value={form.denomination}
								onChange={handleChange}
								required
								className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
								<option value="">Select denomination</option>
								{DENOMINATIONS.map((d) => (
									<option key={d} value={d}>
										{d}
									</option>
								))}
							</select>
							<div className="grid grid-cols-2 gap-2">
								<input
									type="date"
									name="dateOfBirth"
									value={form.dateOfBirth}
									onChange={handleChange}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
								/>
								<select
									name="gender"
									value={form.gender}
									onChange={handleChange}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
									<option value="">Gender</option>
									<option value="male">Male</option>
									<option value="female">Female</option>
								</select>
							</div>
						</div>
						<button
							type="submit"
							disabled={saving}
							className="w-full mt-4 px-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
							<FaSave size={12} /> {saving ? "Saving..." : "Save Changes"}
						</button>
					</form>
				</div>
			</div>
		</AdminShell>
	);
};

export default AdminProfile;
