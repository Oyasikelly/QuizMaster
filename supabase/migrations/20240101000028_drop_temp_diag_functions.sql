-- Cleanup: drops the temporary diagnostic functions added in
-- 20240101000025 and 20240101000026 while tracking down the
-- province-scoping leak. No longer needed now that the leak is
-- understood (unreliable RLS enforcement by Supabase's gateway for
-- plain table reads under production's current infrastructure) and
-- worked around via get_scoped_students()/get_scoped_quiz_results()
-- (20240101000027), which stay.
drop function if exists diag_check_bypassrls();
drop function if exists diag_check_rls_enabled();
drop function if exists diag_check_policy_eval(uuid);
