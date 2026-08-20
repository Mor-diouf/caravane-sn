-- Trigger-only functions: no direct API access at all
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.sync_seats() from public, anon, authenticated;
revoke all on function public.update_updated_at_column() from public, anon, authenticated;

-- RLS helper functions: needed by signed-in users only
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
revoke all on function public.is_organizer_member(uuid, uuid) from public, anon;
revoke all on function public.can_manage_booking(uuid, uuid) from public, anon;
revoke all on function public.can_access_booking(uuid, uuid) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_organizer_member(uuid, uuid) to authenticated;
grant execute on function public.can_manage_booking(uuid, uuid) to authenticated;
grant execute on function public.can_access_booking(uuid, uuid) to authenticated;