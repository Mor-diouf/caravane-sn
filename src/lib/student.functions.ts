import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  CARAVAN_SELECT,
  mapCaravan,
  type CaravanView,
  type UniversityRow,
  parseStops,
  parsePassengerBoarding,
  formatPassengerWithBoarding,
} from "@/lib/student-shared";
import { getCached, setCached, invalidateCache } from "@/lib/server-cache";

export const listUniversities = createServerFn({ method: "GET" }).handler(
  async (): Promise<UniversityRow[]> => {
    const cached = getCached<UniversityRow[]>("universities");
    if (cached) return cached;

    const { createPublicClient } = await import("@/lib/supabase-public.server");
    const { data, error } = await createPublicClient()
      .from("universities")
      .select("id, abbr, name, city")
      .order("abbr");
    if (error) throw new Error(error.message);
    const result = data ?? [];
    return setCached("universities", result, 60 * 60 * 1000); // 1 hour
  },
);

export const listCaravans = createServerFn({ method: "GET" }).handler(
  async (): Promise<CaravanView[]> => {
    const cached = getCached<CaravanView[]>("caravans:list");
    if (cached) return cached;

    const { createPublicClient } = await import("@/lib/supabase-public.server");
    const { data, error } = await createPublicClient()
      .from("caravans")
      .select(CARAVAN_SELECT)
      .eq("status", "published")
      .eq("is_hidden", false)
      .order("departure_at", { ascending: true });
    if (error) throw new Error(error.message);
    const result = (data ?? []).map((row) => mapCaravan(row as never));
    return setCached("caravans:list", result, 30 * 1000); // 30 seconds
  },
);

export const getCaravan = createServerFn({ method: "GET" })
  .validator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }): Promise<CaravanView | null> => {
    const cacheKey = `caravan:${data.id}`;
    const cached = getCached<CaravanView | null>(cacheKey);
    if (cached !== null) return cached;

    const { createPublicClient } = await import("@/lib/supabase-public.server");
    const { data: row, error } = await createPublicClient()
      .from("caravans")
      .select(CARAVAN_SELECT)
      .eq("id", data.id)
      .eq("status", "published")
      .eq("is_hidden", false)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const result = row ? mapCaravan(row as never) : null;
    return setCached(cacheKey, result, 30 * 1000); // 30 seconds
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) =>
    z
      .object({
        full_name: z.string().min(1).max(120).optional(),
        phone: z.string().max(40).nullable().optional(),
        email: z.string().email().nullable().optional(),
        student_id: z.string().max(60).nullable().optional(),
        university_id: z.string().max(40).nullable().optional(),
        avatar_url: z.string().nullable().optional(),
        preferred_payment: z.enum(["wave", "orange", "free"]).optional(),
        notify_departures: z.boolean().optional(),
        notify_promos: z.boolean().optional(),
        notify_whatsapp: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("profiles")
      .update(data as never)
      .eq("id", context.userId)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const getMyFavorites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<string[]> => {
    const { data, error } = await context.supabase
      .from("favorites")
      .select("caravan_id")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((f) => f.caravan_id);
  });

export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) =>
    z.object({ caravanId: z.string().uuid(), favorite: z.boolean() }).parse(data),
  )
  .handler(async ({ context, data }) => {
    if (data.favorite) {
      const { error } = await context.supabase
        .from("favorites")
        .upsert(
          { user_id: context.userId, caravan_id: data.caravanId },
          { onConflict: "user_id,caravan_id" },
        );
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("favorites")
        .delete()
        .eq("user_id", context.userId)
        .eq("caravan_id", data.caravanId);
      if (error) throw new Error(error.message);
    }
    return { favorite: data.favorite };
  });

export const getMyTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bookings")
      .select(
        `id, caravan_id, seats, amount_fcfa, reference, status, created_at, passenger_name,
         caravans(${CARAVAN_SELECT}),
         tickets(id, qr_code, status, checked_in_at),
         payments(method, status, amount_fcfa, paid_at)`,
      )
      .eq("user_id", context.userId)
      .eq("status", "confirmed")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    // Fetch user reviews
    const caravanIds = [...new Set((data ?? []).map((b) => b.caravan_id).filter(Boolean))];
    const { data: reviews } = caravanIds.length
      ? await context.supabase
          .from("reviews")
          .select("id, caravan_id, rating, comment, created_at")
          .eq("user_id", context.userId)
          .in("caravan_id", caravanIds)
      : { data: [] };

    return (data ?? []).map((b) => {
      const boardingInfo = parsePassengerBoarding(b.passenger_name);
      return {
        id: b.id,
        caravanId: b.caravan_id,
        seats: b.seats,
        amount: b.amount_fcfa,
        reference: b.reference,
        status: b.status,
        passenger_name: boardingInfo.name,
        pickup_stop: boardingInfo.pickupStop ?? null,
        createdAt: b.created_at,
        caravan: b.caravans ? mapCaravan(b.caravans as never) : null,
        ticket: (b.tickets ?? [])[0] ?? null,
        payment: (b.payments ?? [])[0] ?? null,
        review: (reviews ?? []).find((r) => r.caravan_id === b.caravan_id) ?? null,
      };
    });
  });

export const initiateWavePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) =>
    z
      .object({
        caravanId: z.string().uuid(),
        seats: z.number().int().min(1).max(6),
        payerPhone: z.string().min(9),
        passengerName: z.string().optional(),
        stopId: z.string().optional(),
        pickupStop: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    // 1. Fetch Caravan and its payment_link
    const { data: caravan, error: caravanError } = await context.supabase
      .from("caravans")
      .select("id, price_fcfa, seats_left, payment_link, about")
      .eq("id", data.caravanId)
      .maybeSingle();

    if (caravanError || !caravan) throw new Error("Caravane introuvable");
    if (caravan.seats_left < data.seats)
      throw new Error("Il ne reste pas assez de places disponibles");
    if (!caravan.payment_link)
      throw new Error("Paiement non disponible pour cette caravane (Lien manquant)");

    // Compute price: check if an intermediate stop is selected
    const stops = parseStops((caravan as any)?.stops, caravan?.about);
    let unitPrice = caravan.price_fcfa;
    let selectedStopName = data.pickupStop;

    if (data.stopId) {
      const foundStop = stops.find((s) => s.id === data.stopId);
      if (foundStop) {
        unitPrice = foundStop.price_fcfa;
        selectedStopName = foundStop.city;
      }
    }

    const amount = unitPrice * data.seats;
    const ref = `BK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Embed boarding point inside passenger_name for universal compatibility
    const basePassengerName = data.passengerName?.trim() || "Voyageur";
    const passengerNameWithBoarding = selectedStopName
      ? formatPassengerWithBoarding(basePassengerName, selectedStopName)
      : basePassengerName;

    // 2. Create Pending Booking with payer_phone
    const insertPayload: Record<string, unknown> = {
      user_id: context.userId,
      caravan_id: data.caravanId,
      seats: data.seats,
      amount_fcfa: amount,
      reference: ref,
      status: "pending",
      payer_phone: data.payerPhone.replace(/\s/g, ""),
      passenger_name: passengerNameWithBoarding,
    };
    if (selectedStopName) {
      insertPayload['pickup_stop'] = selectedStopName;
    }

    let { data: booking, error: bookingError } = await context.supabase
      .from("bookings")
      .insert(insertPayload as never)
      .select("id")
      .single();

    if (bookingError && insertPayload['pickup_stop']) {
      // Column pickup_stop might not exist yet if migration has not been applied
      delete insertPayload['pickup_stop'];
      const retry = await context.supabase
        .from("bookings")
        .insert(insertPayload as never)
        .select("id")
        .single();
      booking = retry.data;
      bookingError = retry.error;
    }

    if (bookingError || !booking)
      throw new Error(bookingError?.message || "Erreur lors de la création de la réservation");

    // Redirect to the Wave Business Link
    return { 
      redirectUrl: caravan.payment_link,
      bookingId: booking.id 
    };
  });

export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) =>
    z
      .object({
        caravanId: z.string().uuid(),
        seats: z.number().int().min(1).max(6),
        method: z.enum(["wave", "orange", "free"]),
        passengerName: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { data: caravan, error: caravanError } = await context.supabase
      .from("caravans")
      .select("id, price_fcfa, seats_left, organizer_id, organizers(commission_rate)")
      .eq("id", data.caravanId)
      .maybeSingle();
    if (caravanError) throw new Error(caravanError.message);
    if (!caravan) throw new Error("Caravane introuvable");
    if (caravan.seats_left < data.seats)
      throw new Error("Il ne reste pas assez de places disponibles");

    const amount = caravan.price_fcfa * data.seats;
    const rate = Number(caravan.organizers?.commission_rate ?? 0.05);
    const reference = `CE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const { data: booking, error: bookingError } = await context.supabase
      .from("bookings")
      .insert({
        caravan_id: data.caravanId,
        user_id: context.userId,
        seats: data.seats,
        amount_fcfa: amount,
        reference,
        status: "confirmed",
        passenger_name: data.passengerName || null,
      })
      .select("id, reference")
      .single();
    if (bookingError) throw new Error(bookingError.message);

    const { error: paymentError } = await context.supabase.from("payments").insert({
      booking_id: booking.id,
      user_id: context.userId,
      method: data.method,
      amount_fcfa: amount,
      commission_fcfa: Math.round(amount * rate),
      status: "paid",
      external_ref: reference,
      paid_at: new Date().toISOString(),
    });
    if (paymentError) throw new Error(paymentError.message);

    const { error: ticketError } = await context.supabase.from("tickets").insert({
      booking_id: booking.id,
      qr_code: crypto.randomUUID(),
      status: "valid",
    });
    if (ticketError) throw new Error(ticketError.message);

    invalidateCache("caravan");
    return { bookingId: booking.id, reference: booking.reference };
  });

export const requestOrganizerAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) =>
    z
      .object({
        name: z.string().min(2),
        phone: z.string().min(9),
        studentCardBase64: z.string(),
        idCardBase64: z.string(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    // 1. Check if they already have an organizer account (even pending)
    const { data: existing, error: findError } = await context.supabase
      .from("organizers")
      .select("id, status")
      .eq("owner_id", context.userId)
      .maybeSingle();

    if (findError) throw new Error(findError.message);
    if (existing) {
      if (existing.status === "pending") {
        throw new Error("Vous avez déjà une demande en attente.");
      }
      if (existing.status === "approved") {
        throw new Error("Vous êtes déjà organisateur !");
      }
    }

    // 2. Fetch the user's university to associate it
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("university_id")
      .eq("id", context.userId)
      .maybeSingle();

    // 3. Insert the organizer request
    const { data: newOrg, error: insertError } = await context.supabase
      .from("organizers")
      .insert({
        owner_id: context.userId,
        name: data.name,
        phone: data.phone,
        status: "pending",
        commission_rate: 0.05, // default
        university_id: profile?.university_id || null,
        documents: {
          student_card: data.studentCardBase64,
          id_card: data.idCardBase64,
          submitted_at: new Date().toISOString(),
        },
      })
      .select("id")
      .single();

    if (insertError) throw new Error(insertError.message);

    // 4. Log the action so it appears on the Admin Dashboard activity feed
    await context.supabase.from("audit_log").insert({
      action: "organizer_requested",
      actor_id: context.userId,
      entity: "organizers",
      entity_id: newOrg.id,
      meta: { name: data.name },
    });

    return { success: true, organizerId: newOrg.id };
  });

export const submitCaravanReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        caravanId: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Verify caravan and organizer
    const { data: caravan, error: caravanErr } = await supabaseAdmin
      .from("caravans")
      .select("id, organizer_id, departure_at")
      .eq("id", data.caravanId)
      .maybeSingle();

    if (caravanErr || !caravan) throw new Error("Caravane introuvable");

    // 2. Check if student has a booking for this caravan
    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from("bookings")
      .select("id, status, tickets(status, checked_in_at)")
      .eq("user_id", context.userId)
      .eq("caravan_id", data.caravanId)
      .limit(1)
      .maybeSingle();

    if (bookingErr || !booking) {
      throw new Error("Vous devez avoir réservé cette caravane pour donner votre avis.");
    }

    // 3. Upsert review
    const { data: existingReview } = await supabaseAdmin
      .from("reviews")
      .select("id")
      .eq("user_id", context.userId)
      .eq("caravan_id", data.caravanId)
      .maybeSingle();

    if (existingReview) {
      const { error: upErr } = await supabaseAdmin
        .from("reviews")
        .update({
          rating: data.rating,
          comment: data.comment || null,
          status: "published",
        } as never)
        .eq("id", existingReview.id);
      if (upErr) throw new Error(upErr.message);
    } else {
      const { error: inErr } = await supabaseAdmin.from("reviews").insert({
        user_id: context.userId,
        caravan_id: data.caravanId,
        organizer_id: caravan.organizer_id,
        rating: data.rating,
        comment: data.comment || null,
        status: "published",
      } as never);
      if (inErr) throw new Error(inErr.message);
    }

    // 4. Recalculate and update organizer's rating in database
    const { data: allReviews } = await supabaseAdmin
      .from("reviews")
      .select("rating")
      .eq("organizer_id", caravan.organizer_id)
      .eq("status", "published");

    if (allReviews && allReviews.length > 0) {
      const avg =
        Math.round(
          (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length) * 10,
        ) / 10;
      await supabaseAdmin
        .from("organizers")
        .update({ rating: avg } as never)
        .eq("id", caravan.organizer_id);
    }

    return { ok: true, message: "Avis enregistré avec succès !" };
  });

export const getCaravanReviews = createServerFn({ method: "GET" })
  .validator((d: { caravanId: string }) => d)
  .handler(async ({ data }) => {
    try {
      if (!data?.caravanId) return { reviews: [], total: 0, average: 5.0 };

      const { createPublicClient } = await import("@/lib/supabase-public.server");
      const client = createPublicClient();

      // Fetch caravan to get organizer
      const { data: caravan } = await client
        .from("caravans")
        .select("id, organizer_id")
        .eq("id", data.caravanId)
        .maybeSingle();

      if (!caravan) return { reviews: [], total: 0, average: 5.0 };

      // Fetch published reviews for this organizer
      const { data: reviews } = await client
        .from("reviews")
        .select("id, rating, comment, created_at, user_id, caravan_id, caravans(from_label, to_label)")
        .eq("organizer_id", caravan.organizer_id)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(10);

      const userIds = [...new Set((reviews ?? []).map((r) => r.user_id))];
      let profiles: { id: string; full_name: string | null }[] = [];
      if (userIds.length > 0) {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const res = await supabaseAdmin.from("profiles").select("id, full_name").in("id", userIds);
          if (res.data) profiles = res.data;
        } catch (_) {}
      }

      const formatted = (reviews ?? []).map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment ?? "",
        createdAt: r.created_at,
        author: profiles?.find((p) => p.id === r.user_id)?.full_name ?? "Étudiant voyageur",
        route: r.caravans ? `${(r.caravans as any).from_label} → ${(r.caravans as any).to_label}` : "",
        isThisCaravan: r.caravan_id === data.caravanId,
      }));

      const avg =
        formatted.length > 0
          ? Math.round(
              (formatted.reduce((sum, r) => sum + r.rating, 0) / formatted.length) * 10,
            ) / 10
          : 5.0;

      return {
        reviews: formatted,
        total: formatted.length,
        average: avg,
      };
    } catch (_) {
      return { reviews: [], total: 0, average: 5.0 };
    }
  });

export const listOrganizers = createServerFn({ method: "GET" }).handler(
  async () => {
    const cached = getCached<any[]>("organizers:list");
    if (cached) return cached;

    const { createPublicClient } = await import("@/lib/supabase-public.server");
    const { data, error } = await createPublicClient()
      .from("organizers")
      .select(`
        id, name, description, logo_url, slogan, rating, status,
        caravans(id, status, is_hidden)
      `)
      .eq("status", "approved")
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);

    const result = (data ?? []).map((org: any) => {
      const activeCaravans = org.caravans?.filter((c: any) => c.status === "published" && !c.is_hidden).length || 0;
      return {
        id: org.id,
        name: org.name,
        description: org.description,
        logoUrl: org.logo_url,
        slogan: org.slogan,
        rating: org.rating,
        activeCaravansCount: activeCaravans
      };
    });
    return setCached("organizers:list", result, 5 * 60 * 1000); // 5 minutes
  }
);

export const getOrganizer = createServerFn({ method: "GET" })
  .validator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const cacheKey = `organizer:${data.id}`;
    const cached = getCached<any>(cacheKey);
    if (cached !== null && cached !== undefined) return cached;

    const { createPublicClient } = await import("@/lib/supabase-public.server");
    const { data: org, error } = await createPublicClient()
      .from("organizers")
      .select(`
        id, name, description, logo_url, slogan, support_phone, rating, status,
        caravans(
          id, from_label, to_label, departure_at, pickup, dropoff, price_fcfa,
          total_seats, seats_left, status, is_hidden, image_url, amenities, about,
          organizer_id, organizers(id, name, logo_url)
        )
      `)
      .eq("id", data.id)
      .eq("status", "approved")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!org) return setCached(cacheKey, null, 60 * 1000);

    const caravans = ((org as any).caravans ?? [])
      .filter((c: any) => c.status === "published" && !c.is_hidden)
      .map((c: any) => mapCaravan(c as never))
      .sort((a: any, b: any) => new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime());

    const result = {
      id: org.id,
      name: org.name,
      description: org.description,
      logoUrl: org.logo_url,
      slogan: org.slogan,
      supportPhone: org.support_phone,
      rating: org.rating,
      caravans,
    };
    return setCached(cacheKey, result, 5 * 60 * 1000); // 5 minutes
  });
