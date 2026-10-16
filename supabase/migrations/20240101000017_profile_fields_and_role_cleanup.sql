-- Phase 4 prep, confirmed via chat decisions:
--   1. Add date_of_birth and gender to users_profile (nullable/optional —
--      see src/app/setup-profile/page.jsx for the form changes).
--   2. Drop the speculative 'member' role — confirmed redundant with
--      'student', never actually used (no account was ever migrated to a
--      scoped role this whole session, so no row can hold 'member' today,
--      but the UPDATE below makes this migration safe regardless).
--
-- phone (students now use it too) and org_id (now used as the student's
-- parish / admin's administered org) already exist — from
-- 20240101000015 and 20240101000008/0012 respectively — nothing new
-- needed there, just the app starting to populate them.

alter table users_profile add column if not exists date_of_birth date;
alter table users_profile add column if not exists gender text;

alter table users_profile drop constraint if exists users_profile_gender_check;
alter table users_profile add constraint users_profile_gender_check
    check (gender is null or gender in ('male', 'female'));

update users_profile set role = 'student' where role = 'member';

alter table users_profile drop constraint if exists users_profile_role_check;
alter table users_profile add constraint users_profile_role_check
    check (role in (
        'admin', 'student',
        'super_admin', 'province_admin', 'zone_admin', 'area_admin', 'parish_admin'
    ));
