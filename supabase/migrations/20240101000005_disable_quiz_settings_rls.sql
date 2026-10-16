-- Ported from disable-quiz-settings-rls.sql (root).
--
-- ⚠ SECURITY GAP — believed to be the state currently live in production.
-- This turns off Row Level Security on quiz_settings entirely, meaning any
-- authenticated user (including students) can read AND write real-quiz
-- timing and the practice-mode toggle via the Supabase client directly,
-- regardless of the policies in the previous migration.
--
-- This is captured here only so the migration history matches reality, not
-- as an endorsed pattern. It is scheduled to be replaced in Phase 3 (RLS
-- Rollout) task t15 of the scale-up roadmap, with a tested policy scoped by
-- org_id + role. Do not copy this "just disable RLS" pattern onto any new
-- table — if a policy seems to be misbehaving, debug the policy.

alter table quiz_settings disable row level security;
