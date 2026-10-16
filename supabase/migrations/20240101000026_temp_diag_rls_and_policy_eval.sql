-- TEMPORARY diagnostic — to be dropped once the province-scoping leak is
-- resolved.

-- Confirms RLS is actually enabled (and whether FORCE ROW LEVEL SECURITY
-- is set) on the tables involved, independent of policy text or role
-- attributes already checked separately.
create or replace function diag_check_rls_enabled()
returns table (relname text, relrowsecurity boolean, relforcerowsecurity boolean)
language sql
security definer
set search_path = public
as $$
  select relname, relrowsecurity, relforcerowsecurity
  from pg_class
  where relname in ('users_profile', 'quiz_results', 'organizations')
    and relnamespace = 'public'::regnamespace;
$$;

grant execute on function diag_check_rls_enabled() to authenticated;

-- Runs the policy's own boolean expression directly, as the CALLER
-- (security invoker, not definer, so auth.uid() resolves to whoever
-- actually calls this from the browser) — isolates whether the pieces
-- the policy relies on evaluate correctly for a specific target org_id,
-- from the caller's own real session.
create or replace function diag_check_policy_eval(p_target_org_id uuid)
returns table (caller_id uuid, id_match boolean, admin_match boolean, scoped_array uuid[], scoped_match boolean)
language sql
security invoker
set search_path = public
as $$
  select
    auth.uid(),
    (select id from users_profile where id = auth.uid()) is not null,
    is_admin(),
    my_scoped_org_ids(),
    p_target_org_id = any (my_scoped_org_ids());
$$;

grant execute on function diag_check_policy_eval(uuid) to authenticated;
