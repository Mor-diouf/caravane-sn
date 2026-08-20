GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_organizer_member(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_booking(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_booking(uuid, uuid) TO anon, authenticated;