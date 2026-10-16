"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import { ADMIN_ROLES, roleLabel } from "../../../lib/roles";
import { FaUserShield, FaTrash, FaSave, FaArrowLeft } from "react-icons/fa";

const withTimeout = (promise, ms) =>
	Promise.race([
		promise,
		new Promise((_, reject) => setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)),
	]);

// Roles a super_admin can assign from this page. Legacy 'admin' is
// deliberately excluded as a target (same as the DB function's check) —
// it can still show up in the list for an account that hasn't been
// converted yet, but this page only ever moves people forward onto the
// scoped role system, never back onto the unscoped legacy one.
const ASSIGNABLE_ROLES = ["province_admin", "zone_admin", "area_admin", "parish_admin", "super_admin"];

export default function ManageAdminsPage() {
	const router = useRouter();
	const [viewer, setViewer] = useState(null);
	const [loading, setLoading] = useState(true);
	const [admins, setAdmins] = useState([]);
	const [provinces, setProvinces] = useState([]);
	const [edits, setEdits] = useState({}); // { [adminId]: { role, orgId } }
	const [busyId, setBusyId] = useState(null);
	const [error, setError] = useState("");
	const [successMsg, setSuccessMsg] = useState("");

	const loadAdmins = useCallback(async () => {
		const { data, error: adminsError } = await supabase
			.from("users_profile")
			.select("id, name, email, role, org_id")
			.in("role", Array.from(ADMIN_ROLES))
			.order("role");
		if (adminsError) {
			setError(adminsError.message);
			return;
		}

		const orgIds = [...new Set((data || []).map((a) => a.org_id).filter(Boolean))];
		let orgNameById = {};
		if (orgIds.length > 0) {
			const { data: orgsData } = await supabase.from("organizations").select("id, name").in("id", orgIds);
			orgNameById = Object.fromEntries((orgsData || []).map((o) => [o.id, o.name]));
		}

		const withOrgNames = (data || []).map((a) => ({ ...a, orgName: a.org_id ? orgNameById[a.org_id] || "Unknown" : "Unassigned" }));
		setAdmins(withOrgNames);

		// Seed edit state so each row's dropdowns default to its current value
		const nextEdits = {};
		withOrgNames.forEach((a) => {
			nextEdits[a.id] = { role: a.role, orgId: a.org_id || "" };
		});
		setEdits(nextEdits);
	}, []);

	useEffect(() => {
		const init = async () => {
			setLoading(true);
			try {
				const {
					data: { user },
				} = await withTimeout(supabase.auth.getUser(), 10000);
				if (!user) {
					router.push("/authenticate");
					return;
				}

				const { data: profile } = await withTimeout(
					supabase.from("users_profile").select("role, name, email").eq("id", user.id).single(),
					10000
				);

				if (profile?.role !== "super_admin") {
					router.push("/admin/dashboard");
					return;
				}
				setViewer({ ...user, ...profile });

				const { data: provincesData } = await supabase
					.from("organizations")
					.select("id, name")
					.eq("level", "province")
					.order("name");
				setProvinces(provincesData || []);

				await loadAdmins();
			} catch (err) {
				console.error("Error loading Admin Management:", err);
				setError("Failed to load. Please refresh and try again.");
			} finally {
				setLoading(false);
			}
		};
		init();
	}, [router, loadAdmins]);

	const handleEditChange = (adminId, field, value) => {
		setEdits((prev) => ({ ...prev, [adminId]: { ...prev[adminId], [field]: value } }));
	};

	const handleSave = async (admin) => {
		setError("");
		setSuccessMsg("");
		setBusyId(admin.id);
		try {
			const { role, orgId } = edits[admin.id];
			if (!orgId) {
				setError("Please pick a province before saving.");
				return;
			}
			const { error: rpcError } = await supabase.rpc("admin_set_user_role", {
				p_target_id: admin.id,
				p_new_role: role,
				p_new_org_id: orgId,
			});
			if (rpcError) {
				setError(rpcError.message);
				return;
			}
			setSuccessMsg(`Updated ${admin.name || admin.email}.`);
			await loadAdmins();
		} catch (err) {
			setError(err.message || "Failed to update admin.");
		} finally {
			setBusyId(null);
		}
	};

	const handleRevoke = async (admin) => {
		if (!window.confirm(`Revoke admin access for ${admin.name || admin.email}? They'll become a regular student account, not be deleted.`)) {
			return;
		}
		setError("");
		setSuccessMsg("");
		setBusyId(admin.id);
		try {
			const { error: rpcError } = await supabase.rpc("admin_set_user_role", {
				p_target_id: admin.id,
				p_new_role: "student",
				p_new_org_id: null,
			});
			if (rpcError) {
				setError(rpcError.message);
				return;
			}
			setSuccessMsg(`Revoked admin access for ${admin.name || admin.email}.`);
			await loadAdmins();
		} catch (err) {
			setError(err.message || "Failed to revoke admin access.");
		} finally {
			setBusyId(null);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">Loading Admin Management...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 px-4 py-8">
			<div className="max-w-5xl mx-auto">
				<button
					onClick={() => router.push("/admin/dashboard")}
					className="flex items-center gap-2 text-indigo-700 hover:text-indigo-900 font-medium mb-6">
					<FaArrowLeft /> Back to Dashboard
				</button>

				<div className="flex items-center gap-3 mb-6">
					<div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
						<FaUserShield className="text-white text-xl" />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
						<p className="text-sm text-gray-500">
							Visible only to Super Admin. Change an admin's role/province, or revoke their access.
						</p>
					</div>
				</div>

				{error && (
					<div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{error}</div>
				)}
				{successMsg && (
					<div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">{successMsg}</div>
				)}

				<div className="bg-white rounded-xl shadow-lg overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-gray-200 bg-gray-50">
								<th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
								<th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
								<th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
								<th className="text-left py-3 px-4 font-medium text-gray-900">Province</th>
								<th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
							</tr>
						</thead>
						<tbody>
							{admins.map((admin) => {
								const isSelf = admin.id === viewer?.id;
								const edit = edits[admin.id] || { role: admin.role, orgId: admin.org_id || "" };
								return (
									<motion.tr
										key={admin.id}
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										className="border-b border-gray-100 hover:bg-gray-50">
										<td className="py-3 px-4 text-gray-900 font-medium">{admin.name || "—"}</td>
										<td className="py-3 px-4 text-gray-600">{admin.email}</td>
										<td className="py-3 px-4">
											{isSelf ? (
												<span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
													{roleLabel(admin.role)} (you)
												</span>
											) : (
												<select
													value={edit.role}
													onChange={(e) => handleEditChange(admin.id, "role", e.target.value)}
													className="px-2 py-1 border border-gray-300 rounded-lg text-sm">
													{admin.role === "admin" && <option value="admin">Admin (legacy)</option>}
													{ASSIGNABLE_ROLES.map((r) => (
														<option key={r} value={r}>
															{roleLabel(r)}
														</option>
													))}
												</select>
											)}
										</td>
										<td className="py-3 px-4">
											{isSelf ? (
												<span className="text-gray-600">{admin.orgName}</span>
											) : (
												<select
													value={edit.orgId}
													onChange={(e) => handleEditChange(admin.id, "orgId", e.target.value)}
													className="px-2 py-1 border border-gray-300 rounded-lg text-sm">
													<option value="">Select province</option>
													{provinces.map((p) => (
														<option key={p.id} value={p.id}>
															{p.name}
														</option>
													))}
												</select>
											)}
										</td>
										<td className="py-3 px-4">
											{!isSelf && (
												<div className="flex gap-2">
													<button
														onClick={() => handleSave(admin)}
														disabled={busyId === admin.id}
														className="p-2 text-green-600 hover:text-green-800 disabled:opacity-50"
														title="Save changes">
														<FaSave size={14} />
													</button>
													<button
														onClick={() => handleRevoke(admin)}
														disabled={busyId === admin.id}
														className="p-2 text-red-600 hover:text-red-800 disabled:opacity-50"
														title="Revoke admin access">
														<FaTrash size={14} />
													</button>
												</div>
											)}
										</td>
									</motion.tr>
								);
							})}
							{admins.length === 0 && (
								<tr>
									<td colSpan={5} className="py-6 text-center text-gray-400">
										No admin accounts found.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
