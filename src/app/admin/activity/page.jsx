"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { isAdminRole, roleLabel } from "../../../lib/roles";
import AdminShell from "../../../components/AdminShell";
import { FaHistory, FaExclamationTriangle } from "react-icons/fa";

const ACTION_COLORS = {
	INSERT: "bg-green-100 text-green-700",
	UPDATE: "bg-amber-100 text-amber-700",
	DELETE: "bg-red-100 text-red-700",
};

const AdminActivity = () => {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [entries, setEntries] = useState([]);
	const [actors, setActors] = useState({});
	const [currentUser, setCurrentUser] = useState(null);
	const [orgName, setOrgName] = useState("");

	useEffect(() => {
		const init = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) {
				router.push("/authenticate");
				return;
			}

			const { data: profile } = await supabase
				.from("users_profile")
				.select("role, org_id")
				.eq("id", user.id)
				.single();

			if (!isAdminRole(profile?.role)) {
				router.push("/authenticate");
				return;
			}
			setCurrentUser({ ...user, ...profile });
			if (profile.org_id) {
				const { data: org } = await supabase
					.from("organizations")
					.select("name")
					.eq("id", profile.org_id)
					.maybeSingle();
				setOrgName(org?.name || "");
			}

			// RLS scopes this automatically: a legacy admin or a super_admin
			// assigned to Region 70 sees everything, a province_admin sees
			// only activity within their own province's subtree, etc. — same
			// mechanism as every other scoped screen, nothing special here.
			const { data, error: fetchError } = await supabase
				.from("admin_activity_log")
				.select("*")
				.order("created_at", { ascending: false })
				.limit(100);

			if (fetchError) {
				setError(fetchError.message);
				setLoading(false);
				return;
			}

			setEntries(data || []);

			const actorIds = [...new Set((data || []).map((e) => e.actor_id).filter(Boolean))];
			if (actorIds.length > 0) {
				const { data: profiles } = await supabase
					.from("users_profile")
					.select("id, name, email")
					.in("id", actorIds);
				const map = {};
				(profiles || []).forEach((p) => {
					map[p.id] = p;
				});
				setActors(map);
			}

			setLoading(false);
		};
		init();
	}, [router]);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">Loading activity...</p>
				</div>
			</div>
		);
	}

	return (
		<AdminShell user={currentUser} orgName={orgName} active="activity">
			<div className="max-w-4xl mx-auto p-4 sm:p-8">
				<div className="flex items-center gap-3 mb-6">
					<div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center">
						<FaHistory className="text-white" size={16} />
					</div>
					<h1 className="font-display text-xl font-semibold text-gray-900">Admin Activity</h1>
				</div>

				{error && (
					<div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
						<FaExclamationTriangle /> {error}
					</div>
				)}

				<div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
					{entries.length === 0 ? (
						<p className="text-sm text-gray-400 p-6 text-center">
							No admin activity recorded yet in your scope.
						</p>
					) : (
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b text-left text-gray-500">
									<th className="px-4 py-3 font-medium">When</th>
									<th className="px-4 py-3 font-medium">Who</th>
									<th className="px-4 py-3 font-medium">Action</th>
									<th className="px-4 py-3 font-medium">Details</th>
								</tr>
							</thead>
							<tbody>
								{entries.map((e) => {
									const actor = actors[e.actor_id];
									return (
										<tr key={e.id} className="border-b last:border-0 hover:bg-gray-50">
											<td className="px-4 py-3 text-gray-500 whitespace-nowrap">
												{new Date(e.created_at).toLocaleString()}
											</td>
											<td className="px-4 py-3">
												<div className="font-medium text-gray-800">{actor?.name || "Unknown"}</div>
												<div className="text-xs text-gray-400">{roleLabel(e.actor_role)}</div>
											</td>
											<td className="px-4 py-3">
												<span
													className={`px-2 py-0.5 rounded-full text-xs font-medium ${
														ACTION_COLORS[e.action] || "bg-gray-100 text-gray-700"
													}`}>
													{e.action}
												</span>
												<div className="text-xs text-gray-400 mt-0.5">{e.table_name}</div>
											</td>
											<td className="px-4 py-3 text-gray-700 max-w-xs truncate">{e.summary}</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					)}
				</div>
			</div>
		</AdminShell>
	);
};

export default AdminActivity;
