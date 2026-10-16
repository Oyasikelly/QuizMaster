-- Read-only convenience view, requested after the project owner found the
-- raw `questions` table confusing to browse directly in the Supabase
-- dashboard — it only carries org_id/category, not difficulty/year/lesson,
-- which live on the parent lessons/academic_years tables by design (so
-- that context isn't duplicated onto every one of 2000+ question rows).
-- This joins everything into one flat, organized table for browsing.
--
-- security_invoker = true: RLS on the underlying tables still applies
-- based on whoever queries this view, not the view's owner — so if this
-- is ever queried through the app by a scoped admin (not just browsed via
-- the Supabase dashboard, which already bypasses RLS entirely), it stays
-- correctly scoped, consistent with everything else in this project.
-- Purely additive: a new read-only view changes no existing behavior.

create view content_overview
with (security_invoker = true)
as
select
    q.id as question_id,
    o.name as province,
    q.category,
    ay.year,
    l.difficulty,
    l.title as lesson_title,
    l.lesson_key,
    q.question,
    q.type,
    q.options,
    q.answer,
    q.created_at
from questions q
join lessons l on l.id = q.lesson_id
join academic_years ay on ay.id = l.academic_year_id
join organizations o on o.id = q.org_id
order by o.name, q.category, ay.year, l.difficulty, l.title;

grant select on content_overview to authenticated;
