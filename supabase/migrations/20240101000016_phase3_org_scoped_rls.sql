-- Phase 3 (RLS Rollout). Extends the interim role-based policies
-- (20240101000009) with real org-scoped access, per the confirmed product
-- decision: admin authority cascades downward — an admin at any scoped
-- role (province_admin, zone_admin, area_admin, parish_admin, super_admin)
-- manages everything in their own org plus every descendant below it.
--
-- SAFE BY CONSTRUCTION: no account currently holds a scoped role (every
-- real admin is still plain 'admin' — see 20240101000013's note on why
-- t14 was blocked). my_scoped_org_ids() returns an empty array for every
-- role except the five scoped ones, so this migration changes NOTHING
-- about what any existing account can do today. It only makes scoped
-- roles actually functional, which is what unblocks t14.
--
-- quiz_settings is deliberately NOT extended to scoped admins here — it's
-- still structurally a single global row (see 20240101000012's note);
-- giving scoped admins write access to one shared global setting would be
-- meaningless/confusing until that table is redesigned (Phase 5/6).

create or replace function my_scoped_org_ids()
returns uuid[]
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_role text;
  v_org_id uuid;
begin
  select role, org_id into v_role, v_org_id
  from users_profile
  where id = auth.uid();

  if v_role is null
     or v_role not in ('super_admin', 'province_admin', 'zone_admin', 'area_admin', 'parish_admin')
     or v_org_id is null then
    return '{}'::uuid[];
  end if;

  return coalesce(
    (select array_agg(id) from org_subtree_ids(v_org_id)),
    '{}'::uuid[]
  );
end;
$$;

grant execute on function my_scoped_org_ids() to authenticated;

-- ---------------------------------------------------------------------
-- users_profile
-- ---------------------------------------------------------------------
drop policy if exists "users_profile_select_own_or_admin" on users_profile;
create policy "users_profile_select_own_or_admin" on users_profile
    for select
    to authenticated
    using (id = auth.uid() or is_admin() or org_id = any (my_scoped_org_ids()));

drop policy if exists "users_profile_update_admin_only" on users_profile;
create policy "users_profile_update_admin_or_scoped" on users_profile
    for update
    to authenticated
    using (is_admin() or org_id = any (my_scoped_org_ids()))
    with check (is_admin() or org_id = any (my_scoped_org_ids()));

drop policy if exists "users_profile_delete_admin_only" on users_profile;
create policy "users_profile_delete_admin_or_scoped" on users_profile
    for delete
    to authenticated
    using (is_admin() or org_id = any (my_scoped_org_ids()));

-- ---------------------------------------------------------------------
-- quiz_results
-- ---------------------------------------------------------------------
drop policy if exists "quiz_results_select_own_or_admin" on quiz_results;
create policy "quiz_results_select_own_or_admin" on quiz_results
    for select
    to authenticated
    using (student_id = auth.uid() or is_admin() or org_id = any (my_scoped_org_ids()));

drop policy if exists "quiz_results_update_admin_only" on quiz_results;
create policy "quiz_results_update_admin_or_scoped" on quiz_results
    for update
    to authenticated
    using (is_admin() or org_id = any (my_scoped_org_ids()))
    with check (is_admin() or org_id = any (my_scoped_org_ids()));

drop policy if exists "quiz_results_delete_admin_only" on quiz_results;
create policy "quiz_results_delete_admin_or_scoped" on quiz_results
    for delete
    to authenticated
    using (is_admin() or org_id = any (my_scoped_org_ids()));

-- ---------------------------------------------------------------------
-- organizations — scoped admins can manage their own branch of the tree
-- (add/rename/remove zones, areas, parishes under their own org), not
-- just read it.
-- ---------------------------------------------------------------------
drop policy if exists "organizations_write_admin_only" on organizations;
create policy "organizations_write_admin_or_scoped" on organizations
    for all
    to authenticated
    using (is_admin() or id = any (my_scoped_org_ids()))
    with check (
        is_admin()
        or id = any (my_scoped_org_ids())
        or parent_id = any (my_scoped_org_ids())
    );
