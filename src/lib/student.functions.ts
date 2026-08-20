import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  CARAVAN_SELECT,
  mapCaravan,
  type CaravanView,
  type UniversityRow,
} from "@/lib/student-shared";

export const listUniversities = createServerFn({ method: "GET" }).handler(
  async (): Promise<UniversityRow[]> => {
    const { createPublicClient } = await import("@/lib/supabase-public.server");
    const { data, error } = await createPublicClient()
      .from("universities")
      .select("id, abbr, name, city")
      .order("abbr");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
);

export const listCaravans = createServerFn({ method: "GET" }).handler(
  async (): Promise<CaravanView[]> => {
    const { createPublicClient } = await import("@/lib/supabase-public.server");
    const { data, error } = await createPublicClient()
      .from("caravans")
      .select(CARAVAN_SELECT)
      .eq("status", "published")
      .eq("is_hidden", false)
      .order("departure_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => mapCaravan(row as never));
  },
);

export const getCaravan = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }): Promise<CaravanView | null> => {
    const { createPublicClient } = await import("@/lib/supabase-public.server");
    const { data: row, error } = await createPublicClient()
      .from("caravans")
      .select(CARAVAN_SELECT)
      .eq("id", data.id)
      .eq("status", "published")
      .eq("is_hidden", false)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? mapCaravan(row as never) : null;
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
  .inputValidator((data) =>
    z
      .object({
        full_name: z.string().min(1).max(120).optional(),
        phone: z.string().max(40).nullable().optional(),
        email: z.string().email().nullable().optional(),
        student_id: z.string().max(60).nullable().optional(),
        university_id: z.string().max(40).nullable().optional(),
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
  .inputValidator((data) =>
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
        `id, seats, amount_fcfa, reference, status, created_at,
         caravans(${CARAVAN_SELECT}),
         tickets(id, qr_code, status, checked_in_at),
         payments(method, status, amount_fcfa, paid_at)`,
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((b) => ({
      id: b.id,
      seats: b.seats,
      amount: b.amount_fcfa,
      reference: b.reference,
      status: b.status,
      createdAt: b.created_at,
      caravan: b.caravans ? mapCaravan(b.caravans as never) : null,
      ticket: (b.tickets ?? [])[0] ?? null,
      payment: (b.payments ?? [])[0] ?? null,
    }));
  });

export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        caravanId: z.string().uuid(),
        seats: z.number().int().min(1).max(6),
        method: z.enum(["wave", "orange", "free"]),
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
      qr_code: reference,
      status: "valid",
    });
    if (ticketError) throw new Error(ticketError.message);

    return { bookingId: booking.id, reference: booking.reference };
  });
