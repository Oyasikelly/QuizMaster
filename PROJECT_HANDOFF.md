# QuizMaster — Scale-Up Work: Handoff Summary

Context for picking up where this session left off. Written for another AI assistant (or a developer) with no prior context on this conversation.

---

## What this project is

**QuizMaster** — a Next.js 15 + Supabase quiz app for RCCG (church), currently single-tenant (three hardcoded categories: `adults`/`yaya`/`teenagers`). It runs a "real quiz" period (timed, fixed questions, once per student) and an admin-togglable "practice mode" (student-customizable lessons/difficulty), scored client-side, results saved to Supabase.

**The ask**: scale it into a **multi-tenant platform** serving RCCG Region 70's full hierarchy — Region → Province → Zone → Area → Parish (provinces seen so far: 20, 21, 23, 25, 26) — plus real member-data collection, **without breaking the currently-working quiz flow at any point.**

**Confirmed product scope**: this is a real, organizationally-driven expansion — the Regional Sunday School Coordinator is encouraging provinces under Region 70 to adopt this platform. **Region 70 only** for this phase — no national-level admin, no other regions, even though the `organizations` schema is generically a tree and could support it later. **One shared application, one shared database.** **Admin authority cascades downward** — confirmed via AskUserQuestion: an admin at any level (province/zone/area/parish) manages everything in their own org plus every descendant below it, same shape as the legacy global `admin` role but scoped.

**Content ownership model — CONFIRMED, this supersedes an earlier wrong assumption**: a separate ChatGPT product-planning conversation (pasted into this session) initially suggested "one shared question bank" for everyone. **The project owner directly corrected this — their statement is authoritative over the ChatGPT doc.** The real model, confirmed via two follow-up questions:
- **Content is owned at the province level**, not shared globally and not owned by zones/areas/parishes individually. Every zone/area/parish under a province draws from that one province's question bank — there is no sub-province content ownership.
- This applies to **both** the official real quiz and practice mode — a province's own uploaded content is used for everything they do, normally.
- **Exception**: an annual **Regional Quiz** — a shared/common-content event across all of Region 70, held ahead of the RCCG August Convention each year. Next occurrence: **2027, before the August Convention**. During that specific event, shared/region-level content overrides each province's own bank. This is effectively a region-level content override for one scheduled event per year, not a parallel permanent content tier.

This directly changes the Phase 5 design: `lessons`/`questions` tables need to be scoped at the **province** org level by default (not globally shared, not per-zone/area/parish), with a distinct mechanism for the once-a-year region-wide shared quiz. Nothing has been built for Phase 5 yet — this was caught during planning, before any code exists.

**This mirrors the existing physical process, not a new invention**: provinces already set the questions and zones/areas/parishes already take them offline today — the app is digitizing an established process, not designing a new one from scratch. Two more pieces of product vision from the project owner, worth keeping in view for later phases even though they don't change anything being built right now:
- **Engagement is an explicit goal, not just data collection** — the lesson-based practice mode already built is confirmed as the right direction to keep extending (gamification/fun framing), not a stopgap to be replaced.
- **The coordinator wants reach down to the last person in every parish.** Read as: completeness of reach/inclusion matters as much as the data itself — Phase 4's member registration flow needs to work smoothly for the smallest, most under-resourced parish, not just be convenient for admins at the top of the hierarchy. Worth keeping in mind when designing that flow (offline-friendly? low-literacy-friendly? works on low-end devices/poor connectivity?) — not yet confirmed in detail, revisit when Phase 4 starts.

Several other product rules are still explicitly **open, parked for their respective phases, not silently decided**: required student fields (Phase 4), exactly how a province uploads/manages their content and who within the province is allowed to (Phase 5), who can create/schedule the official quiz including the annual Regional Quiz specifically (Phase 5/6), which quiz settings are regional defaults vs. overridable (Phase 5/6 — ties into the already-flagged `quiz_settings` single-global-row redesign, which now also needs to support the province-owned-content model), how results get aggregated/reported per org level (Phase 6), how existing students/results get assigned into the hierarchy without losing history (relevant once real org assignment starts), and student-record access/protection rules beyond the cascade model above (Phase 4). **Do not invent answers to these when you reach that phase — surface them for a decision first**, same as the two questions above were.

Stack: Next.js 15 (App Router, Turbopack), React 19, Supabase (`@supabase/auth-helpers-nextjs` + `@supabase/ssr`), Tailwind, deployed on Vercel. No test framework, no prior migration history (schema was hand-applied via Supabase SQL Editor using a pile of root-level `fix-*.sql`/`add-*.sql` scripts).

---

## The roadmap

A 35-task, 8-phase plan was produced (also exists as a live checklist artifact at `https://claude.ai/artifact/PtBbktazByXJS2cKWPTFqi`, but that's under a different Claude account than the one in this browser session — **not reliably reachable**, treat this document as the source of truth instead). Every phase is designed to be additive/non-breaking: nullable columns, fallback reads, legacy-role bypasses, no big-bang cutovers.

| Phase | Theme | Status |
|---|---|---|
| 0 | Safety Net (staging env, migration history, regression checklist, prod snapshot, feature flags) | Mostly done — see below |
| 1 | Tenancy Foundation (`organizations` tree, nullable `org_id` columns) | **Done** |
| 2 | Role Model Upgrade (role vocabulary, org-scoping helper) | **Done except t14 (deliberately blocked)** |
| 3 | RLS Rollout (real org-scoped security policies) | **Done** (core policies; t14 now unblocked but not yet executed) |
| 4 | Member Data Model (full member fields, bulk import) | Started — profile fields + roles done, bulk import not started |
| 5 | Content Migration (questions/lessons from JSON into DB) | Core done — schema, RLS, content import (158 lessons/2308 questions), and DB-first app rewiring all complete on staging. Regional Quiz mechanism and admin content-upload UI (Phase 6) not started. |
| 6 | Admin UI/UX (org switcher, dynamic routes, rollup dashboards) | Started — content management UI done, rest not started |
| 7 | Hardening & Ops (tests, audit logging, monitoring) | Not started |

---

## What actually happened this session (in order)

### Phase 0 — Safety Net
- Converted the ad hoc root `fix-*.sql`/`add-*.sql` scripts into a real, ordered migration history at `supabase/migrations/` (see `supabase/migrations/README.md` for exactly what was ported, what was inferred vs. known, and caveats).
- Wrote `docs/regression-checklist.md` — manual end-to-end QA script (auth → profile → quiz → submit → results → admin visibility). **Run this after every future schema/code change.**
- Scaffolded `src/lib/feature-flags.js` — unused, additive, for gating future in-progress code paths.
- Created a **staging Supabase project** (`quizmaster-staging`, ref `ciqvukvorajxhiqmwkbj`), linked via Supabase CLI, and pushed the full migration history to it. Verified via `supabase migration list` (local == remote) after every subsequent push.
- **Production snapshot (t02) — done.** Free-tier Supabase has no downloadable dashboard backups, and Docker wasn't available locally for `supabase db dump`, so installed native PostgreSQL 17 client tools (`winget install PostgreSQL.PostgreSQL.17`) and ran `pg_dump` directly. Had to go through: direct-connection IPv6 timeout (Supabase's direct host is IPv6-only; this network can't route it) → switched to the Session Pooler connection string (IPv4, host `aws-0-eu-central-1.pooler.supabase.com`, username `postgres.<project-ref>`) → one stale-password auth failure → succeeded. Files at `backups/prod_schema_2026-10-15.sql` (37.5 KB) and `backups/prod_data_2026-10-15.sql` (17.9 KB), both gitignored. Production is **Postgres 15.8**, holds **27 real `users_profile` rows and 48 real `quiz_results` rows** — this is live data, not a toy/empty project.
- ⚠️ **The production DB password was pasted into this chat twice** during the t02 troubleshooting (once directly, once via a URL that embedded it). The user was told to rotate it via the Supabase dashboard after each exposure. **Status of the most recent rotation is unconfirmed — verify the current password isn't one that was ever typed into this conversation before trusting it.**
- **Important discovery from the real snapshot**: the inferred baseline migration (`20240101000000`) didn't match production's actual schema. Specifically — **production's `users_profile` is missing `phone`, `position`, `department`, and `"accessLevel"`**, the exact columns `src/app/setup-profile/page.jsx` inserts for an admin signup. As deployed, admin signup against real production would fail today with a "column does not exist" error. (The 3 existing production admin accounts have student-shaped data — class/denomination, not phone/position — consistent with predating this code path, or being promoted to admin directly rather than through the signup form.) Also found: `quiz_results`' real PK is `quiz_id` not `id` (harmless, unreferenced by name anywhere in app code — deliberately not renamed), plus legacy `score`/`total_questions`/`difficulty_level` columns the current code no longer writes. Two unrelated, unused leftover tables also exist in production (`smoothies`, `"users-details"`) — remnants of whatever starter template this project began from, not ported, not touched. All of this is now reconciled in `20240101000015_reconcile_baseline_with_production_schema.sql` (pushed to staging; **still needs to actually be pushed to production** when that's deliberately decided — see Immediate next steps).

### Phase 1 — Tenancy Foundation (done, staging only)
- `organizations` table: self-referencing tree (`id, parent_id, level, code, name`), level constrained to `region/province/zone/area/parish`, RLS on (read: any signed-in user; write: admin only).
- Seeded **exactly**: Region 70, Provinces 20/21/23/25/26 — nothing fabricated beyond what was explicitly given.
- Added nullable `org_id` to `users_profile`, `quiz_results`, `quiz_settings`. Nothing reads/writes it yet — zero behavior change. **Caveat**: `quiz_settings` still hardcodes a single global row (`id=1`); the `org_id` column alone does *not* make it multi-tenant — that needs a real redesign later (Phase 5/6).
- Decided **not** to create a fake "Legacy" org row — `NULL` org_id is the legacy/unassigned signal directly.

### Phase 2 — Role Model (done except t14, staging only)
- Added a CHECK constraint on `users_profile.role`: `admin, student, super_admin, province_admin, zone_admin, area_admin, parish_admin, member`.
- Added `org_subtree_ids(root_id)` Postgres function (recursive CTE, returns an org + all descendants) and `src/lib/org-scope.js`'s `getScopedOrgIds(userProfile)` — both unused scaffolding for Phase 6.
- Added `getOrgId()` to `src/contexts/AuthContext.jsx` alongside the existing `getCurrentRole()`.
- **t14 (migrate a pilot admin to a scoped role) is deliberately blocked**: `is_admin()` (used by every current RLS policy) checks `role = 'admin'` exactly. Reassigning a real admin to e.g. `province_admin` today would **strip their access immediately**, since Phase 3 (teaching RLS to recognize scoped roles) hasn't shipped. Do not do this until Phase 3 lands.

### Real bugs found and fixed along the way (pre-existing, not introduced by this session's changes)
1. **Missing table grants** (`403` on `users_profile`/`quiz_results` reads) — the original ad hoc-script era never granted `anon`/`authenticated` Postgres roles privileges on these tables. Fixed in `20240101000007_grant_table_access.sql`.
2. **Trigger function type-cast bug** — `notify_table_change()` (the email-notification trigger on `users_profile`/`quiz_results`) declared `response json` but `http_post()` returns a composite `http_response`, causing `invalid input syntax for type json` on **every** insert — i.e. every quiz submission and profile save was failing at the trigger step. Fixed in `20240101000008_fix_notify_trigger_type_bug.sql`, also now wraps the HTTP call in exception handling so a notification failure can never block the actual data write. **Worth checking whether this bug is/was also live in production** — unclear why it wouldn't be, given it's the same function, but production usage suggests submissions have been working there.
3. **Admin signup silently downgraded to student** — the chosen signup role lived only in React's in-memory `AuthContext` state, never persisted. Any page reload between signup and completing `/setup-profile` (e.g. the email-confirmation round trip) lost it, defaulting to `student`. Fixed by persisting it to `localStorage` in `src/contexts/AuthContext.jsx`.
4. **Hardcoded production redirect URL** — the email confirmation link in `src/app/authenticate/page.jsx` was hardcoded to the production Vercel URL regardless of environment. Changed to `${window.location.origin}/authenticate`.

### Interim security fix (not part of the original roadmap's Phase 3, done early because it was visibly flagged in the Supabase dashboard)
- RLS was fully **disabled** on `users_profile`/`quiz_results`/`quiz_settings` as a Phase 0 stopgap (to unblock testing) — this showed up as a scary "RLS disabled / UNRESTRICTED" badge in the dashboard and the user asked to address it.
- Added **real, role-based (not yet org-scoped) RLS**: users can only read/write their own row; `role='admin'` can read/write everything; `quiz_settings` is readable by anyone (needed pre-login) but writable only by admins. See `20240101000009_interim_role_based_rls.sql`.
- This is **not** the org-scoped Phase 3 policy design — it's a legitimate interim fix for the actual current gap (any student could previously read/overwrite any other student's data). Proper org-scoped RLS (using `org_id`) is still Phase 3 work.

### Known open/flagged issues not yet acted on
- Staging's notification triggers still point at **production's real edge function URL** (hardcoded project ref in the trigger function body) — test signups/submissions on staging are currently still hitting production's real notification system. Not blocking (exception-wrapped now), just noisy/leaky between environments. Needs the URL made environment-aware eventually.
- `docs/regression-checklist.md` section 6 (admin visibility) should be re-run against the interim RLS change to confirm `StudentManagement.jsx`/`QuizAnalytics.jsx`/admin student-detail page still show *all* students to an admin — this wasn't independently verified against those specific components' exact query patterns.

---

### Phase 3 — RLS Rollout (done, staging only)
- `my_scoped_org_ids()` function: returns the calling user's own org + every descendant for any of the 5 scoped admin roles, empty array otherwise (students, legacy `admin`, or scoped-role-with-no-org-assigned).
- Extended `users_profile`/`quiz_results` SELECT/UPDATE/DELETE policies, and `organizations` write policy, to also allow access when the row's `org_id` is in that scoped set — alongside the existing own-row and legacy-`admin` bypass, not replacing them.
- `quiz_settings` deliberately **not** extended — still one global row, scoped write access would be meaningless until that table's redesigned.
- **Safe by construction**: no account holds a scoped role yet, so `my_scoped_org_ids()` returns `{}` for every real user today — this shipped with zero behavior change, same pattern as every other phase. See `20240101000016_phase3_org_scoped_rls.sql`.
- **t14 is now unblocked** — reassigning a real admin to a scoped role (with an `org_id` set) will actually work correctly now. Still a deliberate action for the project owner to take when ready, not done automatically.

### Phase 4 (partial) — Profile fields, started
- Confirmed via chat: dropped the speculative `member` role (redundant with `student`); added `date_of_birth` and `gender` to `users_profile` (optional, `gender` CHECK-constrained to `male`/`female`); `src/app/setup-profile/page.jsx` now collects phone for students too (previously admin-only), date of birth, gender, and a dynamic Province → Zone → Area → Parish picker that writes to the existing `org_id` column — replacing the old free-text "Denomination" field, which had become badly inconsistent in production (`"RCCG"`, `"RCCG DELTA 23"`, `"Redeemed Christian Church of God"`, etc. all meaning the same thing). See `20240101000017_profile_fields_and_role_cleanup.sql`.
- The picker is **optional**, not required — zones/areas/parishes aren't seeded yet (only Region 70 + 5 provinces exist), so requiring a full selection would lock out every signup today. It dynamically stops at whatever depth real data exists, so it'll naturally get more precise as the org tree is filled in.
- `denomination` column is left in place for historical data (not dropped, not backfilled) — just no longer collected by the form. `StudentManagement.jsx` still reads/displays/edits it separately and handles it being null fine (`|| "Not set"`); not touched this pass — updating that admin screen to use `org_id` instead is Phase 6 work.
- **Confirmed province-owned content model** (from the project owner directly, overriding the earlier ChatGPT-doc assumption): this mirrors the existing physical process — provinces already set the questions, zones/areas/parishes already take them offline today. Content is owned at the **province** level only (not per zone/area/parish), covers both real quiz and practice mode, with one confirmed exception: an annual **Regional Quiz** (shared content across all of Region 70) ahead of the RCCG August Convention, next occurring in 2027. This directly shapes the still-unbuilt Phase 5 design.
- Two more pieces of product vision, not yet acted on: engagement/fun is an explicit goal (the existing lesson-based practice mode is confirmed as the right direction, not a stopgap), and the coordinator wants reach down to the last person in every parish (shapes how low-friction Phase 4's registration flow needs to be).
- **Not yet done** from the original 8 open product rules: the rest of the required-fields list, the registration/import process for existing members, and record-protection rules beyond the Phase 3 cascade model.

### Real regression I introduced: student self-edit profile silently stopped working
While continuing the t14 test (setting up a second student for a populated dashboard view), found that `student/profile/page.jsx`'s **Edit Profile** showed "updated successfully" while nothing actually changed — for every field, not just the new parish picker. Root cause: Phase 3's `users_profile` UPDATE policy (`20240101000016`) was written admin/scoped-admin only, on the wrong assumption that nothing else updated this table. `student/profile/page.jsx`'s edit feature **predates this session** and already did updates — missed it when designing that policy, then built more on top of the same broken path (phone/DOB/gender/parish) without re-testing the underlying update. Postgres doesn't error when an UPDATE's RLS check matches zero rows — it just silently succeeds with nothing changed, which is indistinguishable from real success unless explicitly checked.

Fixed in two layers in `20240101000020_fix_users_profile_self_update.sql`:
1. **Row-level**: added `id = auth.uid()` back to the UPDATE policy (self-update allowed again, alongside admin/scoped-admin).
2. **Column-level GRANT**: `authenticated` can now only UPDATE a specific column list (`name, email, class, phone, date_of_birth, gender, org_id, denomination`) — **`role` deliberately excluded**. This is what actually prevents a student from self-promoting via this broadened row-level policy; RLS alone can't express a column restriction. Nothing in the app currently writes `role` via UPDATE anyway (only the one-time signup INSERT, plus manual dashboard edits for t14) — if a real "promote to admin" admin feature gets built later, it needs its own deliberately-checked path, not an extension of this grant.

Also hardened both call sites (`student/profile/page.jsx`, `StudentManagement.jsx`) to explicitly check the update actually returned a row, instead of treating "no error" as "success" — so this exact failure mode (RLS silently matching zero rows) can't hide invisibly again in the future, here or anywhere a similar pattern gets added.

### Real bug found during the first actual scoped-admin test: every role check in the app only recognized the literal string "admin"
The first time a real account was manually set to `province_admin` (the t14 test) and logged in: login sent it to `/student/home` (the login redirect only checked `role === "admin"` exactly), which then immediately bounced it to `/authenticate` (that page's own guard requires `role === "student"` exactly) — looking exactly like being logged out, even though the session stayed valid the whole time. This was never going to work for *any* scoped role, independent of the "profile fetch timed out" error also seen in that test (which looks like an unrelated transient Supabase cold-start/network blip — nothing in the RLS/function design gives a role-specific reason for a 10s hang at this tiny data scale; ask to confirm it doesn't recur now that the real bug is fixed).

Root cause: every role-gating check across the app compared a **database-sourced** role against the literal string `"admin"`, written before scoped roles existed and never updated. Fixed with a single new source of truth, `src/lib/roles.js` (`ADMIN_ROLES` set + `isAdminRole()`), now used in: `authenticate/page.jsx` (login redirect), `setup-profile/page.jsx` (already-has-profile redirect), `AuthContext.jsx` (`isAdmin()`), and the guard at the top of `admin/dashboard`, `admin/student/[id]`, `admin/settings`, and `admin/quiz-management`. Also made `student/home/page.jsx`'s guard smarter: an admin-type role landing there now redirects to `/admin/dashboard` instead of bouncing to `/authenticate`.

**Not touched, correctly**: the signup radio button's local `formData.role` state and `setSignupRoleData`'s validation — those can only ever be the literal `"admin"`/`"student"` by construction (a two-option radio input), so the literal-string comparisons there are actually correct, not a missed instance of this bug.

### Real bug found during live testing: forgot-password leaked every registered email
`src/components/ForgotPassword.jsx` did `supabase.from("users_profile").select("email")` — no filter — then checked client-side whether the typed email was in the result, to decide whether to call `resetPasswordForEmail`. Two real problems, independent of anything this session touched: (1) it downloaded **every registered user's email** to the browser, to any visitor, logged in or not — a genuine privacy leak, not just inefficient; (2) it told an unauthenticated visitor whether a given email is registered at all (account-enumeration risk). The permission-denied error the project owner hit (`anon` has no grant on `users_profile`, correctly) was surfacing a real problem, not blocking a legitimate one.

Fixed by removing the pre-check entirely — `resetPasswordForEmail` doesn't need it, only emails real accounts regardless, and the UI now shows the same message either way ("if an account exists...") so a non-existent email can't be distinguished from a real one. Also fixed the same hardcoded-production-`redirectTo` bug as `authenticate/page.jsx` had (now `${window.location.origin}/...`). No new grant was added for `anon` on `users_profile` — correctly, it shouldn't have one.

### Real bug found during live testing: admin signup role lost across interleaved signups
The earlier localStorage fix for "admin signup downgrades to student" (see Phase 0 bug list) was incomplete — it used a single global storage slot, not keyed by account. Signing up a student then an admin in the same browser (exactly what happened during testing) let the second signup's pending role silently overwrite/clear the first's. Fixed properly in `AuthContext.jsx`: the pending role is now stored as a map keyed by email (`quizmaster_signup_roles`, replacing the old singular key) and resolved against whichever account is actually logged in, not "whatever was set most recently." `setSignupRoleData`/`clearSignupRole` now both take an `email` parameter — call sites in `authenticate/page.jsx` and `setup-profile/page.jsx` updated accordingly. **Not yet verified end-to-end** — Supabase's free-tier signup rate limit was hit during testing, blocking new test signups for several hours. A stuck admin test account from before this fix needs manual role correction in the dashboard (not auto-fixed by this change — it only affects signups going forward).

### Profile editing — new, closes a real gap
Added an edit path for existing accounts, since `setup-profile` only ever runs once per account and most real users predate the parish picker entirely. Extended `src/app/student/profile/page.jsx` (pre-existing page, previously only edited name/class/denomination) with phone, date of birth, gender, and a parish picker. Extracted the Province→Zone→Area→Parish picker out of `setup-profile/page.jsx` into a shared `src/components/ParishPicker.jsx` (now used by both pages) rather than duplicating it.

Denomination (the free-text field Parish replaced) is now hidden entirely from this page's display and edit form, per the project owner — the column stays in the database for historical data, just no UI reads or writes it from here anymore.

Important UX/data-safety choice: the parish picker on the edit page always starts **fresh/unselected** — it does not pre-fill the user's current selection (reconstructing the full ancestor chain for pre-fill was judged not worth the complexity yet, since almost no profile has an org_id set regardless). The current parish is shown as a separate read-only line instead. On save, `org_id` is only included in the update **if the user actively picked something** this session — leaving the picker untouched never clears or overwrites an existing value. Same safe pattern should be followed for any future edit form touching this column.

This also gives a way to test the Phase 5 DB-content wiring **without needing a new signup** (relevant right now given the rate limit above): edit an existing test account's profile, set its parish to Province 23, take a quiz as that account.

### Admin permissions — second axis considered and explicitly closed, not just deferred
Raised directly by the project owner: "not all admins should have the same access." Two separate axes exist here — **where** an admin has authority (org-level scope, already built in Phase 3) and **what** they're allowed to do within that org (functional permissions — content vs. records vs. quiz settings vs. reports). **Confirmed decision: no functional split.** One admin per org level does everything within their scope — matches how a small volunteer team actually works, avoids a permission matrix nobody asked for. `position`/`department` on the admin profile form are, and remain, plain descriptive text — not read by any access-control logic anywhere, not planned to become one. Don't build functional admin permissions later without this being deliberately revisited.

### Phase 5 — Content schema (started, staging only)
- `academic_years` → `lessons` → `questions` tables, mirroring the exact shape of the existing JSON files (`question`/`options`/`type`/`answer`) so `Quiz.jsx` scoring/rendering won't need to change, just where the data comes from. `org_id`/`category` denormalized onto all three tables (not just the top one) to keep RLS a simple single-table check.
- Content is owned at the **province** level — enforced naturally by the existing cascade model, not a new rule: `my_scoped_org_ids()` only ever contains an admin's own org plus descendants, never ancestors, so a zone/area/parish admin structurally cannot edit their parent province's content.
- New helper functions: `my_org_id()`, `org_ancestor_ids(leaf_id)` (walks UP the tree — the inverse of the existing `org_subtree_ids()`, which walks down), and `my_ancestor_org_ids()` (the array-returning wrapper RLS policies actually use — **Postgres rejects a set-returning function called directly inside a policy expression**, caught and fixed before this ever reached staging as an applied migration; see `20240101000018`'s header comment for the exact pattern).
- **Critical for not breaking existing students**: a student with no `org_id` (the overwhelming majority right now — the parish picker is brand new and optional) sees zero rows from these new tables by RLS design (`org_ancestor_ids(null)` returns empty). That's intentional, not a gap — those students are meant to fall back to the existing JSON files at the application layer, which is the **next** step, not yet done.
- **Content imported** (task t24): `scripts/import-content.js` (one-off, not part of the app, targets staging only, needs `SUPABASE_SERVICE_ROLE_KEY` — kept in a dedicated gitignored `.env.scripts.local`, never the app's own env files, specifically so the RLS-bypassing key is never reachable by `npm run dev`) walked `lessonMap.json` as the authoritative manifest and imported everything it indexes, under **Province 23** (confirmed by the project owner as this content's real owner — "RCCG DELTA 23" in the production data was the tell). Result: **158 lessons, 2308 questions**, verified by the numbers matching the manifest exactly. Deliberately NOT imported: the unindexed "2024-2025" files, `teenagersQuestions.json`, `randomQuestions.json`, and the `REAL_*_QUIZ1.json` duplicates — none are referenced by `lessonMap.json` or read by the live app.
  - Hit one real bug along the way: `service_role` had never been explicitly granted on any table created this session (only `authenticated`/`anon` were) — fixed in `20240101000019_grant_service_role_access.sql`. Worth remembering for any future table.
- **App rewired to read DB-first** (task t25): new `src/lib/db-content.js` — every function returns `null` (not an error) when nothing's found, so every call site falls back to the exact same JSON-file server actions as before. Wired into `Quiz.jsx` (both real-quiz and practice question fetching) and `SelectTime.jsx` (academic years, lessons, question count, and the "Practice Entire Year" button). No `org_id` is passed explicitly anywhere in this — RLS alone decides what a signed-in user's queries can see, via their own org's ancestor chain.
  - **VERIFIED end-to-end**, confirmed by the project owner: edited an existing test account's profile (via the new profile-edit flow below) to set its parish to Province 23, took a quiz as that account — worked. This proves the full chain: org assignment (Phase 1/4) → RLS scoping by org ancestry (Phase 2/3) → province-owned content (Phase 5) all actually work together correctly, not just in isolation. Still worth separately confirming a student with no org (or a different province) gets the unchanged JSON-file experience, but given the fallback logic is identical code to before this phase existed, that's low risk.
- The annual Regional Quiz (shared region-wide content) still isn't built — schema doesn't block it (nothing stops `org_id` from one day being the Region itself, and the ancestor-chain RLS would automatically make it visible to everyone), but nothing implements that special case yet. Not needed before 2027.

### Phase 6 — Content admin UI (new)
Built `src/app/admin/content/page.jsx` — the first real Phase 6 piece. Lets an admin manage their province's question bank through the app instead of needing a script run for them: Category → Academic Year → Lesson (by difficulty) → Questions, with both one-by-one entry and a paste-JSON bulk-add option (reuses the exact `{question, type, options, answer}` shape the rest of the app already expects, so no format translation needed).

Access model: a **legacy `admin`** isn't tied to one org (bypasses scoping entirely), so the page shows a province picker. A **scoped admin** (`province_admin` etc.) is locked to their own `org_id` with no picker — and if that org isn't actually a province (e.g. a zone/area/parish admin, once those exist), the page explicitly refuses rather than silently writing to the wrong level, since content is owned at province level specifically (confirmed product decision, see above). Every write still goes through the exact same RLS policies from Phase 5 (`academic_years_write`/`lessons_write`/`questions_write`) — this page doesn't add any new permission logic, it's a UI on top of access control that already existed and was already verified.

Wired a "Content Management" link into both existing admin sidebars (`admin/dashboard`, `admin/settings` — there's no shared admin layout component, each page duplicates its own sidebar already, so this follows that existing pattern rather than introducing a refactor).

**Two real bugs caught by the project owner before either ever got used, same root cause both times**: content UI exposing a "single fixed pool" as if it were "one option in a list," letting an admin create more than one, where only the first would ever actually be used.
1. **Real Quiz**: was just another `difficulty` option nested under whatever normal academic year was selected — but `getDbRealQuizQuestions()` looks for a completely separate, fixed bucket (`year = "real"`, `lesson_key = "real-quiz"`) independent of any normal year, which the academic-years picker was also actively hiding from view (`.neq("year", "real")`).
2. **Practice Entire Year**: tied correctly to the selected academic year (unlike Real Quiz), but `SelectTime.jsx`'s `handlePracticeEntireYear` only ever uses `availableLessons[0]` for that year — i.e. it's also really a single pool, not a list, and the old UI let an admin create several with no warning that only one would ever be reachable.

Both fixed the same way: their own mode (a toggle, not a dropdown option) that auto-resolves — creating on first use — the one fixed pool, instead of exposing a "add lesson" flow that implied multiples were meaningful. Real Quiz bypasses the year/lesson pickers entirely (no year dimension at all); Practice Entire Year keeps the Academic Years picker (year still matters) but skips straight to Questions once a year's picked. Same underlying Questions panel UI for all three modes, just fed differently. Caught during manual review, before either was ever used to add real content.

**Not yet tested against staging** — built but not clicked through yet. Worth running through: add a year/lesson/question as both a legacy admin and (separately) as the `province_admin` test account, confirm an admin scoped to a different province can't see or touch Province 23's content, try the bulk-JSON path with a small sample.

**Deliberately out of scope for this pass**: an org switcher elsewhere in the admin UI, dynamic category routes (still hardcoded `/quiz/adults`, `/quiz/yaya`, `/quiz/teenagers`), and rollup dashboards per org level. Bulk member CSV import (Phase 4) was explicitly deferred — its design (full accounts vs. profile-only records, the free-tier email-rate-limit constraint) is still an open decision, not forgotten, just not this pass.

### Phase 6 — Role/org display + admin activity tracking (new)
Two things requested directly by the project owner, both built on existing architecture rather than new concepts:

1. **Dashboard no longer shows generic "Admin"** — the sidebar now shows the actual role (via the new `roleLabel()` helper in `src/lib/roles.js`) and the admin's org name underneath it, fetched the same way `admin/content` already did. Small, but was flagged as part of "this shouldn't look generic."
2. **Admin activity log**, so a `super_admin` can see what other admins are doing. Built with zero new scoping concepts: a `super_admin` assigned `org_id` = Region 70's own id sees *everything*, through the exact same `my_scoped_org_ids()`/cascade mechanism a `province_admin` already uses for their own province — the region is an ancestor of every org, so nothing special was needed. New `admin_activity_log` table, populated by a generic trigger (`20240101000021`) on `organizations`, `users_profile`, `academic_years`, `lessons`, `questions`, `quiz_settings` — deliberately **not** `quiz_results` (a student submitting a quiz isn't "admin activity," and that table is the most fragile, most-tested path in the app; no reason to add another trigger there). The trigger filters to admin-role actors only, so routine student self-edits don't clutter the log. Applied the lesson from the earlier email-notification bug (`20240101000008`) immediately this time: the log insert is wrapped in its own exception handler so a logging failure can never block the real write. New page `src/app/admin/activity/page.jsx`, linked into both admin sidebars.

**Question-format hardening** (requested by the project owner after reviewing the add-question UI): bulk-import validation now checks `type` is exactly `"multiple-choice"` or `"fill-in-the-blank"` client-side before sending anything — previously a typo'd type would pass client validation, hit the database's CHECK constraint, and reject the **entire batch**, not just the bad entry. Also now validates that a multiple-choice `answer` exactly matches one of its `options` (both the bulk path and the single-question form) — a mismatch wasn't a database error, just a silently broken question no student could ever answer correctly. Added inline guidance for the one non-obvious format rule: multiple acceptable answers for fill-in-the-blank go in a single comma/slash/"or"-separated string, not an array. Per the project owner's follow-up: the example JSON moved out of the textarea's `placeholder` (which vanishes the instant you click in, exactly when you'd want to check it) into a permanent, always-visible "Format reference" block with a copy button, generated from one `BULK_EXAMPLE` constant so it can never drift out of sync with the actual validation rules in `handleBulkAdd`.

**Not yet tested** — same as the content management page, built but not clicked through from here. Worth confirming: a `province_admin`'s own actions in Content Management actually show up in their activity log; a *different* province's activity doesn't leak in; and (once/if a real `super_admin` account gets `org_id` set to Region 70) that account sees activity across all provinces.

### `content_overview` — read-only browsing view (new)
The project owner found the raw `questions` table confusing to browse directly in the Supabase dashboard — it only carries `org_id`/`category`, not difficulty/year/lesson (those live on `lessons`/`academic_years` by design, not duplicated onto every question row). Added `content_overview`, a `security_invoker` view joining questions → lessons → academic_years → organizations into one flat, readable table (province, category, year, difficulty, lesson, question, answer) for browsing in the dashboard's Table Editor under "Views." Purely additive, read-only, changes no existing behavior — and since it's `security_invoker`, it stays correctly RLS-scoped if ever queried through the app by a scoped admin, not just browsed via the dashboard (which bypasses RLS entirely regardless).

## Environment reference

- **Staging Supabase**: project `quizmaster-staging`, ref `ciqvukvorajxhiqmwkbj`. Linked via Supabase CLI (`supabase link`). All migrations pushed and verified in sync here.
- **Production Supabase**: project `next-supabase` (org "Oyas Kelly", free plan), ref `eubroxxcchuozvpcwbdv`. **Untouched** by any migration this session — only read from (for the in-progress snapshot).
- **Local env files**: `.env.local` = production credentials (pre-existing, untouched). `.env.development.local` = staging credentials (new this session; Next.js loads this over `.env.local` automatically whenever `npm run dev` runs, so local dev now targets staging by default). Both gitignored.
- **Vercel production deployment**: reads its own env vars from the Vercel dashboard, completely separate from any local file — confirmed untouched by this session's work.
- `/backups/` — new, gitignored directory for the pending production snapshot files.

## File manifest (new/changed this session)

```
supabase/
  config.toml, .gitignore          (new — supabase CLI scaffold)
  migrations/
    README.md                       (new — explains the reconstruction)
    20240101000000 .. 000016_*.sql  (new — 17 migration files, see above)
src/
  lib/
    feature-flags.js                (new, unused scaffold)
    org-scope.js                    (new, unused scaffold)
  contexts/AuthContext.jsx          (modified — signupRole localStorage fix, getOrgId())
  app/authenticate/page.jsx         (modified — dynamic emailRedirectTo)
docs/
  regression-checklist.md           (new)
.gitignore                          (modified — added /backups/)
.env.development.local              (new, gitignored — staging credentials)
backups/prod_schema_2026-10-15.sql  (new, gitignored — real production schema dump)
backups/prod_data_2026-10-15.sql    (new, gitignored — real production data dump)
PROJECT_COST_ESTIMATE.md            (new — non-technical budget doc for a supporter)
PROJECT_HANDOFF.md                  (this file)
```

Nothing has been committed to git yet — everything above is working-tree changes.

---

## Immediate next steps, in order

1. **Rotate the production DB password one more time** and confirm it — it's been exposed in this chat twice; don't trust any password that was ever typed into the conversation.
2. Re-run `docs/regression-checklist.md` on staging (especially section 6) to confirm the interim RLS change didn't break admin visibility.
3. Decide when to actually push the full migration history to **production** (currently applied to staging only). When that happens: the schema-reconciliation migration (`20240101000015`) will for the first time make admin signup actually work against production's real schema — worth testing that specifically right after.
4. t14 is unblocked but not done — if/when the project owner wants a real pilot scoped admin, assign them an `org_id` and a role like `province_admin` and confirm their access matches expectations.
5. Next phase decision: Phase 4 (member data model) or Phase 5 (shared content migration, respecting the "one question bank" correction) — both have explicitly open product rules (see above) to surface before building, not invent.
