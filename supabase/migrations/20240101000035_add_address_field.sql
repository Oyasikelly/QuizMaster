-- Address: free text, optional, same self-reported pattern as phone and
-- Zone/Area/Parish (20240101000034). `phone` already existed (granted in
-- 20240101000020) but was never surfaced outside the setup-profile/
-- student-profile/admin-profile forms; this adds the one genuinely new
-- column those surfaces (plus the admin-facing student detail views and
-- the Student Management export) now also need.
alter table users_profile add column if not exists address text;

grant update (address) on users_profile to authenticated;
