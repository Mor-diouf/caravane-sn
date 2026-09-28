-- Permettre la suppression des réservations annulées pour les organisateurs et administrateurs
grant delete on public.bookings to authenticated;

drop policy if exists "bookings_delete_cancelled" on public.bookings;
create policy "bookings_delete_cancelled" on public.bookings for delete to authenticated
using (
  status = 'cancelled' and (
    public.can_manage_booking(caravan_id, auth.uid()) or public.has_role(auth.uid(), 'admin')
  )
);
