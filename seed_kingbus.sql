-- ============================================================
-- SCRIPT DE SEED KING-BUS 2.0 POUR SUPABASE
-- À exécuter dans l'éditeur SQL de votre projet Supabase
-- ============================================================

DO $$
DECLARE
  kb_org_id uuid;
BEGIN
  -- 1. Création ou mise à jour de l'organisateur unique KING-BUS 2.0
  SELECT id INTO kb_org_id FROM public.organizers WHERE name ILIKE '%KING-BUS%' LIMIT 1;

  IF kb_org_id IS NULL THEN
    INSERT INTO public.organizers (
      name,
      description,
      phone,
      whatsapp,
      status,
      is_pro,
      rating,
      commission_rate
    ) VALUES (
      'KING-BUS 2.0',
      'Plateforme officielle de transport interurbain. Voyagez avec confort, voyagez avec classe. Confort maximal, sécurité assurée, climatisation à bord et bagages autorisés.',
      '+221 78 188 01 02',
      '221781880102',
      'approved',
      true,
      5.0,
      0.00
    ) RETURNING id INTO kb_org_id;
  ELSE
    UPDATE public.organizers SET
      name = 'KING-BUS 2.0',
      description = 'Plateforme officielle de transport interurbain. Voyagez avec confort, voyagez avec classe.',
      phone = '+221 78 188 01 02',
      whatsapp = '221781880102',
      status = 'approved',
      is_pro = true,
      rating = 5.0
    WHERE id = kb_org_id;
  END IF;

  -- 2. Insertion des départs officiels King-Bus Dakar ⇄ Ziguinchor
  -- Trajet 1 : Dakar -> Ziguinchor (Matin)
  INSERT INTO public.caravans (
    organizer_id,
    from_label,
    to_label,
    departure_at,
    pickup,
    dropoff,
    price_fcfa,
    total_seats,
    seats_left,
    image_url,
    amenities,
    about,
    status
  ) VALUES (
    kb_org_id,
    'Dakar',
    'Ziguinchor',
    now() + interval '12 hours',
    'Gare King-Bus Dakar (Patte d''Oie / Beaux Maraîchers)',
    'Gare King-Bus Ziguinchor (Escale)',
    12000,
    50,
    18,
    '/images/king-bus/flyer.jpg',
    ARRAY['ac', 'wifi', 'usb', 'video'],
    'Départ quotidien direct Dakar ➔ Ziguinchor. Sièges grand confort inclinables, climatisation régulée et prises USB. Présentez votre billet QR Code à l''embarquement. Bagages inclus.',
    'published'
  );

  -- Trajet 2 : Ziguinchor -> Dakar (Matin)
  INSERT INTO public.caravans (
    organizer_id,
    from_label,
    to_label,
    departure_at,
    pickup,
    dropoff,
    price_fcfa,
    total_seats,
    seats_left,
    image_url,
    amenities,
    about,
    status
  ) VALUES (
    kb_org_id,
    'Ziguinchor',
    'Dakar',
    now() + interval '12 hours',
    'Gare King-Bus Ziguinchor (Escale)',
    'Gare King-Bus Dakar (Patte d''Oie)',
    12000,
    50,
    24,
    '/images/king-bus/flyer.jpg',
    ARRAY['ac', 'wifi', 'usb', 'video'],
    'Départ quotidien direct Ziguinchor ➔ Dakar. Climatisation, sécurité GPS et bagages autorisés jusqu''à 25 kg.',
    'published'
  );

  -- Trajet 3 : Dakar -> Ziguinchor VIP Nuit
  INSERT INTO public.caravans (
    organizer_id,
    from_label,
    to_label,
    departure_at,
    pickup,
    dropoff,
    price_fcfa,
    total_seats,
    seats_left,
    image_url,
    amenities,
    about,
    status
  ) VALUES (
    kb_org_id,
    'Dakar',
    'Ziguinchor',
    now() + interval '1 day 2 hours',
    'Gare King-Bus Dakar (Patte d''Oie)',
    'Gare King-Bus Ziguinchor',
    14000,
    48,
    12,
    '/images/king-bus/flyer.jpg',
    ARRAY['ac', 'wifi', 'usb', 'video'],
    'Service VIP Nuit King-Bus. Voyagez de nuit en toute quiétude avec double équipage de chauffeurs professionnels et sièges inclinables confort.',
    'published'
  );

  -- Trajet 4 : Ziguinchor -> Dakar VIP Nuit
  INSERT INTO public.caravans (
    organizer_id,
    from_label,
    to_label,
    departure_at,
    pickup,
    dropoff,
    price_fcfa,
    total_seats,
    seats_left,
    image_url,
    amenities,
    about,
    status
  ) VALUES (
    kb_org_id,
    'Ziguinchor',
    'Dakar',
    now() + interval '1 day 2 hours',
    'Gare King-Bus Ziguinchor',
    'Gare King-Bus Dakar',
    14000,
    48,
    15,
    '/images/king-bus/flyer.jpg',
    ARRAY['ac', 'wifi', 'usb', 'video'],
    'Service VIP Nuit King-Bus Ziguinchor ➔ Dakar. Arrivée matinale à Dakar.',
    'published'
  );

  RAISE NOTICE 'Seed King-Bus 2.0 exécuté avec succès pour l''organisateur ID: %', kb_org_id;
END $$;
