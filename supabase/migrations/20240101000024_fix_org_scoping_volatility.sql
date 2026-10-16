-- Fixes a real production bug: a correctly-configured province_admin
-- (verified role + org_id directly in the database, and verified
-- my_scoped_org_ids() itself returning the right single-province array
-- via a live authenticated RPC call) was still seeing every province's
-- students and quiz results on production. The exact same setup, same
-- function definitions, same RLS policy text, worked correctly on
-- staging. The one confirmed difference between the two projects:
-- production is an older project (created Jan 2025) and may be on a
-- different Supabase connection-pooler configuration than brand-new
-- staging (created Oct 2026).
--
-- is_admin(), my_scoped_org_ids(), org_subtree_ids(), org_ancestor_ids()
-- and my_ancestor_org_ids() were all marked STABLE — a correctness
-- promise that they return the same result for the same inputs within
-- one statement, which the planner is allowed to rely on for caching.
-- Under certain pooling setups, a pooled connection reused across
-- different authenticated requests without a full session reset can make
-- that caching assumption unsafe for auth-context-dependent functions
-- like these (they have no arguments, so their actual "input" is the
-- session's auth.uid(), not visible to the planner at all). Marking them
-- VOLATILE removes that caching assumption entirely: every call is
-- re-evaluated fresh, with no possibility of a stale cross-request value
-- being reused, at a negligible cost for this app's scale.

alter function is_admin() volatile;
alter function my_scoped_org_ids() volatile;
alter function org_subtree_ids(uuid) volatile;
alter function org_ancestor_ids(uuid) volatile;
alter function my_ancestor_org_ids() volatile;
alter function my_org_id() volatile;
