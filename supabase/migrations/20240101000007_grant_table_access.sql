-- Fixes a gap in the baseline migration (20240101000000): creating a table
-- via raw SQL does not automatically grant the `anon`/`authenticated`
-- Postgres roles the privileges PostgREST needs to serve it over the API,
-- and a freshly created table can pick up Supabase's default
-- row-level-security-enabled-with-no-policies state, which blocks every
-- request with 403 rather than just filtering rows.
--
-- This restores the same permissive, no-real-protection-yet baseline the
-- app currently assumes everywhere else (see 20240101000005, which does
-- the same for quiz_settings) — not a real access-control design. Proper,
-- role/org-scoped RLS policies are Phase 3 (RLS Rollout) work, tasks
-- t15–t18 of the scale-up roadmap; this migration is deliberately temporary
-- and should be superseded there, not built on.

grant select, insert, update, delete on users_profile to authenticated;
grant select, insert, update, delete on quiz_results to authenticated;
grant select, insert, update, delete on quiz_settings to authenticated;

alter table users_profile disable row level security;
alter table quiz_results disable row level security;
-- quiz_settings RLS is already disabled by 20240101000005; repeated here
-- only so this file is a complete, self-contained fix if ever run alone.
alter table quiz_settings disable row level security;
