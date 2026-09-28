-- Mettre à jour le délai d'annulation automatique des réservations non payées à 4 heures
create or replace function public.cancel_expired_pending_bookings()
returns void
language sql
security definer
set search_path = public
as $$
  update public.bookings
  set status = 'cancelled'
  where status = 'pending'
    and created_at < now() - interval '4 hours';
$$;
