"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { isAdminRole } from "../../../lib/roles";
import AdminShell from "../../../components/AdminShell";
import { FaSitemap, FaPlus, FaTrash, FaChevronRight, FaExclamationTriangle } from "react-icons/fa";

// Region -> Province -> Zone -> Area -> Parish. A province_admin's own
// org_id IS a province, so the first column they see is its Zones; a
// zone_admin's own org_id is a zone, so they only ever see Areas then
// Parishes; a parish_admin's own org is already a leaf, nothing to add.
const CHILD_LEVEL = { region: "province", province: "zone", zone: "area", area: "parish", parish: null };
const LEVEL_LABEL = { province: "Province", zone: "Zone", area: "Area", parish: "Parish" };
const LEVEL_LABEL_PLURAL = { province: "Provinces", zone: "Zones", area: "Areas", parish: "Parishes" };

const OrganizationsPage = () => {
	const router = useRouter();

	const [loading, setLoading] = useState(true);
	const [accessDenied, setAccessDenied] = useState(false);
	const [error, setError] = useState("");
	const [successMsg, setSuccessMsg] = useState("");
	const [currentUser, setCurrentUser] = useState(null);
	const [orgName, setOrgName] = useState("");

	// Super_admin (or legacy admin) isn't tied to one province — same
	// picker pattern as Content Management, for the same reason: their
	// own org_id is the Region root, not a province to drill under
	// directly.
	const [showProvincePicker, setShowProvincePicker] = useState(false);
	const [provinces, setProvinces] = useState([]);

	// chainOrgs[0] is whichever org's children the first column shows
	// (a province, or a scoped admin's own zone/area/parish); each
	// subsequent entry is the node selected in the previous column.
	const [chainOrgs, setChainOrgs] = useState([]);
	const [childrenMap, setChildrenMap] = useState({}); // { [parentId]: [{id,name,code,level}] }
	const [newInputs, setNewInputs] = useState({}); // { [parentId]: {name, code} }
	const [busyParentId, setBusyParentId] = useState(null);

	const loadChildren = useCallback(async (parentId) => {
		const { data, error: fetchError } = await supabase
			.from("organizations")
			.select("id, name, code, level")
			.eq("parent_id", parentId)
			.order("name");
		if (fetchError) {
			setError(`Couldn't load: ${fetchError.message}`);
			return;
		}
		setChildrenMap((prev) => ({ ...prev, [parentId]: data || [] }));
	}, []);

	useEffect(() => {
		const init = async () => {
			setLoading(true);
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

			if (profile.role === "admin" || profile.role === "super_admin") {
				setShowProvincePicker(true);
				const { data: provinceList } = await supabase
					.from("organizations")
					.select("id, name, code, level")
					.eq("level", "province")
					.order("name");
				setProvinces(provinceList || []);
				if (provinceList && provinceList.length > 0) {
					setOrgName(provinceList[0].name);
					setChainOrgs([provinceList[0]]);
				} else {
					setAccessDenied(true);
					setError("No provinces exist yet — add one via the organizations table before managing this.");
				}
			} else if (profile.org_id) {
				const { data: org } = await supabase
					.from("organizations")
					.select("id, name, code, level")
					.eq("id", profile.org_id)
					.maybeSingle();
				if (org) {
					setOrgName(org.name);
					setChainOrgs([org]);
				} else {
					setAccessDenied(true);
					setError("Your account's organization couldn't be found.");
				}
			} else {
				setAccessDenied(true);
				setError("Your account has no parish/province assigned yet — set one in your profile first.");
			}

			setLoading(false);
		};
		init();
	}, [router]);

	// Keep every non-leaf node in the current chain stocked with its
	// children, including ones already cached from a previous visit.
	useEffect(() => {
		chainOrgs.forEach((node) => {
			if (node.level !== "parish" && !childrenMap[node.id]) loadChildren(node.id);
		});
	}, [chainOrgs, childrenMap, loadChildren]);

	const handleProvinceChange = (provinceId) => {
		const p = provinces.find((pr) => pr.id === provinceId);
		if (!p) return;
		setOrgName(p.name);
		setChainOrgs([p]);
	};

	// Selecting a node in the column under `parentId` becomes the new
	// tip of the chain — anything deeper than that column is dropped,
	// same as drilling into a different branch in Content Management.
	const selectNode = (parentId, node) => {
		const idx = chainOrgs.findIndex((n) => n.id === parentId);
		if (idx === -1) return;
		setChainOrgs([...chainOrgs.slice(0, idx + 1), node]);
	};

	const handleInputChange = (parentId, field, value) => {
		// Merge onto a {name:"",code:""} baseline, not onto prev[parentId]
		// directly — typing only the name field first would otherwise
		// produce a draft with no `code` key at all, so the code input's
		// value briefly becomes undefined (a controlled input turning
		// uncontrolled), confirmed via a real React warning in testing.
		setNewInputs((prev) => ({
			...prev,
			[parentId]: { name: "", code: "", ...prev[parentId], [field]: value },
		}));
	};

	const handleAddChild = async (parentId, parentLevel) => {
		setError("");
		setSuccessMsg("");
		const input = newInputs[parentId] || {};
		const name = (input.name || "").trim();
		const code = (input.code || "").trim();
		const level = CHILD_LEVEL[parentLevel];
		if (!name || !code) {
			setError(`Both name and code are required to add a ${LEVEL_LABEL[level]}.`);
			return;
		}
		setBusyParentId(parentId);
		const { error: insertError } = await supabase.from("organizations").insert({
			parent_id: parentId,
			level,
			name,
			code,
		});
		setBusyParentId(null);
		if (insertError) {
			setError(
				insertError.message.includes("duplicate")
					? `A ${LEVEL_LABEL[level]} with that code already exists under here — codes must be unique among siblings.`
					: `Couldn't add ${LEVEL_LABEL[level]}: ${insertError.message}`
			);
			return;
		}
		setNewInputs((prev) => ({ ...prev, [parentId]: { name: "", code: "" } }));
		setSuccessMsg(`Added ${name}.`);
		setTimeout(() => setSuccessMsg(""), 3000);
		loadChildren(parentId);
	};

	const handleDelete = async (org, parentId) => {
		if (
			!window.confirm(
				`Delete "${org.name}"? This can't be undone, and only works if nothing (students, admins, sub-levels, content) is assigned under it.`
			)
		)
			return;
		setError("");
		const { error: deleteError } = await supabase.from("organizations").delete().eq("id", org.id);
		if (deleteError) {
			setError(
				`Couldn't delete "${org.name}" — it still has students, admins, or sub-levels assigned under it. Reassign or remove those first.`
			);
			return;
		}
		loadChildren(parentId);
		setChainOrgs((prev) => {
			const idx = prev.findIndex((n) => n.id === org.id);
			return idx === -1 ? prev : prev.slice(0, idx);
		});
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">Loading organization structure...</p>
				</div>
			</div>
		);
	}

	if (accessDenied) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
					<FaExclamationTriangle className="text-amber-500 text-5xl mx-auto mb-4" />
					<h2 className="font-display text-2xl font-bold text-gray-800 mb-2">Can't manage this yet</h2>
					<p className="text-gray-600 mb-6">{error}</p>
					<button
						onClick={() => router.push("/admin/dashboard")}
						className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium">
						Back to Dashboard
					</button>
				</div>
			</div>
		);
	}

	// One column per non-leaf node in the chain (province's Zones, then
	// the selected zone's Areas, then the selected area's Parishes —
	// fewer columns if a scoped admin's own org already starts deeper).
	const columnNodes = chainOrgs.filter((n) => n.level !== "parish");

	return (
		<AdminShell user={currentUser} orgName={orgName} active="organizations">
			<div className="max-w-6xl mx-auto p-4 sm:p-8">
				<div className="flex items-center gap-3 mb-6">
					<div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center">
						<FaSitemap className="text-white" size={16} />
					</div>
					<div>
						<h1 className="font-display text-xl font-semibold text-gray-900">Organization Structure</h1>
						<p className="text-sm text-gray-500">
							Add zones, areas, and parishes so students and admins can select them on their profile.
						</p>
					</div>
				</div>

				{showProvincePicker && provinces.length > 0 && (
					<div className="bg-white rounded-xl shadow p-4 mb-4">
						<label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
						<select
							value={chainOrgs[0]?.id || ""}
							onChange={(e) => handleProvinceChange(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500">
							{provinces.map((p) => (
								<option key={p.id} value={p.id}>
									{p.name}
								</option>
							))}
						</select>
					</div>
				)}

				{error && (
					<div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
						<span>{error}</span>
						<button onClick={() => setError("")} className="text-red-400 hover:text-red-600">✕</button>
					</div>
				)}
				{successMsg && (
					<div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 mb-4 text-sm">{successMsg}</div>
				)}

				{columnNodes.length === 0 ? (
					<div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
						{chainOrgs[0]?.level === "parish"
							? "Your account is assigned to a parish — the smallest unit. Nothing further to add here."
							: "Nothing to show yet."}
					</div>
				) : (
					<div className={`grid grid-cols-1 gap-4 ${columnNodes.length >= 3 ? "md:grid-cols-3" : columnNodes.length === 2 ? "md:grid-cols-2" : "max-w-md"}`}>
						{columnNodes.map((node) => {
							const childLevel = CHILD_LEVEL[node.level];
							const items = childrenMap[node.id] || [];
							const selectedChildId = chainOrgs[chainOrgs.indexOf(node) + 1]?.id;
							const input = newInputs[node.id] || { name: "", code: "" };
							return (
								<div key={node.id} className="bg-white rounded-xl shadow p-4">
									<h3 className="font-semibold text-gray-800 mb-1">{LEVEL_LABEL_PLURAL[childLevel]}</h3>
									<p className="text-xs text-gray-400 mb-3 truncate">Under {node.name}</p>
									<div className="space-y-1 mb-3 max-h-56 overflow-y-auto">
										{items.length === 0 && <p className="text-sm text-gray-400">None yet.</p>}
										{items.map((item) => (
											<div
												key={item.id}
												className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm ${
													selectedChildId === item.id ? "bg-brand-100 text-brand-800" : "hover:bg-gray-50"
												}`}
												onClick={() => selectNode(node.id, item)}>
												<span className="flex items-center gap-1 truncate">
													{item.level !== "parish" && <FaChevronRight size={10} className="flex-shrink-0" />}
													<span className="truncate">{item.name}</span>
													<span className="text-xs text-gray-400 flex-shrink-0">({item.code})</span>
												</span>
												<button
													onClick={(e) => {
														e.stopPropagation();
														handleDelete(item, node.id);
													}}
													className="text-red-400 hover:text-red-600 flex-shrink-0">
													<FaTrash size={12} />
												</button>
											</div>
										))}
									</div>
									<div className="space-y-1">
										<input
											type="text"
											value={input.name}
											onChange={(e) => handleInputChange(node.id, "name", e.target.value)}
											placeholder={`${LEVEL_LABEL[childLevel]} name (e.g. "Zone 1")`}
											className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
										/>
										<input
											type="text"
											value={input.code}
											onChange={(e) => handleInputChange(node.id, "code", e.target.value)}
											placeholder="Short code (e.g. Z1) — unique here"
											className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
										/>
										<button
											onClick={() => handleAddChild(node.id, node.level)}
											disabled={busyParentId === node.id}
											className="w-full px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm flex items-center justify-center gap-1 disabled:opacity-50">
											<FaPlus size={12} /> Add {LEVEL_LABEL[childLevel]}
										</button>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</AdminShell>
	);
};

export default OrganizationsPage;
