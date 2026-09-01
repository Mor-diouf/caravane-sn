-- ============================================================
-- SCRIPT DE SCHEMA COMPLET POUR VOTRE PROJET SUPABASE
-- Executez ce script dans l'Editeur SQL (SQL Editor) de Supabase
-- ============================================================

-- ============ ENUMS ============
create type public.app_role as enum ('student','organizer','admin');
create type public.organizer_status as enum ('pending','approved','suspended','rejected');
create type public.caravan_status as enum ('draft','published','full','completed','cancelled');
create type public.booking_status as enum ('pending','confirmed','cancelled','refunded');
create type public.payment_method as enum ('wave','orange','free');
create type public.payment_status as enum ('pending','paid','failed','refunded');
create type public.ticket_status as enum ('valid','used','void');
create type public.payout_status as enum ('requested','approved','paid','rejected');
create type public.review_status as enum ('published','reported','hidden');
create type public.dispute_status as enum ('open','investigating','resolved','rejected');
create type public.team_role as enum ('manager','finance','scanner','support');

-- ============ SHARED FUNCTIONS ============
create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- ============ UNIVERSITIES ============
create table public.universities (
  id text primary key,
  abbr text not null unique,
  name text not null,
  city text not null,
  created_at timestamptz not null default now()
);
grant select on public.universities to anon;
grant select on public.universities to authenticated;
grant all on public.universities to service_role;
alter table public.universities enable row level security;
create policy "universities_public_read" on public.universities for select using (true);

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  phone text,
  student_id text,
  university_id text references public.universities(id) on delete set null,
  avatar_url text,
  preferred_payment public.payment_method not null default 'wave',
  notify_departures boolean not null default true,
  notify_promos boolean not null default true,
  notify_whatsapp boolean not null default false,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.update_updated_at_column();

-- ============ USER ROLES ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create policy "roles_read_own" on public.user_roles for select to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "roles_admin_write" on public.user_roles for all to authenticated
using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "profiles_read" on public.profiles for select to authenticated
using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "profiles_insert_own" on public.profiles for insert to authenticated
with check (id = auth.uid());
create policy "profiles_update" on public.profiles for update to authenticated
using (id = auth.uid() or public.has_role(auth.uid(), 'admin'))
with check (id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.raw_user_meta_data->>'phone'
  ) on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'student')
  on conflict (user_id, role) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ============ ORGANIZERS ============
create table public.organizers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  name text not null,
  description text,
  phone text,
  whatsapp text,
  university_id text references public.universities(id) on delete set null,
  status public.organizer_status not null default 'pending',
  is_pro boolean not null default false,
  rating numeric(2,1) not null default 0,
  commission_rate numeric(5,2) not null default 8.00,
  documents jsonb not null default '[]'::jsonb,
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.organizers to anon;
grant select, insert, update on public.organizers to authenticated;
grant all on public.organizers to service_role;
alter table public.organizers enable row level security;
create trigger organizers_updated_at before update on public.organizers
for each row execute function public.update_updated_at_column();

create table public.organizer_members (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.organizers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.team_role not null default 'manager',
  created_at timestamptz not null default now(),
  unique (organizer_id, user_id)
);
grant select, insert, update, delete on public.organizer_members to authenticated;
grant all on public.organizer_members to service_role;
alter table public.organizer_members enable row level security;

create or replace function public.is_organizer_member(_organizer_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organizers o where o.id = _organizer_id and o.owner_id = _user_id)
      or exists (select 1 from public.organizer_members m where m.organizer_id = _organizer_id and m.user_id = _user_id);
$$;

create policy "organizers_public_read_approved" on public.organizers for select
using (status = 'approved' or owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "organizers_owner_insert" on public.organizers for insert to authenticated
with check (owner_id = auth.uid());
create policy "organizers_update" on public.organizers for update to authenticated
using (owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
with check (owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "members_read" on public.organizer_members for select to authenticated
using (user_id = auth.uid() or public.is_organizer_member(organizer_id, auth.uid()) or public.has_role(auth.uid(), 'admin'));
create policy "members_manage" on public.organizer_members for all to authenticated
using (exists (select 1 from public.organizers o where o.id = organizer_id and o.owner_id = auth.uid()) or public.has_role(auth.uid(), 'admin'))
with check (exists (select 1 from public.organizers o where o.id = organizer_id and o.owner_id = auth.uid()) or public.has_role(auth.uid(), 'admin'));

-- ============ CARAVANS ============
create table public.caravans (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.organizers(id) on delete cascade,
  university_id text references public.universities(id) on delete set null,
  from_label text not null,
  to_label text not null,
  departure_at timestamptz not null,
  pickup text not null,
  dropoff text not null,
  price_fcfa integer not null check (price_fcfa >= 0),
  total_seats integer not null check (total_seats > 0),
  seats_left integer not null check (seats_left >= 0),
  image_url text,
  amenities text[] not null default '{}',
  about text,
  status public.caravan_status not null default 'published',
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.caravans to anon;
grant select, insert, update, delete on public.caravans to authenticated;
grant all on public.caravans to service_role;
alter table public.caravans enable row level security;
create trigger caravans_updated_at before update on public.caravans
for each row execute function public.update_updated_at_column();
create index caravans_departure_idx on public.caravans (departure_at);
create index caravans_university_idx on public.caravans (university_id);

create policy "caravans_public_read" on public.caravans for select
using ((status = 'published' and is_hidden = false)
  or public.is_organizer_member(organizer_id, auth.uid())
  or public.has_role(auth.uid(), 'admin'));
create policy "caravans_org_insert" on public.caravans for insert to authenticated
with check (public.is_organizer_member(organizer_id, auth.uid()));
create policy "caravans_org_update" on public.caravans for update to authenticated
using (public.is_organizer_member(organizer_id, auth.uid()) or public.has_role(auth.uid(), 'admin'))
with check (public.is_organizer_member(organizer_id, auth.uid()) or public.has_role(auth.uid(), 'admin'));
create policy "caravans_org_delete" on public.caravans for delete to authenticated
using (public.is_organizer_member(organizer_id, auth.uid()) or public.has_role(auth.uid(), 'admin'));

-- ============ BOOKINGS ============
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  caravan_id uuid not null references public.caravans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  seats integer not null default 1 check (seats > 0),
  amount_fcfa integer not null default 0,
  reference text not null unique,
  status public.booking_status not null default 'pending',
  payer_phone text,
  passenger_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.bookings to authenticated;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;
create trigger bookings_updated_at before update on public.bookings
for each row execute function public.update_updated_at_column();
create index bookings_user_idx on public.bookings (user_id);
create index bookings_caravan_idx on public.bookings (caravan_id);

create or replace function public.can_manage_booking(_caravan_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.caravans c
    where c.id = _caravan_id and public.is_organizer_member(c.organizer_id, _user_id)
  );
$$;

create policy "bookings_read" on public.bookings for select to authenticated
using (user_id = auth.uid() or public.can_manage_booking(caravan_id, auth.uid()) or public.has_role(auth.uid(), 'admin'));
create policy "bookings_insert_own" on public.bookings for insert to authenticated
with check (user_id = auth.uid());
create policy "bookings_update" on public.bookings for update to authenticated
using (user_id = auth.uid() or public.can_manage_booking(caravan_id, auth.uid()) or public.has_role(auth.uid(), 'admin'))
with check (user_id = auth.uid() or public.can_manage_booking(caravan_id, auth.uid()) or public.has_role(auth.uid(), 'admin'));

create or replace function public.sync_seats()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.status in ('pending','confirmed') then
      update public.caravans set seats_left = greatest(seats_left - new.seats, 0) where id = new.caravan_id;
    end if;
  elsif tg_op = 'UPDATE' then
    if new.status in ('cancelled','refunded') and old.status in ('pending','confirmed') then
      update public.caravans set seats_left = least(seats_left + old.seats, total_seats) where id = new.caravan_id;
    elsif new.status in ('pending','confirmed') and old.status in ('cancelled','refunded') then
      update public.caravans set seats_left = greatest(seats_left - new.seats, 0) where id = new.caravan_id;
    end if;
  end if;
  return new;
end; $$;
create trigger bookings_sync_seats after insert or update on public.bookings
for each row execute function public.sync_seats();

-- ============ TICKETS ============
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  qr_code text not null unique,
  status public.ticket_status not null default 'valid',
  checked_in_at timestamptz,
  checked_in_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.tickets to authenticated;
grant all on public.tickets to service_role;
alter table public.tickets enable row level security;

create or replace function public.can_access_booking(_booking_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.bookings b
    where b.id = _booking_id
      and (b.user_id = _user_id or public.can_manage_booking(b.caravan_id, _user_id))
  );
$$;

create policy "tickets_read" on public.tickets for select to authenticated
using (public.can_access_booking(booking_id, auth.uid()) or public.has_role(auth.uid(), 'admin'));
create policy "tickets_insert" on public.tickets for insert to authenticated
with check (public.can_access_booking(booking_id, auth.uid()));
create policy "tickets_update" on public.tickets for update to authenticated
using (public.can_access_booking(booking_id, auth.uid()) or public.has_role(auth.uid(), 'admin'))
with check (public.can_access_booking(booking_id, auth.uid()) or public.has_role(auth.uid(), 'admin'));

-- ============ PAYMENTS ============
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  method public.payment_method not null,
  amount_fcfa integer not null,
  commission_fcfa integer not null default 0,
  status public.payment_status not null default 'pending',
  external_ref text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;
create policy "payments_read" on public.payments for select to authenticated
using (user_id = auth.uid() or public.can_access_booking(booking_id, auth.uid()) or public.has_role(auth.uid(), 'admin'));
create policy "payments_insert_own" on public.payments for insert to authenticated
with check (user_id = auth.uid());
create policy "payments_update_admin" on public.payments for update to authenticated
using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- ============ PAYOUTS ============
create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.organizers(id) on delete cascade,
  amount_fcfa integer not null check (amount_fcfa > 0),
  method public.payment_method not null default 'wave',
  status public.payout_status not null default 'requested',
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references auth.users(id) on delete set null
);
grant select, insert, update on public.payouts to authenticated;
grant all on public.payouts to service_role;
alter table public.payouts enable row level security;
create policy "payouts_read" on public.payouts for select to authenticated
using (public.is_organizer_member(organizer_id, auth.uid()) or public.has_role(auth.uid(), 'admin'));
create policy "payouts_request" on public.payouts for insert to authenticated
with check (public.is_organizer_member(organizer_id, auth.uid()));
create policy "payouts_update_admin" on public.payouts for update to authenticated
using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- ============ REVIEWS ============
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  caravan_id uuid references public.caravans(id) on delete cascade,
  organizer_id uuid not null references public.organizers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  status public.review_status not null default 'published',
  reported_reason text,
  created_at timestamptz not null default now()
);
grant select on public.reviews to anon;
grant select, insert, update on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "reviews_public_read" on public.reviews for select
using (status = 'published' or user_id = auth.uid() or public.is_organizer_member(organizer_id, auth.uid()) or public.has_role(auth.uid(), 'admin'));
create policy "reviews_insert_own" on public.reviews for insert to authenticated
with check (user_id = auth.uid());
create policy "reviews_update" on public.reviews for update to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
with check (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- ============ FAVORITES ============
create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  caravan_id uuid not null references public.caravans(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, caravan_id)
);
grant select, insert, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;
alter table public.favorites enable row level security;
create policy "favorites_own" on public.favorites for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============ DISPUTES ============
create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  organizer_id uuid references public.organizers(id) on delete set null,
  opened_by uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  description text,
  status public.dispute_status not null default 'open',
  resolution text,
  amount_refunded_fcfa integer not null default 0,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.disputes to authenticated;
grant all on public.disputes to service_role;
alter table public.disputes enable row level security;
create policy "disputes_read" on public.disputes for select to authenticated
using (opened_by = auth.uid() or public.is_organizer_member(organizer_id, auth.uid()) or public.has_role(auth.uid(), 'admin'));
create policy "disputes_insert_own" on public.disputes for insert to authenticated
with check (opened_by = auth.uid());
create policy "disputes_update_admin" on public.disputes for update to authenticated
using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- ============ NOTIFICATIONS ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  kind text not null default 'info',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "notifications_own_read" on public.notifications for select to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "notifications_own_update" on public.notifications for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============ AUDIT LOG ============
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;
create policy "audit_admin_read" on public.audit_log for select to authenticated
using (public.has_role(auth.uid(), 'admin'));
create policy "audit_insert_authenticated" on public.audit_log for insert to authenticated
with check (actor_id = auth.uid());

-- ============ PLATFORM SETTINGS ============
create table public.platform_settings (
  id boolean primary key default true check (id),
  commission_rate numeric(5,2) not null default 8.00,
  wave_enabled boolean not null default true,
  orange_enabled boolean not null default true,
  free_enabled boolean not null default true,
  auto_approve_organizers boolean not null default false,
  min_payout_fcfa integer not null default 10000,
  support_phone text not null default '+221 77 000 00 00',
  updated_at timestamptz not null default now()
);
grant select on public.platform_settings to anon;
grant select on public.platform_settings to authenticated;
grant all on public.platform_settings to service_role;
alter table public.platform_settings enable row level security;
create policy "settings_public_read" on public.platform_settings for select using (true);
create policy "settings_admin_write" on public.platform_settings for all to authenticated
using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger settings_updated_at before update on public.platform_settings
for each row execute function public.update_updated_at_column();

-- ============ PERMISSIONS ET GRANTS SUPP ============
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_organizer_member(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_booking(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_booking(uuid, uuid) TO anon, authenticated;

-- ============ DONNEES DE DEPART ============
insert into public.platform_settings (id) values (true) on conflict (id) do nothing;

insert into public.universities (id, abbr, name, city) values
  ('uasz','UASZ','Université Assane Seck','Ziguinchor'),
  ('ucad','UCAD','Université Cheikh Anta Diop','Dakar'),
  ('ugb','UGB','Université Gaston Berger','Saint-Louis'),
  ('uidt','UIDT','Université Iba Der Thiam','Thiès'),
  ('uadb','UADB','Université Alioune Diop','Bambey')
on conflict (id) do nothing;
