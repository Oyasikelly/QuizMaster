-- Phase 2, task t12 support. A reusable tree-traversal query — "this org
-- plus every descendant under it" — exposed as an RPC so the application
-- doesn't need to hand-write recursive CTEs. Backs src/lib/org-scope.js.
--
-- Not a security boundary by itself (callable by any authenticated user
-- for any org_id — reading the shape of the org tree isn't sensitive).
-- The actual access control is still, and until Phase 3 only is, the RLS
-- policies gated on is_admin().

create or replace function org_subtree_ids(root_id uuid)
returns table (id uuid)
language sql
stable
security definer
set search_path = public
as $$
  with recursive subtree as (
    select o.id, o.parent_id from organizations o where o.id = root_id
    union all
    select o.id, o.parent_id from organizations o
    join subtree s on o.parent_id = s.id
  )
  select id from subtree;
$$;

grant execute on function org_subtree_ids(uuid) to authenticated;
