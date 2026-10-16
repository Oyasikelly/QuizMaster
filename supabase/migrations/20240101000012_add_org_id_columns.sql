-- Phase 1, task t08. Nullable org_id everywhere — nullable is the whole
-- point: existing rows (and every insert the app makes today, which never
-- sets org_id) simply stay NULL, meaning "legacy/unassigned", and nothing
-- currently reads or filters on this column, so this changes no behavior.
-- Phase 2/3 are what actually start using it.

alter table users_profile add column if not exists org_id uuid references organizations(id);
alter table quiz_results add column if not exists org_id uuid references organizations(id);
alter table quiz_settings add column if not exists org_id uuid references organizations(id);

create index if not exists idx_users_profile_org_id on users_profile(org_id);
create index if not exists idx_quiz_results_org_id on quiz_results(org_id);

-- NOTE on quiz_settings specifically: this column alone does not make
-- quiz_settings multi-tenant. Its schema still hardcodes a single global
-- row (`id integer primary key default 1`), and every read in
-- src/lib/quiz-config.js does an unfiltered `.select("*").single()` —
-- there is exactly one real-quiz window for the entire app right now.
-- Giving each province/parish its own quiz window will need a real design
-- change here (e.g. org_id as part of the key, dropping the fixed id=1
-- pattern) — that's Phase 5/6 work, not something this column quietly
-- solves on its own.
