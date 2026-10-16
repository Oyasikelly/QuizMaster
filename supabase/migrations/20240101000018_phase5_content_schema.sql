-- Phase 5 (Content Migration), schema only — task t23. Mirrors the
-- existing JSON structure (questions/practice/<category>/<year>/
-- <difficulty>/<lesson>.json, questions/real/<category>/...) so no
-- scoring/rendering logic in Quiz.jsx has to change, just where the data
-- eventually comes from.
--
-- Content is owned at the PROVINCE level, confirmed directly by the
-- project owner: this mirrors the existing physical process (province
-- sets the questions, zones/areas/parishes under it take them). org_id
-- here must be a province-level organizations row. The annual shared
-- Regional Quiz (region-wide content, ahead of the August Convention) is
-- NOT built here — this schema doesn't prevent org_id from one day being
-- the Region itself for that one event, but nothing implements that
-- special case yet; revisit when it's actually needed (next occurrence:
-- 2027).
--
-- org_id/category are denormalized onto all three tables (not just
-- academic_years) deliberately, so RLS policies are simple single-table
-- checks instead of cross-table joins into other RLS-protected tables.
--
-- NOT done in this migration (deliberately separate, reviewable step):
-- importing the existing JSON content, or changing getQuestions.js/
-- getLessons.js to read from these tables. These tables are empty and
-- unused by the app immediately after this migration — zero behavior
-- change, same pattern as every other phase this session.

create or replace function my_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from users_profile where id = auth.uid();
$$;

grant execute on function my_org_id() to authenticated;

-- Every ancestor of a given org, including itself, walking up to the
-- region root. The inverse of org_subtree_ids() (which walks down).
-- org_ancestor_ids(null) returns an empty set by construction — a
-- student with no org_id assigned yet correctly sees no DB-backed
-- content (they fall back to the JSON files at the application layer,
-- not an RLS special case).
create or replace function org_ancestor_ids(leaf_id uuid)
returns table (id uuid)
language sql
stable
security definer
set search_path = public
as $$
  with recursive ancestors as (
    select o.id, o.parent_id from organizations o where o.id = leaf_id
    union all
    select o.id, o.parent_id from organizations o
    join ancestors a on o.id = a.parent_id
  )
  select id from ancestors;
$$;

grant execute on function org_ancestor_ids(uuid) to authenticated;

-- RLS policies can't call a set-returning function (org_ancestor_ids)
-- directly — Postgres rejects that. This wraps it as an array, the same
-- pattern my_scoped_org_ids() already uses around org_subtree_ids().
create or replace function my_ancestor_org_ids()
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select array_agg(id) from org_ancestor_ids(my_org_id())),
    '{}'::uuid[]
  );
$$;

grant execute on function my_ancestor_org_ids() to authenticated;

create table academic_years (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references organizations(id),
    category text not null,
    year text not null,
    created_at timestamptz not null default now(),
    unique (org_id, category, year)
);

create table lessons (
    id uuid primary key default gen_random_uuid(),
    academic_year_id uuid not null references academic_years(id) on delete cascade,
    org_id uuid not null references organizations(id),
    category text not null,
    -- 'normal' | 'medium' | 'hard' | 'practice' (whole-year practice) |
    -- 'real' (the official timed quiz for this org/category/year)
    difficulty text not null,
    lesson_key text not null,
    title text not null,
    created_at timestamptz not null default now(),
    unique (academic_year_id, difficulty, lesson_key)
);

create table questions (
    id uuid primary key default gen_random_uuid(),
    lesson_id uuid not null references lessons(id) on delete cascade,
    org_id uuid not null references organizations(id),
    category text not null,
    question text not null,
    options jsonb,
    type text not null check (type in ('multiple-choice', 'fill-in-the-blank')),
    answer text not null,
    created_at timestamptz not null default now()
);

create index idx_academic_years_org on academic_years(org_id);
create index idx_lessons_org on lessons(org_id);
create index idx_lessons_academic_year on lessons(academic_year_id);
create index idx_questions_org on questions(org_id);
create index idx_questions_lesson on questions(lesson_id);

alter table academic_years enable row level security;
alter table lessons enable row level security;
alter table questions enable row level security;

grant select, insert, update, delete on academic_years to authenticated;
grant select, insert, update, delete on lessons to authenticated;
grant select, insert, update, delete on questions to authenticated;

-- Read: admins with this exact org in their scope (editors), OR any
-- signed-in user whose own org is a descendant of this content's
-- province (students reading their province's content). Write: scoped
-- admins only — and since my_scoped_org_ids() only ever contains an
-- admin's own org plus descendants, never ancestors, a zone/area/parish
-- admin naturally cannot edit their parent province's content without
-- any extra rule needed to enforce that.
create policy "academic_years_select" on academic_years
    for select to authenticated
    using (
        is_admin()
        or org_id = any (my_scoped_org_ids())
        or org_id = any (my_ancestor_org_ids())
    );

create policy "academic_years_write" on academic_years
    for all to authenticated
    using (is_admin() or org_id = any (my_scoped_org_ids()))
    with check (is_admin() or org_id = any (my_scoped_org_ids()));

create policy "lessons_select" on lessons
    for select to authenticated
    using (
        is_admin()
        or org_id = any (my_scoped_org_ids())
        or org_id = any (my_ancestor_org_ids())
    );

create policy "lessons_write" on lessons
    for all to authenticated
    using (is_admin() or org_id = any (my_scoped_org_ids()))
    with check (is_admin() or org_id = any (my_scoped_org_ids()));

create policy "questions_select" on questions
    for select to authenticated
    using (
        is_admin()
        or org_id = any (my_scoped_org_ids())
        or org_id = any (my_ancestor_org_ids())
    );

create policy "questions_write" on questions
    for all to authenticated
    using (is_admin() or org_id = any (my_scoped_org_ids()))
    with check (is_admin() or org_id = any (my_scoped_org_ids()));
