-- Phase 1 (Tenancy Foundation), task t06: the org tree itself.
-- Region -> Province -> Zone -> Area -> Parish, self-referencing.
--
-- Nothing yet references this table from users_profile/quiz_results/
-- quiz_settings (that's the next migration, and it's a nullable column) —
-- creating this table changes no existing behavior.

create table if not exists organizations (
    id uuid primary key default gen_random_uuid(),
    parent_id uuid references organizations(id) on delete restrict,
    level text not null check (level in ('region', 'province', 'zone', 'area', 'parish')),
    code text not null,
    name text not null,
    created_at timestamptz not null default now(),
    constraint organizations_region_has_no_parent check (
        (level = 'region' and parent_id is null) or
        (level <> 'region' and parent_id is not null)
    )
);

create index if not exists idx_organizations_parent_id on organizations(parent_id);

-- Siblings under the same parent can't share a code (e.g. two "Province 20"
-- under the same region), enforced separately from the region level below
-- since region rows have no parent_id to key off.
create unique index if not exists idx_organizations_sibling_code
    on organizations(parent_id, code);

create unique index if not exists idx_organizations_region_code
    on organizations(code) where level = 'region';

alter table organizations enable row level security;

grant select, insert, update, delete on organizations to authenticated;

-- Readable by any signed-in user (needed for org pickers everywhere);
-- writes restricted to admins. Not yet org-scoped — any admin can manage
-- the whole tree, same as the rest of the legacy role model until Phase 2
-- introduces province/zone/area/parish-scoped admin roles.
drop policy if exists "organizations_select_authenticated" on organizations;
create policy "organizations_select_authenticated" on organizations
    for select
    to authenticated
    using (true);

drop policy if exists "organizations_write_admin_only" on organizations;
create policy "organizations_write_admin_only" on organizations
    for all
    to authenticated
    using (is_admin())
    with check (is_admin());
