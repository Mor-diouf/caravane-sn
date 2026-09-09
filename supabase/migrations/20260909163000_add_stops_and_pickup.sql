-- ============================================================
-- MIGRATION: Escales et tarifs par tronçon pour KING-BUS 2.0
-- ============================================================

-- 1. Ajout de la colonne 'stops' (jsonb) sur la table caravans
-- Structure d'un arrêt : [{ id: string, city: string, pickup: string, price_fcfa: number, time_offset?: string }]
ALTER TABLE public.caravans 
ADD COLUMN IF NOT EXISTS stops jsonb DEFAULT '[]'::jsonb;

-- 2. Ajout de la colonne 'pickup_stop' sur la table bookings pour archiver le lieu exact d'embarquement
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS pickup_stop text;

-- 3. Commentaire pour documentation
COMMENT ON COLUMN public.caravans.stops IS 'Liste des escales intermédiaires et tarifs par tronçon (format JSONB)';
COMMENT ON COLUMN public.bookings.pickup_stop IS 'Point de montée / escale choisie par le passager';
