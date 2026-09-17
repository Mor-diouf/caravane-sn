-- Mettre à jour l'état actuel des réservations expirées
-- Le trigger `bookings_sync_seats` remettra automatiquement à jour `seats_left` sur les caravanes.
update public.bookings
set status = 'cancelled'
where status = 'pending'
  and created_at < now() - interval '30 minutes';

-- Activer pg_cron s'il n'est pas actif
create extension if not exists pg_cron with schema extensions;

-- Fonction dédiée au nettoyage
create or replace function public.cancel_expired_pending_bookings()
returns void
language sql
security definer
set search_path = public
as $$
  update public.bookings
  set status = 'cancelled'
  where status = 'pending'
    and created_at < now() - interval '30 minutes';
$$;

-- Dévérouiller si déjà planifié
do $$
begin
  perform cron.unschedule('auto-cancel-expired-bookings');
exception
  when others then null;
end $$;

-- Planifier la vérification toutes les 5 minutes
select cron.schedule(
  'auto-cancel-expired-bookings',
  '*/5 * * * *',
  $$ select public.cancel_expired_pending_bookings(); $$
);
