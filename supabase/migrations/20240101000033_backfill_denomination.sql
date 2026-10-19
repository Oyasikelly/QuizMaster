-- Denomination becomes a mandatory dropdown at signup and in every
-- profile edit form (app-side change, see src/lib/denominations.js),
-- with "Redeemed Christian Church of God" as the only option today.
-- Before this, denomination was never collected at signup at all —
-- only an admin could type it in free text after the fact, which is
-- why existing values are wildly inconsistent ("RCCG", "Rccg", "RCCG
-- DELTA 23", full parish names, or blank for most students).
--
-- Decided with the user: normalize every existing student AND admin
-- to the one real denomination that exists today, rather than leaving
-- old free text in place or only backfilling blanks — the dropdown
-- only offers one value, so every account has to land on it anyway.
update users_profile
set denomination = 'Redeemed Christian Church of God'
where role in ('student', 'admin', 'super_admin', 'province_admin', 'zone_admin', 'area_admin', 'parish_admin');
