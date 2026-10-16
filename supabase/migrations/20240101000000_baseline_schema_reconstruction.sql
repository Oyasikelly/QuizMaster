-- =============================================================================
-- BASELINE SCHEMA RECONSTRUCTION — NOT AUTHORITATIVE
-- =============================================================================
-- This repo had no migration history before this file: schema changes were
-- applied by hand in the Supabase SQL Editor (see the fix-*.sql / add-*.sql
-- files at the project root). This migration reconstructs the shape of
-- `users_profile` and `quiz_results` as best as can be inferred from the
-- application code, so a fresh (e.g. staging) database can be bootstrapped
-- to roughly match production.
--
-- IT IS A BEST-EFFORT GUESS, NOT A VERIFIED COPY OF PRODUCTION. Columns here
-- come from what src/components/Quiz.jsx, src/app/setup-profile/page.jsx and
-- src/contexts/AuthContext.jsx actually read/write — not from a schema dump.
-- Before trusting this for anything beyond local/staging bootstrap:
--   1. Run `supabase db pull` against the real production project once you
--      have CLI access, and reconcile any differences into a follow-up
--      migration (never hand-edit this file to match afterwards — that
--      would falsify the history; add a new migration instead).
--   2. In particular, verify whether quiz_results also still carries a
--      legacy generic `score` / `total_questions` pair (referenced only in
--      the old fix-quiz-results-table.sql diagnostic script, never in the
--      current app code) — if so, decide whether to keep or drop them in a
--      later migration.
--
-- CREATE TABLE IF NOT EXISTS is deliberate: against a database that already
-- has these tables (production), this migration is a safe no-op — it will
-- NOT add or alter columns on an existing table. Its only real job is
-- bootstrapping a brand-new (staging) database.
-- =============================================================================

create table if not exists users_profile (
    id uuid primary key references auth.users(id) on delete cascade,
    email text,
    name text,
    class text,
    denomination text,
    phone text,
    position text,
    department text,
    -- Quoted to preserve the exact camelCase the app writes
    -- (src/app/setup-profile/page.jsx: profileData.accessLevel).
    "accessLevel" text,
    created_at timestamp with time zone default now()
);

create table if not exists quiz_results (
    id bigint generated always as identity primary key,
    student_id uuid not null references auth.users(id) on delete cascade,
    email text,
    name text,
    class text,
    category text,
    lesson text,
    -- Real-quiz score
    real_score integer,
    real_total integer,
    -- Practice-mode scores, one pair per difficulty (see src/components/Quiz.jsx)
    practice_normal_score integer,
    practice_normal_total integer,
    practice_medium_score integer,
    practice_medium_total integer,
    practice_hard_score integer,
    practice_hard_total integer,
    practice_entire_score integer,
    practice_entire_total integer,
    "timestamp" timestamp with time zone default now()
);

create index if not exists idx_quiz_results_student_id on quiz_results(student_id);
create index if not exists idx_quiz_results_category on quiz_results(category);
