// Feature-flag seam for the multi-tenant scale-up (roadmap Phase 0, task t05).
//
// Nothing in the app imports this yet — adding it changes no current
// behavior. The point is to have a single place to gate new, in-progress
// code paths (org-scoped routing, DB-backed questions, new role model...)
// behind a flag, so they can ship disabled and be turned on per-environment
// or per-org without a redeploy of the old path.
//
// Client components can only see env vars prefixed NEXT_PUBLIC_ (Next.js
// inlines them at build time), so every flag here is exposed that way. Keep
// anything genuinely secret out of this file entirely.

const FLAG_ENV_VARS = {
	// Phase 1: read/write org_id instead of assuming the legacy single tenant.
	multiTenantOrgs: "NEXT_PUBLIC_FLAG_MULTI_TENANT_ORGS",
	// Phase 5: read questions/lessons from the database instead of the
	// bundled JSON files (still falls back to JSON when the DB has nothing
	// for an org — see roadmap task t25).
	dbBackedQuestions: "NEXT_PUBLIC_FLAG_DB_BACKED_QUESTIONS",
};

const parseBoolean = (value) => value === "true" || value === "1";

/**
 * Whether a feature flag is enabled.
 *
 * `orgId` is accepted now so call sites don't need to change again once
 * Phase 1 adds real per-org overrides (e.g. a flag enabled for one pilot
 * province's org_id before the rest) — until then every flag is global,
 * sourced from the environment only.
 */
export function isFeatureEnabled(flagName, { orgId } = {}) {
	const envVar = FLAG_ENV_VARS[flagName];
	if (!envVar) {
		console.warn(`Unknown feature flag: "${flagName}"`);
		return false;
	}
	// orgId is unused until Phase 1 introduces per-org overrides.
	void orgId;
	return parseBoolean(process.env[envVar]);
}
