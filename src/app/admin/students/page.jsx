"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { isAdminRole } from "../../../lib/roles";
import AdminShell from "../../../components/AdminShell";
import StudentManagement from "../../../components/StudentManagement";
import { FaUsers } from "react-icons/fa";

function StudentsPageInner() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [loading, setLoading] = useState(true);
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

			setLoading(false);
		};
		init();
	}, [router]);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">Loading Student Management...</p>
				</div>
			</div>
		);
	}

	return (
		<AdminShell user={currentUser} orgName={orgName} active="students">
			<div className="max-w-6xl mx-auto p-4 sm:p-8">
				<div className="flex items-center gap-3 mb-6">
					<div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center">
						<FaUsers className="text-white" size={16} />
					</div>
					<h1 className="font-display text-xl font-semibold text-gray-900">Student Management</h1>
				</div>

				<StudentManagement
					initialEditId={searchParams?.get("edit") || null}
					initialDeleteId={searchParams?.get("delete") || null}
				/>
			</div>
		</AdminShell>
	);
}

export default function StudentsPage() {
	return (
		<Suspense fallback={null}>
			<StudentsPageInner />
		</Suspense>
	);
}
