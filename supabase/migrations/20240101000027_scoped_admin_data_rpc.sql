-- Works around a confirmed production-infrastructure issue: a correctly
-- scoped province_admin, verified via a real authenticated session, gets
-- the right answer from is_admin()/my_scoped_org_ids() and from the
-- policy's own boolean expression run directly — but a plain
-- `select * from users_profile where role = 'student'` through
-- PostgREST/the Supabase gateway (sb-gateway-version: 2 in the response
-- headers) still returns every row, unscoped. Ruled out before landing
-- here: policy text, function logic, BYPASSRLS, RLS-enabled flags, the
-- deployed anon key, browser cache, and CDN cache (cf-cache-status:
-- DYNAMIC, and a fresh anon-only request to the identical URL correctly
-- returns zero rows). The same setup works correctly on staging, so this
-- is specific to production's infrastructure, not our SQL.
--
-- Fix: stop depending on RLS enforcement for this one request shape.
-- This function does the exact same scoping check explicitly in its own
-- body (the identical boolean logic already proven correct via
-- diag_check_policy_eval), and is SECURITY DEFINER so it runs the check
-- itself rather than leaning on the gateway to apply it.
create or replace function get_scoped_students()
returns setof users_profile
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
    from users_profile u
    where u.role = 'student'
      and (is_admin() or u.org_id = any (my_scoped_org_ids()));
end;
$$;

grant execute on function get_scoped_students() to authenticated;

-- Same pattern for quiz_results, used by the same dashboard query.
create or replace function get_scoped_quiz_results()
returns setof quiz_results
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
    from quiz_results q
    where is_admin() or q.org_id = any (my_scoped_org_ids());
end;
$$;

grant execute on function get_scoped_quiz_results() to authenticated;
