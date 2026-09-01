-- Migration: Organizer Branding Fields
-- Adds logo_url, slogan, support_phone columns to organizers table
-- These fields are shown on the ticket and caravan detail page

ALTER TABLE public.organizers
  ADD COLUMN IF NOT EXISTS logo_url       TEXT,
  ADD COLUMN IF NOT EXISTS slogan         TEXT,
  ADD COLUMN IF NOT EXISTS support_phone  TEXT;

COMMENT ON COLUMN public.organizers.logo_url      IS 'URL du logo de la marque/societe (ex: King Bus 2.0), affiche sur le billet';
COMMENT ON COLUMN public.organizers.slogan        IS 'Slogan ou devise de l organisation, affiche sur la page de la caravane';
COMMENT ON COLUMN public.organizers.support_phone IS 'Numero d assistance passagers, distinct du numero principal';
