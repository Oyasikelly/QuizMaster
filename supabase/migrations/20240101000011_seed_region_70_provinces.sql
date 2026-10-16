-- Phase 1, task t07. Seeds exactly the org units named so far: Region 70
-- and the five provinces explicitly mentioned (20, 21, 23, 25, 26). This is
-- real organizational data, not test/sample data — deliberately NOT
-- extended with invented province numbers or any zone/area/parish rows,
-- since those weren't given and guessing them would just be wrong data
-- wearing the shape of real data. Add the rest with plain INSERTs (or,
-- later, the Phase 6 admin UI) once you have the full list.

do $$
declare
  region_id uuid;
begin
  insert into organizations (level, code, name)
  values ('region', '70', 'Region 70')
  on conflict (code) where level = 'region' do nothing;

  select id into region_id from organizations where level = 'region' and code = '70';

  insert into organizations (parent_id, level, code, name) values
    (region_id, 'province', '20', 'Province 20'),
    (region_id, 'province', '21', 'Province 21'),
    (region_id, 'province', '23', 'Province 23'),
    (region_id, 'province', '25', 'Province 25'),
    (region_id, 'province', '26', 'Province 26')
  on conflict (parent_id, code) do nothing;
end $$;
