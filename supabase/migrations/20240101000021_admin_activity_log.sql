-- Admin activity tracking, per the project owner's request: a super_admin
-- should be able to see what other admins (province/zone/area/parish) are
-- doing. Built entirely on the existing cascade/scoping architecture — no
-- new concept needed. A super_admin assigned org_id = Region 70's own id
-- sees everything through the SAME my_scoped_org_ids() mechanism that
-- already lets a province_admin see their whole province: the region is
-- an ancestor of every province/zone/area/parish, so org_subtree_ids()
-- from the region returns literally everything. (Find Region 70's id with
-- `select id from organizations where level = 'region';` when assigning
-- one.)
--
-- Logs writes to the tables an admin actually manages: organizations,
-- users_profile, academic_years, lessons, questions, quiz_settings.
-- Deliberately NOT quiz_results — a student submitting a quiz isn't
-- "admin activity," and that table is the most fragile, most-tested path
-- in the whole app; adding another trigger to it is a risk with no
-- corresponding benefit here.
--
-- A plain student's own writes (e.g. self-editing their profile) are
-- filtered out at the top of the trigger function — only rows written by
-- an admin-role account get logged at all, so this doesn't become a
-- firehose of routine student activity.
--
-- Learned from the earlier email-notification trigger bug (0008): the
-- insert into the log is wrapped in its own exception handler, so a
-- logging failure can NEVER block the real write it's trying to record.

create table admin_activity_log (
    id bigint generated always as identity primary key,
    actor_id uuid references auth.users(id),
    actor_role text,
    org_id uuid references organizations(id),
    action text not null,
    table_name text not null,
    record_id text,
    summary text,
    created_at timestamptz not null default now()
);

create index idx_admin_activity_log_org on admin_activity_log(org_id);
create index idx_admin_activity_log_created on admin_activity_log(created_at desc);

alter table admin_activity_log enable row level security;

-- No INSERT/UPDATE/DELETE grant to `authenticated` at all — the only way
-- a row gets written is through the SECURITY DEFINER trigger function
-- below, which bypasses RLS/grants as its owner. Nobody can forge a log
-- entry by writing to this table directly.
grant select on admin_activity_log to authenticated;

create policy "admin_activity_log_select" on admin_activity_log
    for select
    to authenticated
    using (is_admin() or org_id = any (my_scoped_org_ids()));

create or replace function log_admin_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role text;
  v_org_id uuid;
  v_record_id text;
  v_row jsonb;
begin
  select role into v_actor_role from users_profile where id = v_actor_id;

  if v_actor_role is null or v_actor_role not in (
    'admin', 'super_admin', 'province_admin', 'zone_admin', 'area_admin', 'parish_admin'
  ) then
    return coalesce(NEW, OLD);
  end if;

  begin
    v_row := to_jsonb(coalesce(NEW, OLD));

    if TG_TABLE_NAME = 'organizations' then
      v_org_id := (v_row ->> 'id')::uuid;
    else
      v_org_id := nullif(v_row ->> 'org_id', '')::uuid;
    end if;

    v_record_id := v_row ->> 'id';

    insert into admin_activity_log (actor_id, actor_role, org_id, action, table_name, record_id, summary)
    values (
      v_actor_id,
      v_actor_role,
      v_org_id,
      TG_OP,
      TG_TABLE_NAME,
      v_record_id,
      format(
        '%s %s: %s',
        TG_OP,
        TG_TABLE_NAME,
        coalesce(v_row ->> 'title', v_row ->> 'name', left(v_row ->> 'question', 60), v_row ->> 'year', v_record_id)
      )
    );
  exception when others then
    raise warning 'log_admin_activity: logging failed, continuing anyway: %', SQLERRM;
  end;

  return coalesce(NEW, OLD);
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['organizations', 'users_profile', 'academic_years', 'lessons', 'questions', 'quiz_settings']
  loop
    execute format('drop trigger if exists log_activity_insert on %I', t);
    execute format('drop trigger if exists log_activity_update on %I', t);
    execute format('drop trigger if exists log_activity_delete on %I', t);
    execute format(
      'create trigger log_activity_insert after insert on %I for each row execute function log_admin_activity()', t
    );
    execute format(
      'create trigger log_activity_update after update on %I for each row execute function log_admin_activity()', t
    );
    execute format(
      'create trigger log_activity_delete after delete on %I for each row execute function log_admin_activity()', t
    );
  end loop;
end $$;
