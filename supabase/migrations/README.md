# Migration history

Before this folder existed, schema changes were applied by hand in the
Supabase SQL Editor using the `fix-*.sql` / `add-*.sql` / `create-*.sql`
files at the project root. Those files still exist there, untouched — this
folder reconstructs them as an ordered, reversible migration history
(Phase 0, task t03 of the scale-up roadmap) without changing anything that's
actually running today.

## What's here

| File | Ported from | What it does |
|---|---|---|
| `20240101000000_baseline_schema_reconstruction.sql` | *(no source file — inferred from app code)* | Best-effort `users_profile` / `quiz_results` shape, for bootstrapping a **new** database only |
| `20240101000001_add_role_column.sql` | `add-role-column.sql` | Adds `role` to `users_profile` |
| `20240101000002_create_quiz_settings_table.sql` | `create-quiz-settings-table.sql` | Creates `quiz_settings` |
| `20240101000003_add_practice_mode_field.sql` | `add-practice-mode-field.sql` | Adds `practice_mode` to `quiz_settings` |
| `20240101000004_quiz_settings_rls_policies.sql` | `fix-quiz-settings-rls.sql` | RLS policies on `quiz_settings` (superseded by the next file) |
| `20240101000005_disable_quiz_settings_rls.sql` | `disable-quiz-settings-rls.sql` | **Disables RLS on `quiz_settings` — believed to be the live state today.** Flagged for replacement in Phase 3. |
| `20240101000006_table_change_notification_triggers.sql` | `setup-database-triggers.sql` | Email-notification triggers on `quiz_results` / `users_profile` |

The filename timestamps are **placeholders**, not real historical dates —
there was no way to recover exact apply times. Order matters more than the
dates themselves: it follows the dependency chain (role column before
nothing depends on it; quiz_settings table before its own columns/policies;
etc).

Scripts that are purely diagnostic (`check-table-structure.sql`,
`debug-quiz-results.sql`, `debug-quiz-settings.js`, `test-manual-trigger.sql`,
`fix-quiz-results-table.sql`) were **not** ported — they never changed
schema, only queried or suggested changes. They're still at the project root
if you want to reference them.

## Before you trust this as "the schema"

1. This was reconstructed from what the application code reads/writes, not
   from a real dump of production. Once you have Supabase CLI access to the
   production project, run:
   ```
   supabase link --project-ref <your-project-ref>
   supabase db pull
   ```
   and reconcile any differences as a **new** migration — never hand-edit
   the files above to match, or the history stops being honest.
2. `CREATE TABLE IF NOT EXISTS` in the baseline file is deliberate: against
   a database that already has `users_profile`/`quiz_results` (i.e.
   production), it's a no-op. It only actually creates anything on a fresh
   database (e.g. a new staging project — Phase 0 task t01).
3. The project ref hardcoded into the trigger function
   (`eubroxxcchuozvpcwbdv`) came from the original script. Confirm it's
   still correct in Settings → API before applying migration `000006` to
   any project other than the current production one.

## Applying these (needs your Supabase credentials — I can't do this part)

```
npx supabase init          # if supabase/config.toml doesn't exist yet
npx supabase link --project-ref <your-staging-project-ref>
npx supabase db push       # applies every migration in this folder in order
```

Run this against a **new staging project first** (Phase 0 task t01), not
production — the whole point of this folder is to make that staging
environment reproducible.

## Going forward

Every future schema change — starting with Phase 1 (org tables, nullable
`org_id` columns) — should be a new file in this folder, not another ad hoc
script run by hand in the SQL Editor. That's what makes the rest of the
roadmap reversible.
