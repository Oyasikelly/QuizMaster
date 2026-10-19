-- Replaces the structured Zone/Area/Parish org-tree approach with plain
-- self-reported text fields. The admin-managed hierarchy (Organization
-- Structure page, zone/area/parish rows under organizations) turned out
-- to be more complexity than the real need called for -- decided with
-- the user after trying it live: "if users simply put their zone, area,
-- parish themselves, it will save us a lot of codes... we won't be
-- needing the Organisation Structure again."
--
-- Province stays as the existing org_id-based field (a small, stable,
-- pre-seeded list genuinely worth keeping structured). Zone/Area/Parish
-- become free text a student fills in themselves, same pattern as
-- `class` and (before it became a dropdown) `denomination`.
alter table users_profile add column if not exists zone text;
alter table users_profile add column if not exists area text;
alter table users_profile add column if not exists parish text;

-- Self-update grant (20240101000020, extended by 20240101000032 for
-- position/department) needs these three too, or a save silently
-- writes zero rows the same way those two did before being added.
grant update (zone, area, parish) on users_profile to authenticated;
