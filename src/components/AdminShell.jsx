"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { roleLabel } from "../lib/roles";
import {
	FaTrophy,
	FaClipboardList,
	FaHistory,
	FaUserShield,
	FaCog,
	FaSignOutAlt,
	FaBars,
	FaTimes,
	FaUser,
} from "react-icons/fa";

// Shared sidebar + topbar shell for every admin-facing page. Each page
// still runs its own auth check and data fetching (they have different
// access rules — e.g. Admin Management is super_admin-only) and just
// hands this component the resolved user/orgName once ready. Centralizing
// the shell is what fixes the real inconsistency found in this session's
// audit: four of seven admin pages had no sidebar at all, and the one
// other page with its own sidebar (Settings) was missing the Admin
// Management link and used a different logout destination.
export default function AdminShell({ user, orgName, active, children }) {
	const router = useRouter();
	const [sidebarOpen, setSidebarOpen] = useState(false);

	const handleSignOut = async () => {
		await supabase.auth.signOut();
		router.push("/authenticate");
	};

	const links = [
		{ key: "dashboard", label: "Dashboard", icon: <FaTrophy />, href: "/admin/dashboard" },
		{ key: "content", label: "Content Management", icon: <FaClipboardList />, href: "/admin/content" },
		{ key: "activity", label: "Admin Activity", icon: <FaHistory />, href: "/admin/activity" },
		...(user?.role === "super_admin"
			? [{ key: "manage-admins", label: "Admin Management", icon: <FaUserShield />, href: "/admin/manage-admins" }]
			: []),
		{ key: "settings", label: "Settings", icon: <FaCog />, href: "/admin/settings" },
		{ key: "profile", label: "My Profile", icon: <FaUser />, href: "/admin/profile" },
	];

	return (
		<div className="min-h-screen flex bg-background">
			<aside
				className={`fixed z-30 inset-y-0 left-0 w-64 bg-white shadow-lg transform ${
					sidebarOpen ? "translate-x-0" : "-translate-x-full"
				} transition-transform duration-200 ease-in-out md:relative md:translate-x-0 md:w-60 md:flex-shrink-0`}>
				<div className="flex items-center justify-between px-6 py-5 border-b">
					<div className="flex items-center gap-3 min-w-0">
						<div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center flex-shrink-0">
							<FaUser className="text-white" size={14} />
						</div>
						<div className="min-w-0">
							<p className="font-display font-semibold text-sm text-gray-900 truncate">
								{roleLabel(user?.role)}
							</p>
							{orgName && <p className="text-xs text-gray-500 truncate">{orgName}</p>}
						</div>
					</div>
					<button className="md:hidden p-1 text-gray-500" onClick={() => setSidebarOpen(false)}>
						<FaTimes size={18} />
					</button>
				</div>

				<nav className="mt-4 px-3 space-y-1">
					{links.map((link) => (
						<button
							key={link.key}
							onClick={() => {
								router.push(link.href);
								setSidebarOpen(false);
							}}
							className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
								active === link.key
									? "bg-brand-50 text-brand-700"
									: "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
							}`}>
							<span className={active === link.key ? "text-brand-600" : "text-gray-400"}>{link.icon}</span>
							{link.label}
						</button>
					))}
					<button
						onClick={handleSignOut}
						className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors mt-4 border-t pt-4">
						<span className="text-gray-400"><FaSignOutAlt /></span>
						Logout
					</button>
				</nav>
			</aside>

			{sidebarOpen && (
				<div className="fixed inset-0 z-20 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} />
			)}

			<div className="flex-1 min-w-0 flex flex-col">
				<header className="bg-white border-b shadow-sm md:hidden flex items-center justify-between px-4 py-3">
					<button className="p-1 text-gray-600" onClick={() => setSidebarOpen(true)}>
						<FaBars size={20} />
					</button>
					<span className="font-display font-semibold text-gray-900">{user?.name || "Admin"}</span>
					<span className="w-6" />
				</header>
				<main className="flex-1 min-w-0">{children}</main>
			</div>
		</div>
	);
}
