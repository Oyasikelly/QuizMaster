-- Ported from setup-database-triggers.sql (root) — treated as the canonical
-- version over the older database-triggers-updated.sql, since it additionally
-- enables the `http` extension and drops triggers before recreating them
-- (idempotent / safe to re-run), which the older file does not do.
--
-- Fires the table-notifications edge function (supabase/functions/table-
-- notifications) on every insert/update/delete of quiz_results and
-- users_profile, which the project's email-notification feature depends on.
--
-- NOTE: the function URL below is hardcoded to this project's ref
-- (eubroxxcchuozvpcwbdv, taken from the original script). If this is ever
-- applied to a different Supabase project (e.g. a new staging project from
-- Phase 0 task t01), replace it with that project's own functions URL first.

create extension if not exists http with schema extensions;

create or replace function notify_table_change()
returns trigger
language plpgsql
as $$
declare
  response json;
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

  select
    http_post(
      'https://eubroxxcchuozvpcwbdv.functions.supabase.co/table-notifications',
      json_build_object(
        'table_name', table_name,
        'operation', operation,
        'data', new_data,
        'old_data', old_data
      )::text,
      'application/json'
    )
  into response;

  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists quiz_results_insert_trigger on quiz_results;
drop trigger if exists quiz_results_update_trigger on quiz_results;
drop trigger if exists quiz_results_delete_trigger on quiz_results;

create trigger quiz_results_insert_trigger
  after insert on quiz_results
  for each row
  execute function notify_table_change();

create trigger quiz_results_update_trigger
  after update on quiz_results
  for each row
  execute function notify_table_change();

create trigger quiz_results_delete_trigger
  after delete on quiz_results
  for each row
  execute function notify_table_change();

drop trigger if exists users_profile_insert_trigger on users_profile;
drop trigger if exists users_profile_update_trigger on users_profile;
drop trigger if exists users_profile_delete_trigger on users_profile;

create trigger users_profile_insert_trigger
  after insert on users_profile
  for each row
  execute function notify_table_change();

create trigger users_profile_update_trigger
  after update on users_profile
  for each row
  execute function notify_table_change();

create trigger users_profile_delete_trigger
  after delete on users_profile
  for each row
  execute function notify_table_change();
