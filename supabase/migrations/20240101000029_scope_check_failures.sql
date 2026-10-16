-- Supports the scope-check Edge Function (supabase/functions/scope-check),
-- which periodically verifies that a real, correctly-scoped province_admin
-- session only ever gets back data within its own province — the exact
-- invariant that silently broke on production on 2026-10-16 (see
-- PROJECT_HANDOFF.md, commit 5549c42). Every run's result is recorded
-- here so there's a durable history, not just a point-in-time email.
create table scope_check_failures (
    id uuid primary key default gen_random_uuid(),
    checked_at timestamptz not null default now(),
    expected_org_ids uuid[] not null,
    leaked_org_ids uuid[] not null,
    details jsonb not null
);

-- Only the service role (the Edge Function) ever writes here. No human
-- or client-side code needs to read this directly right now — if an
-- admin UI for it is built later, add a scoped select policy then.
grant select, insert on scope_check_failures to service_role;
