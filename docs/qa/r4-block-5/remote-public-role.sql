-- Read-only smoke through stored RLS/RPC references, not private helper calls.
-- Synthetic identity only; does not claim an Auth session or real JWT.
begin read only;
set local request.jwt.claim.sub = '20000000-0000-4000-8000-000000000099';
set local request.jwt.claims = '{"sub":"20000000-0000-4000-8000-000000000099","role":"authenticated"}';
set local role authenticated;
select count(*) as event_rows_checked,
    count(summary.capacity) as authorized_summary_rows,
    count(organizer.display_name) as authorized_organizer_rows,
    'synthetic SQL identity, no real JWT; read-only rollback' as evidence_type
from (select id from public.events where visibility='public' limit 1) e
cross join lateral public.get_event_participation_summary(e.id) summary
cross join lateral public.get_event_organizer(e.id) organizer;
rollback;
