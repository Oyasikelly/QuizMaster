-- Reconciles the inferred baseline (20240101000000) against production's
-- ACTUAL schema, now that a real pg_dump exists (backups/prod_schema_
-- 2026-10-15.sql, task t02). Per that migration's own README instructions:
-- differences get a new migration, 0000 itself is never hand-edited.
--
-- ── What was WRONG in the inferred baseline ──────────────────────────────
--
-- users_profile: production has NO `phone`, `position`, `department`, or
-- `"accessLevel"` columns. Those are exactly the fields
-- src/app/setup-profile/page.jsx inserts for an admin signup — meaning,
-- as deployed, admin signup via the app's current code would fail against
-- real production today with a "column does not exist" error. The three
-- admin accounts that do exist in production (confirmed in the data dump)
-- all have student-shaped data (class/denomination, not phone/position),
-- consistent with having been created before those fields existed in the
-- code, or promoted to admin directly rather than through this form.
-- Staging never had this problem only because the inferred baseline
-- happened to invent those columns — this migration is what makes that
-- actually true for production once it's eventually pushed there.
--
-- users_profile also has a `user_id uuid default auth.uid()` column,
-- redundant with `id` (same value in every real row) and unused anywhere
-- in the app — added here only for schema parity, not because anything
-- needs it.
--
-- quiz_results: production's primary key is `quiz_id`, not `id` as
-- guessed — harmless, nothing in the app ever references the PK column by
-- name, so this is NOT reconciled (renaming a live PK for zero functional
-- benefit is pure added risk). Production also has legacy `score`,
-- `total_questions`, and `difficulty_level` columns the current code no
-- longer writes (real rows show them NULL from mid-2026 onward, non-null
-- before) — added here for parity/so nothing is surprised by their
-- presence later.
--
-- quiz_settings: production uses `bigint` for id/time/questions (not
-- `integer`) and `timestamp WITHOUT time zone` for start_time/end_time
-- (not WITH). Not reconciled — both are fully compatible with how the app
-- already handles these values, and changing column types on a live
-- table is more risk than the difference is worth.
--
-- Also present in production, unused by the app, NOT ported here at all
-- (dead weight from whatever starter template this project began from):
-- `smoothies` and `"users-details"` tables.

alter table users_profile add column if not exists phone text;
alter table users_profile add column if not exists position text;
alter table users_profile add column if not exists department text;
alter table users_profile add column if not exists "accessLevel" text;
alter table users_profile add column if not exists user_id uuid default auth.uid();

alter table quiz_results add column if not exists score bigint;
alter table quiz_results add column if not exists total_questions bigint;
alter table quiz_results add column if not exists difficulty_level text;
