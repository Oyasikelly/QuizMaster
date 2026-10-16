-- Every table created this session explicitly granted `authenticated`
-- (and `anon` where needed), but never `service_role` — relying on an
-- assumption that Supabase grants it by default, which this project's
-- "permission denied for table organizations" error (hit while running
-- scripts/import-content.js with what should be the service role key)
-- suggests may not actually hold here. service_role is meant to bypass
-- RLS for legitimate server-side/admin tooling (like that import
-- script) — it still needs the table-level grant layer, which is
-- separate from and evaluated before RLS.

grant select, insert, update, delete on users_profile to service_role;
grant select, insert, update, delete on quiz_results to service_role;
grant select, insert, update, delete on quiz_settings to service_role;
grant select, insert, update, delete on organizations to service_role;
grant select, insert, update, delete on academic_years to service_role;
grant select, insert, update, delete on lessons to service_role;
grant select, insert, update, delete on questions to service_role;
