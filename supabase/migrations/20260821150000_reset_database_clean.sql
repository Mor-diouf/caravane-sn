-- ============================================================
-- REINITIALISATION DE LA BASE DE DONNEES SUPABASE
-- Remise à zéro des compteurs (tickets, réservations, caravanes, etc.)
-- Conservation de l'utilisateur Modou + attribution des rôles Admin et Organisateur
-- ============================================================

-- 1. Nettoyage des données de test et transactions
TRUNCATE TABLE public.tickets CASCADE;
TRUNCATE TABLE public.payments CASCADE;
TRUNCATE TABLE public.bookings CASCADE;
TRUNCATE TABLE public.favorites CASCADE;
TRUNCATE TABLE public.reviews CASCADE;
TRUNCATE TABLE public.disputes CASCADE;
TRUNCATE TABLE public.payouts CASCADE;
TRUNCATE TABLE public.audit_log CASCADE;
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.organizer_members CASCADE;
TRUNCATE TABLE public.caravans CASCADE;
TRUNCATE TABLE public.organizers CASCADE;

-- 2. Configuration automatique de l'utilisateur Modou
DO $$
DECLARE
  target_user_id uuid;
  new_org_id uuid;
BEGIN
  -- Recherche du compte Modou dans les profils
  SELECT id INTO target_user_id
  FROM public.profiles
  WHERE full_name ILIKE '%modou%' OR email ILIKE '%modou%'
  ORDER BY created_at ASC
  LIMIT 1;

  -- Si aucun profil nommé Modou n'est trouvé, prendre le premier utilisateur inscrit
  IF target_user_id IS NULL THEN
    SELECT id INTO target_user_id
    FROM public.profiles
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  -- Si un utilisateur existe, lui assigner les rôles et créer son amicale organisatrice
  IF target_user_id IS NOT NULL THEN
    -- Mettre à jour le nom si nécessaire
    UPDATE public.profiles
    SET full_name = 'Modou'
    WHERE id = target_user_id AND (full_name IS NULL OR full_name = '');

    -- Rôles Admin et Organisateur
    INSERT INTO public.user_roles (user_id, role)
    VALUES 
      (target_user_id, 'admin'),
      (target_user_id, 'organizer'),
      (target_user_id, 'student')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Création d'un espace organisateur approuvé et Pro pour Modou
    INSERT INTO public.organizers (
      owner_id,
      name,
      description,
      phone,
      whatsapp,
      university_id,
      status,
      is_pro,
      commission_rate,
      verified_at
    ) VALUES (
      target_user_id,
      'Amicale Officielle (Modou)',
      'Espace organisateur certifié pour la gestion des caravanes universitaires.',
      '+221 77 000 00 00',
      '+221 77 000 00 00',
      'ucad',
      'approved',
      true,
      8.00,
      NOW()
    )
    RETURNING id INTO new_org_id;

  END IF;
END $$;
