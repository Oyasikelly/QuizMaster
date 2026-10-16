"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { FaMapMarkerAlt } from "react-icons/fa";

// Province -> Zone -> Area -> Parish picker, starting fresh each time
// (no pre-selection) and drilling down only as deep as real data exists,
// stopping naturally once a level has no children — today that's just
// Province, since zones/areas/parishes aren't seeded yet.
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
			const { data: children } = await supabase
				.from("organizations")
				.select("id, name, level")
				.eq("parent_id", orgId)
				.order("name");
			if (children && children.length > 0) {
				updated.push({ level: children[0].level, options: children, selectedId: "" });
			}
		}
		setOrgChain(updated);

		const selectedOrgId = [...updated].reverse().find((l) => l.selectedId)?.selectedId || null;
		onChange(selectedOrgId);
	};

	return (
		<div className="space-y-3">
			<label className="block text-sm font-medium text-gray-700">{label}</label>
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
							<option value="">Select your {level.level}</option>
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
