-- Fixes a real regression from Phase 3 (20240101000016): the users_profile
-- UPDATE policy was admin/scoped-admin only, on the wrong assumption that
-- nothing else updated this table. src/app/student/profile/page.jsx's
-- Edit Profile feature (pre-existing, before this session) does — so does
-- StudentManagement.jsx (an admin editing another student's record). Both
-- have been silently writing zero rows since RLS was enabled: Postgres
-- doesn't error when an UPDATE's RLS check matches no rows, so the UI
-- showed "updated successfully" while nothing actually changed.
--
-- Fix is two layers, not just reverting the row-level policy:
--   1. Row-level (RLS): allow self-update again, alongside admin/scoped.
--   2. Column-level (GRANT): restrict which columns `authenticated` may
--      write AT ALL, regardless of which row-level condition matched —
--      explicitly excluding `role`. This is what actually prevents a
--      student from self-promoting via this broadened policy; RLS alone
--      can't express a column-level restriction. The column list is the
--      exact union of what the app ever writes via UPDATE today
--      (profile self-edit + admin editing a student's record). Nothing
--      currently updates `role` outside manual dashboard edits (t14) —
--      if a real "promote to admin" admin feature is ever built, it
--      needs its own deliberately-checked path, not an extension of this
--      grant.

revoke update on users_profile from authenticated;
grant update (name, email, class, phone, date_of_birth, gender, org_id, denomination)
    on users_profile to authenticated;

drop policy if exists "users_profile_update_admin_or_scoped" on users_profile;
create policy "users_profile_update_self_admin_or_scoped" on users_profile
    for update
    to authenticated
    using (id = auth.uid() or is_admin() or org_id = any (my_scoped_org_ids()))
    with check (id = auth.uid() or is_admin() or org_id = any (my_scoped_org_ids()));
