-- Ported from add-role-column.sql (root). Adds the role column used by
-- src/contexts/AuthContext.jsx (isAdmin/isStudent) and the signup flow.

do $$
begin
    if not exists (
        select 1
        from information_schema.columns
        where table_name = 'users_profile'
        and column_name = 'role'
    ) then
        alter table users_profile add column role text default 'student';
    end if;
end $$;

update users_profile
set role = 'student'
where role is null;

create index if not exists idx_users_profile_role on users_profile(role);
