-- Phase 2 (Role Model Upgrade), task t11. The `role` column has been plain
-- unconstrained text since 20240101000001 — this just formally documents
-- and enforces the vocabulary. Purely additive: every existing row is
-- already 'admin' or 'student', both in the allowed set, so this cannot
-- reject anything that exists today.
--
-- IMPORTANT: creating an account with one of the new scoped roles does NOT
-- grant it anything yet. is_admin() (used by every current RLS policy)
-- checks role = 'admin' exactly — a 'province_admin' account today is
-- treated as a plain authenticated user, nothing more, until Phase 3 (RLS
-- Rollout) teaches the policies to recognize scoped roles. Do not reassign
-- a real admin's role away from 'admin' before then — doing so strips
-- their access immediately (roadmap task t14 is deliberately blocked on
-- Phase 3 for this exact reason).

alter table users_profile drop constraint if exists users_profile_role_check;
alter table users_profile add constraint users_profile_role_check
    check (role in (
        'admin', 'student',
        'super_admin', 'province_admin', 'zone_admin', 'area_admin', 'parish_admin', 'member'
    ));
