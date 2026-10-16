-- TEMPORARY diagnostic — to be dropped once the province-scoping leak is
-- resolved. Checks whether the `authenticated` Postgres role has been
-- granted BYPASSRLS, which would explain every RLS policy being skipped
-- regardless of how correct the policy logic is.
create or replace function diag_check_bypassrls()
returns table (rolname text, rolbypassrls boolean, rolsuper boolean)
language sql
security definer
set search_path = public
as $$
  select rolname, rolbypassrls, rolsuper
  from pg_roles
  where rolname in ('authenticated', 'anon', 'service_role', 'postgres');
$$;

grant execute on function diag_check_bypassrls() to authenticated;
