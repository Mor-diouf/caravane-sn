-- Ajouter le layout optionnel aux caravanes
ALTER TABLE public.caravans ADD COLUMN IF NOT EXISTS layout JSONB;

-- Ajouter les sièges sélectionnés aux réservations
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS selected_seats TEXT[] DEFAULT '{}';

-- Ajouter le numéro de siège aux tickets
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS seat_number TEXT;
