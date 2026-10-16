-- Interim, ROLE-based RLS — not the org-scoped policies Phase 3 (RLS
-- Rollout, roadmap tasks t15-t18) will eventually put in place once
-- Phase 1 adds org_id. This closes the actual gap visible today: with RLS
-- disabled, any authenticated user (a student included) can read or
-- overwrite ANY row in users_profile / quiz_results, and read or change
-- quiz_settings (real-quiz timing, practice-mode toggle).
--
-- Every policy here matches an access pattern that already exists in the
-- app code (src/components/Quiz.jsx, src/contexts/AuthContext.jsx,
-- src/app/setup-profile/page.jsx, src/lib/quiz-config.js, the admin
-- dashboard) — nothing here should change what a correctly-behaving
-- student or admin session can already do. Re-run
-- docs/regression-checklist.md afterward, section 6 (admin visibility)
-- especially, since that's the part most likely to surface a pattern this
-- migration didn't anticipate.

-- SECURITY DEFINER + a fixed search_path so this can check `role` on
-- users_profile from inside policies ON users_profile itself without
-- recursing into those same policies (the function runs as its owner,
-- who — as the table owner — bypasses RLS).
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from users_profile
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- users_profile
-- ---------------------------------------------------------------------
alter table users_profile enable row level security;

drop policy if exists "users_profile_select_own_or_admin" on users_profile;
create policy "users_profile_select_own_or_admin" on users_profile
    for select
    to authenticated
    using (id = auth.uid() or is_admin());

drop policy if exists "users_profile_insert_own" on users_profile;
create policy "users_profile_insert_own" on users_profile
    for insert
    to authenticated
    with check (id = auth.uid());

-- No self-UPDATE: nothing in the app updates users_profile today (setup-
-- profile only inserts), so admin-only avoids a self-escalation path
-- (e.g. a student UPDATE-ing their own row to set role='admin') until a
-- real "edit my profile" feature needs it — add it deliberately then,
-- scoped to the specific columns a profile edit should touch.
drop policy if exists "users_profile_update_admin_only" on users_profile;
create policy "users_profile_update_admin_only" on users_profile
    for update
    to authenticated
    using (is_admin())
    with check (is_admin());

drop policy if exists "users_profile_delete_admin_only" on users_profile;
create policy "users_profile_delete_admin_only" on users_profile
    for delete
    to authenticated
    using (is_admin());

-- ---------------------------------------------------------------------
-- quiz_results
-- ---------------------------------------------------------------------
alter table quiz_results enable row level security;

drop policy if exists "quiz_results_select_own_or_admin" on quiz_results;
create policy "quiz_results_select_own_or_admin" on quiz_results
    for select
    to authenticated
    using (student_id = auth.uid() or is_admin());

drop policy if exists "quiz_results_insert_own" on quiz_results;
create policy "quiz_results_insert_own" on quiz_results
    for insert
    to authenticated
    with check (student_id = auth.uid());

-- The app never updates/deletes a quiz_results row once submitted.
drop policy if exists "quiz_results_update_admin_only" on quiz_results;
create policy "quiz_results_update_admin_only" on quiz_results
    for update
    to authenticated
    using (is_admin())
    with check (is_admin());

drop policy if exists "quiz_results_delete_admin_only" on quiz_results;
create policy "quiz_results_delete_admin_only" on quiz_results
    for delete
    to authenticated
    using (is_admin());

-- ---------------------------------------------------------------------
-- quiz_settings
-- ---------------------------------------------------------------------
alter table quiz_settings enable row level security;

-- Read must stay open to EVERYONE, signed in or not: src/components/
-- SelectTime.jsx calls isRealQuizActive()/getQuizSettings() on /quiz/*
-- pages, which are not behind the auth middleware, before a visitor is
-- necessarily logged in. Config data only (timing, toggles) — no PII.
grant select on quiz_settings to anon;

drop policy if exists "quiz_settings_select_anyone" on quiz_settings;
create policy "quiz_settings_select_anyone" on quiz_settings
    for select
    to anon, authenticated
    using (true);

drop policy if exists "quiz_settings_write_admin_only" on quiz_settings;
create policy "quiz_settings_write_admin_only" on quiz_settings
    for all
    to authenticated
    using (is_admin())
    with check (is_admin());
