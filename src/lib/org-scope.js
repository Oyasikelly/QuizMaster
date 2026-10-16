// Org-scoping helper (roadmap Phase 2, task t12).
//
// Nothing calls this yet — it's unused, forward-looking scaffolding, same
// spirit as src/lib/feature-flags.js. It exists so Phase 6's admin screens
// have a single, already-correct place to ask "which org_ids should this
// user's queries be restricted to?" instead of each screen reinventing it.
//
// IMPORTANT: this is a UI-filtering convenience, not a security boundary.
// The real enforcement is, and until Phase 3 only is, the database's RLS
// policies. A bug here could show an admin the wrong rows in a list; it
// cannot let them read or write rows RLS would otherwise block.

import { supabase } from "./supabase";

// Roles with no org-level restriction: the legacy global admin, and plain
// students/members (who are scoped some other way — their own row — not
// by this helper at all).
const UNSCOPED_ROLES = new Set(["admin", "student", "member"]);

/**
 * Resolves which organization ids a user's queries should be restricted
 * to. Returns `null` to mean "no restriction — don't filter," which is
 * the correct, safe answer for the legacy admin role, for any role with
 * no org_id set yet, and on any lookup failure (fail open: a broken org
 * lookup should never silently narrow what a legitimate admin can see in
 * the UI — if something needs to actually be hidden, that's RLS's job).
 *
 * Returns an array of org ids (the user's own org plus every descendant)
 * for a scoped role with an org_id. Not exercised against real data yet —
 * no account holds a scoped role until Phase 3 makes that safe (see
 * supabase/migrations/20240101000013_extend_role_vocabulary.sql).
 */
export async function getScopedOrgIds(userProfile) {
	if (!userProfile) return null;

	const { role, org_id: orgId } = userProfile;

	if (UNSCOPED_ROLES.has(role) || !orgId) {
		return null;
	}

	const { data, error } = await supabase.rpc("org_subtree_ids", { root_id: orgId });
	if (error) {
		console.error("getScopedOrgIds: failed to resolve org subtree", error);
		return null;
	}

	return data.map((row) => row.id);
}
