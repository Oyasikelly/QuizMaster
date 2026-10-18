-- Two small additions to support an admin-facing "My Profile" page and a
-- super_admin "View" modal on Admin Management:
--
-- 1. `position` and `department` were never added to the self-update
--    column grant from 20240101000020 — that migration's column list is
--    "the exact union of what the app ever writes via UPDATE today", and
--    at the time nothing let an admin self-edit their own position/
--    department (only set once, at signup, via INSERT). A My Profile
--    edit page needs to UPDATE them, so without this grant the save
--    would silently affect zero rows, same regression class as before.
--    Column-level GRANTs are additive in Postgres, so this only adds to
--    the existing grant — it doesn't need to repeat name/phone/etc.
grant update (position, department) on users_profile to authenticated;

-- 2. A new RPC for reading one admin's activity history, following the
-- same SECURITY DEFINER pattern as get_scoped_students()/
-- get_scoped_quiz_results() (20240101000027) rather than leaning on
-- admin_activity_log's own RLS policy directly. That policy's
-- super_admin path depends on `org_id = any(my_scoped_org_ids())`
-- evaluated through PostgREST — the exact request shape that was
-- confirmed unreliable on production's gateway for the original
-- cross-province leak. src/app/admin/activity/page.jsx still reads the
-- table directly and hasn't shown a problem, but this is a NEW bulk
-- admin read (the Admin Management "View" modal), so it gets the
-- hardened path rather than repeating the same exposure.
create or replace function get_scoped_admin_activity(p_actor_id uuid default null, p_limit int default 50)
returns setof admin_activity_log
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role text;
begin
  select role into v_caller_role from users_profile where id = auth.uid();
  if v_caller_role is null or v_caller_role not in ('admin', 'super_admin', 'province_admin', 'zone_admin', 'area_admin', 'parish_admin') then
    raise exception 'Not authorized.';
  end if;

  return query
    select *
    from admin_activity_log a
    where (is_admin() or a.org_id = any (my_scoped_org_ids()))
      and (p_actor_id is null or a.actor_id = p_actor_id)
    order by a.created_at desc
    limit p_limit;
end;
$$;

grant execute on function get_scoped_admin_activity(uuid, int) to authenticated;
