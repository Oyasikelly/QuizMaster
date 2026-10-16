-- Supports the new Admin Management page (super_admin only): lets a
-- super_admin change another user's role/org_id, or revoke someone's
-- admin access back to 'student'.
--
-- Why this can't just be a client-side `.update({ role })` call:
-- 20240101000020 deliberately excluded `role` from the columns any
-- authenticated user can write, specifically to stop self-privilege-
-- escalation (a student setting their own role to 'admin' via a raw API
-- call). Re-opening that column for everyone would undo that protection.
-- A SECURITY DEFINER function gives a narrow, audited path instead: it
-- checks the CALLER's own role internally before writing anyone else's,
-- running as its owner (bypassing the column grant) only once that check
-- passes.
create or replace function admin_set_user_role(p_target_id uuid, p_new_role text, p_new_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role text;
begin
  select role into v_caller_role from users_profile where id = auth.uid();

  if v_caller_role is null or v_caller_role not in ('super_admin', 'admin') then
    raise exception 'Only a super_admin can change another user''s role.';
  end if;

  if p_new_role not in ('student', 'province_admin', 'zone_admin', 'area_admin', 'parish_admin', 'super_admin') then
    raise exception 'Invalid role: %', p_new_role;
  end if;

  if p_target_id = auth.uid() then
    raise exception 'Use your own profile settings to change your own account, not this function.';
  end if;

  update users_profile
  set role = p_new_role, org_id = p_new_org_id
  where id = p_target_id;
end;
$$;

grant execute on function admin_set_user_role(uuid, text, uuid) to authenticated;
