-- Ported from fix-quiz-settings-rls.sql (root). Superseded by the next
-- migration (disable_quiz_settings_rls), which appears to be the state
-- actually live today — kept here for historical fidelity. See the note
-- in 20240101000005_disable_quiz_settings_rls.sql.
--
-- NOTE: these policies grant every authenticated user — students included,
-- not just admins — full read/write on quiz_settings. That is itself too
-- broad and is scheduled to be replaced with an org + role scoped policy
-- in Phase 3 (RLS Rollout, task t15/t18), not reused as-is.

drop policy if exists "Allow authenticated users to read quiz_settings" on quiz_settings;
create policy "Allow authenticated users to read quiz_settings" on quiz_settings
    for select
    to authenticated
    using (true);

drop policy if exists "Allow authenticated users to insert quiz_settings" on quiz_settings;
create policy "Allow authenticated users to insert quiz_settings" on quiz_settings
    for insert
    to authenticated
    with check (true);

drop policy if exists "Allow authenticated users to update quiz_settings" on quiz_settings;
create policy "Allow authenticated users to update quiz_settings" on quiz_settings
    for update
    to authenticated
    using (true)
    with check (true);

drop policy if exists "Allow authenticated users to delete quiz_settings" on quiz_settings;
create policy "Allow authenticated users to delete quiz_settings" on quiz_settings
    for delete
    to authenticated
    using (true);
