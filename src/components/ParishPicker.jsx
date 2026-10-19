"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { FaMapMarkerAlt } from "react-icons/fa";

// Just a Province dropdown. Used to drill all the way down through
// Zone -> Area -> Parish via an admin-managed org tree, but that turned
// out to be more complexity than the real need called for -- Zone/Area/
// Parish are now plain text fields a student fills in themselves
// (see setup-profile and student/profile), not a structured hierarchy.
// Province stays structured since it's a small, stable, pre-seeded list.
//
// Calls onChange(orgId) with the selected province, or null if nothing's
// been picked. Used by both the initial signup form
// (src/app/setup-profile/page.jsx) and the profile edit page
// (src/app/student/profile/page.jsx).
export default function ParishPicker({ onChange, label = "Province" }) {
	const [provinces, setProvinces] = useState([]);
	const [selectedId, setSelectedId] = useState("");
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadProvinces = async () => {
			setLoading(true);
			const { data } = await supabase
				.from("organizations")
				.select("id, name")
				.eq("level", "province")
				.order("name");
			setProvinces(data || []);
			setLoading(false);
		};
		loadProvinces();
	}, []);

	const handleChange = (orgId) => {
		setSelectedId(orgId);
		onChange(orgId || null);
	};

	return (
		<div className="space-y-1">
			<label className="block text-sm font-medium text-gray-700">{label}</label>
			{loading ? (
				<div className="text-sm text-gray-400">Loading...</div>
			) : (
				<div className="relative">
					<FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
					<select
						value={selectedId}
						onChange={(e) => handleChange(e.target.value)}
						className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
						<option value="">Select your province</option>
						{provinces.map((p) => (
							<option key={p.id} value={p.id}>
								{p.name}
							</option>
						))}
					</select>
				</div>
			)}
		</div>
	);
}
