"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import { ADMIN_ROLES, roleLabel } from "../../../lib/roles";
import {
	FaUserShield,
	FaTrash,
	FaSave,
	FaArrowLeft,
	FaEye,
	FaTimes,
	FaUser,
	FaIdBadge,
	FaHistory,
} from "react-icons/fa";

const ACTION_COLORS = {
	INSERT: "bg-green-100 text-green-700",
	UPDATE: "bg-amber-100 text-amber-700",
	DELETE: "bg-red-100 text-red-700",
};

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

	// "View" modal — a read-only profile + recent activity, separate from
	// the inline role/province edit controls in the table itself.
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [selectedAdmin, setSelectedAdmin] = useState(null);
	const [adminActivity, setAdminActivity] = useState([]);
	const [activityLoading, setActivityLoading] = useState(false);
	const [activityError, setActivityError] = useState("");

	const loadAdmins = useCallback(async () => {
		const { data, error: adminsError } = await supabase
			.from("users_profile")
			.select("id, name, email, role, org_id, phone, position, department, created_at")
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

	// Uses get_scoped_admin_activity() rather than a plain table read —
	// see 20240101000032: a super_admin's org-scoped read is the exact
	// request shape that was confirmed unreliable straight from
	// PostgREST on production (the original cross-province leak), so a
	// new bulk admin-facing read like this one goes through the
	// SECURITY DEFINER RPC instead of leaning on RLS directly.
	const handleViewAdmin = async (admin) => {
		setSelectedAdmin(admin);
		setShowProfileModal(true);
		setActivityLoading(true);
		setActivityError("");
		const { data, error: activityErr } = await supabase.rpc("get_scoped_admin_activity", {
			p_actor_id: admin.id,
			p_limit: 50,
		});
		if (activityErr) {
			setActivityError(activityErr.message);
		} else {
			setAdminActivity(data || []);
		}
		setActivityLoading(false);
	};

	const closeProfileModal = () => {
		setShowProfileModal(false);
		setSelectedAdmin(null);
		setAdminActivity([]);
		setActivityError("");
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
											<div className="flex gap-2">
												<button
													onClick={() => handleViewAdmin(admin)}
													className="p-2 text-indigo-600 hover:text-indigo-800"
													title="View profile">
													<FaEye size={14} />
												</button>
												{!isSelf && (
													<>
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
													</>
												)}
											</div>
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

				{showProfileModal && selectedAdmin && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
						<div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
							<div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
								<div className="flex items-center space-x-3">
									<div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
										<span className="text-white text-lg font-medium">
											{selectedAdmin.name?.charAt(0) || "A"}
										</span>
									</div>
									<div>
										<h2 className="text-xl font-semibold text-gray-900">Admin Profile</h2>
										<p className="text-sm text-gray-500">{selectedAdmin.name || selectedAdmin.email}</p>
									</div>
								</div>
								<button
									onClick={closeProfileModal}
									className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
									<FaTimes size={20} />
								</button>
							</div>

							<div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] custom-scrollbar">
								<div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
									<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
										<FaUser className="mr-2 text-indigo-500" />
										Personal Information
									</h3>
									<div className="space-y-3">
										<div className="flex justify-between">
											<span className="text-gray-600">Name:</span>
											<span className="font-medium">{selectedAdmin.name || "Not set"}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Email:</span>
											<span className="font-medium">{selectedAdmin.email}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Phone:</span>
											<span className="font-medium">{selectedAdmin.phone || "Not set"}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Position:</span>
											<span className="font-medium">{selectedAdmin.position || "Not set"}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Department:</span>
											<span className="font-medium">{selectedAdmin.department || "Not set"}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Role:</span>
											<span className="font-medium">{roleLabel(selectedAdmin.role)}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Province:</span>
											<span className="font-medium">{selectedAdmin.orgName}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Member since:</span>
											<span className="font-medium">
												{selectedAdmin.created_at
													? new Date(selectedAdmin.created_at).toLocaleDateString()
													: "—"}
											</span>
										</div>
									</div>
								</div>

								<div className="bg-white rounded-xl border border-gray-200 p-6">
									<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
										<FaHistory className="mr-2 text-indigo-500" />
										Recent Activity
									</h3>
									{activityLoading ? (
										<p className="text-sm text-gray-400">Loading activity...</p>
									) : activityError ? (
										<p className="text-sm text-red-600">{activityError}</p>
									) : adminActivity.length === 0 ? (
										<p className="text-sm text-gray-400">No recorded activity yet.</p>
									) : (
										<>
											<div className="flex items-center gap-4 mb-4 text-sm">
												<span className="flex items-center gap-1 text-gray-600">
													<FaIdBadge className="text-indigo-400" size={12} />
													{adminActivity.length === 50 ? "Last 50 actions" : `${adminActivity.length} action${adminActivity.length === 1 ? "" : "s"}`}
												</span>
												<span className="text-gray-400">
													Last active: {new Date(adminActivity[0].created_at).toLocaleString()}
												</span>
											</div>
											<div className="space-y-2 max-h-64 overflow-y-auto">
												{adminActivity.map((entry) => (
													<div
														key={entry.id}
														className="flex items-start justify-between gap-3 px-3 py-2 rounded-lg bg-gray-50 text-sm">
														<div className="min-w-0">
															<p className="truncate text-gray-800">
																{entry.summary || `${entry.action} ${entry.table_name}`}
															</p>
															<p className="text-xs text-gray-400">
																{new Date(entry.created_at).toLocaleString()}
															</p>
														</div>
														<span
															className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
																ACTION_COLORS[entry.action] || "bg-gray-100 text-gray-700"
															}`}>
															{entry.action}
														</span>
													</div>
												))}
											</div>
										</>
									)}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
