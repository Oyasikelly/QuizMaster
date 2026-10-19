"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { FaMapMarkerAlt } from "react-icons/fa";

// Province -> Zone -> Area -> Parish picker, starting fresh each time
// (no pre-selection) and drilling down only as deep as real data exists,
// stopping naturally once a level has no children.
//
// A Zone/Area can itself BE someone's church (not every zone splits into
// named areas, not every area splits into named parishes) — so even when
// a deeper level's dropdown appears because the parent DOES have
// children, leaving it on its default option is a complete, valid
// answer: onChange always reports the deepest level actually selected,
// not the deepest level technically available. The empty option's own
// text says this explicitly per level, since otherwise it reads like a
// required field you forgot to fill in.
//
// Calls onChange(orgId) with the deepest level actually selected, or
// null if nothing's been picked. Used by both the initial signup form
// (src/app/setup-profile/page.jsx) and the profile edit page
// (src/app/student/profile/page.jsx).
export default function ParishPicker({ onChange, label = "Parish (Province → Zone → Area → Parish)" }) {
	const [orgChain, setOrgChain] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadProvinces = async () => {
			setLoading(true);
			const { data } = await supabase
				.from("organizations")
				.select("id, name, level")
				.eq("level", "province")
				.order("name");
			setOrgChain([{ level: "province", options: data || [], selectedId: "" }]);
			setLoading(false);
		};
		loadProvinces();
	}, []);

	const handleLevelChange = async (index, orgId) => {
		const updated = orgChain.slice(0, index + 1);
		updated[index] = { ...updated[index], selectedId: orgId };

		if (orgId) {
			const selectedName = updated[index].options.find((o) => o.id === orgId)?.name || "";
			const { data: children } = await supabase
				.from("organizations")
				.select("id, name, level")
				.eq("parent_id", orgId)
				.order("name");
			if (children && children.length > 0) {
				updated.push({ level: children[0].level, options: children, selectedId: "", parentName: selectedName });
			}
		}
		setOrgChain(updated);

		const selectedOrgId = [...updated].reverse().find((l) => l.selectedId)?.selectedId || null;
		onChange(selectedOrgId);
	};

	return (
		<div className="space-y-3">
			<label className="block text-sm font-medium text-gray-700">{label}</label>
			{orgChain.length > 1 && (
				<p className="text-xs text-gray-500 -mt-2">
					If your church doesn't have its own entry at the next level, stop where you are — the first
					option on each dropdown below says so explicitly.
				</p>
			)}
			{loading ? (
				<div className="text-sm text-gray-400">Loading...</div>
			) : (
				orgChain.map((level, index) => (
					<div
						key={level.level + index}
						className="relative">
						<FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
						<select
							value={level.selectedId}
							onChange={(e) => handleLevelChange(index, e.target.value)}
							className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all capitalize">
							<option value="">
								{level.parentName
									? `— I worship at ${level.parentName} itself, no ${level.level} —`
									: `Select your ${level.level}`}
							</option>
							{level.options.map((org) => (
								<option
									key={org.id}
									value={org.id}>
									{org.name}
								</option>
							))}
						</select>
					</div>
				))
			)}
		</div>
	);
}
