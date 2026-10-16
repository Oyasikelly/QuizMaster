-- Fixes a pre-existing bug in notify_table_change() (ported from
-- setup-database-triggers.sql): http_post() returns a composite
-- `http_response` row, not `json`, so `select http_post(...) into response`
-- (response declared `json`) fails to cast and raises "invalid input
-- syntax for type json" — which, inside an AFTER trigger, aborts the
-- triggering INSERT/UPDATE/DELETE entirely. Every write to users_profile
-- or quiz_results has been failing at this step.
--
-- Also wraps the notification call in exception handling: a side-effect
-- (telling an edge function a row changed) must never be able to block
-- the actual data write — the one thing in this whole project that can't
-- regress (see docs/regression-checklist.md). If the HTTP call fails for
-- any reason (bad URL, network, the extension being unavailable), this
-- now logs a warning and lets the write through, instead of losing data.

create or replace function notify_table_change()
returns trigger
language plpgsql
as $$
declare
  operation text;
  table_name text;
  new_data json;
  old_data json;
begin
  if (TG_OP = 'INSERT') then
    operation := 'INSERT';
  elsif (TG_OP = 'UPDATE') then
    operation := 'UPDATE';
  elsif (TG_OP = 'DELETE') then
    operation := 'DELETE';
  end if;

  table_name := TG_TABLE_NAME;

  if (TG_OP = 'INSERT' or TG_OP = 'UPDATE') then
    new_data := to_json(NEW);
  end if;

  if (TG_OP = 'UPDATE' or TG_OP = 'DELETE') then
    old_data := to_json(OLD);
  end if;

  begin
    perform http_post(
      'https://eubroxxcchuozvpcwbdv.functions.supabase.co/table-notifications',
      json_build_object(
        'table_name', table_name,
        'operation', operation,
        'data', new_data,
        'old_data', old_data
      )::text,
      'application/json'
    );
  exception when others then
    raise warning 'notify_table_change: notification failed, continuing anyway: %', SQLERRM;
  end;

  return coalesce(NEW, OLD);
end;
$$;
