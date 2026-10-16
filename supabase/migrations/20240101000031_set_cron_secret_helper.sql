-- One-time helper to get the service role key into Vault for the
-- scope-check cron job (20240101000030) without ever writing the key's
-- actual value into a migration file or any other committed location.
-- Restricted to service_role only. Safe to leave in place permanently —
-- it only writes to vault.secrets under a fixed, known name, and only
-- the service role can call it.
create or replace function set_cron_service_role_key(p_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from vault.secrets where name = 'cron_service_role_key') then
    perform vault.update_secret(
      (select id from vault.secrets where name = 'cron_service_role_key'),
      p_key
    );
  else
    perform vault.create_secret(p_key, 'cron_service_role_key', 'Used by the scope-check pg_cron job to call its Edge Function.');
  end if;
end;
$$;

revoke execute on function set_cron_service_role_key(text) from public, authenticated, anon;
grant execute on function set_cron_service_role_key(text) to service_role;
