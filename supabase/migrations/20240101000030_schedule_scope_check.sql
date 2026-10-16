-- Schedules the scope-check Edge Function to run every 6 hours via
-- pg_cron + pg_net, Supabase's documented pattern for calling an Edge
-- Function on a schedule. The service role key it needs to authenticate
-- the call is referenced here only by NAME from Supabase Vault
-- (vault.decrypted_secrets) — the actual secret value is set once,
-- separately, outside version control (never put a real key in a
-- migration file; see the note this prints if the secret is missing).
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'scope-check-periodic',
  '0 */6 * * *', -- every 6 hours
  $$
  select net.http_post(
    url := 'https://eubroxxcchuozvpcwbdv.supabase.co/functions/v1/scope-check',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'cron_service_role_key'
      ),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
