import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const organizerOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireOrganizerId, monthKey, monthLabel } = await import("@/lib/dash.server");
    const supabase = context.supabase;
    const organizerId = await requireOrganizerId(supabase, context.userId);

    const [org, caravans, reviews, payouts] = await Promise.all([
      supabase
        .from("organizers")
        .select("id, name, status, is_pro, rating, commission_rate, universities(abbr, name)")
        .eq("id", organizerId)
        .maybeSingle(),
      supabase
        .from("caravans")
        .select(
          `id, from_label, to_label, departure_at, price_fcfa, total_seats, seats_left, status,
           is_hidden, bookings(id, seats, amount_fcfa, status, created_at, user_id)`,
        )
        .eq("organizer_id", organizerId)
        .order("departure_at", { ascending: false }),
      supabase.from("reviews").select("rating, status, created_at").eq("organizer_id", organizerId),
      supabase.from("payouts").select("amount_fcfa, status").eq("organizer_id", organizerId),
    ]);
    for (const r of [org, caravans, reviews, payouts]) if (r.error) throw new Error(r.error.message);

    const list = caravans.data ?? [];
    const allBookings = list.flatMap((c) =>
      (c.bookings ?? []).map((b) => ({ ...b, caravan: c })),
    );
    const active = allBookings.filter((b) => b.status === "confirmed" || b.status === "pending");
    const revenue = active.reduce((a, b) => a + b.amount_fcfa, 0);
    const seatsTotal = list.reduce((a, c) => a + c.total_seats, 0);
    const seatsSold = list.reduce((a, c) => a + (c.total_seats - c.seats_left), 0);
    const commissionRate = Number(org.data?.commission_rate ?? 0.08);

    const byMonth = new Map<string, { revenue: number; bookings: number }>();
    for (const b of active) {
      const key = monthKey(b.created_at);
      const cur = byMonth.get(key) ?? { revenue: 0, bookings: 0 };
      cur.revenue += b.amount_fcfa;
      cur.bookings += b.seats;
      byMonth.set(key, cur);
    }
    const series = [...byMonth.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([key, v]) => ({ label: monthLabel(key), revenue: v.revenue, bookings: v.bookings }));

    const published = reviews.data?.filter((r) => r.status === "published") ?? [];
    const rating = published.length
      ? Math.round((published.reduce((a, r) => a + r.rating, 0) / published.length) * 10) / 10
      : 0;

    return {
      organizer: {
        id: organizerId,
        name: org.data?.name ?? "Mon amicale",
        status: org.data?.status ?? "pending",
        isPro: Boolean(org.data?.is_pro),
        university: org.data?.universities?.name ?? "—",
        universityAbbr: org.data?.universities?.abbr ?? "—",
        commissionRate,
      },
      kpis: {
        revenue,
        netRevenue: Math.round(revenue * (1 - commissionRate)),
        commission: Math.round(revenue * commissionRate),
        bookings: active.length,
        seatsSold,
        fillRate: seatsTotal ? Math.round((seatsSold / seatsTotal) * 100) : 0,
        upcoming: list.filter(
          (c) => c.status === "published" && new Date(c.departure_at) > new Date(),
        ).length,
        rating,
        reviews: published.length,
        pendingPayouts: (payouts.data ?? [])
          .filter((p) => p.status === "requested")
          .reduce((a, p) => a + p.amount_fcfa, 0),
      },
      series,
      caravans: list.map((c) => ({
        id: c.id,
        route: `${c.from_label} → ${c.to_label}`,
        departureAt: c.departure_at,
        price: c.price_fcfa,
        capacity: c.total_seats,
        booked: c.total_seats - c.seats_left,
        revenue: (c.bookings ?? [])
          .filter((b) => b.status === "confirmed" || b.status === "pending")
          .reduce((a, b) => a + b.amount_fcfa, 0),
        status: c.status,
        hidden: c.is_hidden,
      })),
    };
  });

export const organizerListCaravans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireOrganizerId } = await import("@/lib/dash.server");
    const supabase = context.supabase;
    const organizerId = await requireOrganizerId(supabase, context.userId);
    const { data, error } = await supabase
      .from("caravans")
      .select(
        `id, from_label, to_label, departure_at, pickup, dropoff, price_fcfa, total_seats,
         seats_left, status, is_hidden, image_url, amenities, about, university_id, created_at`,
      )
      .eq("organizer_id", organizerId)
      .order("departure_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const organizerSaveCaravan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        id: z.string().uuid().optional(),
        from_label: z.string().min(2).max(80),
        to_label: z.string().min(2).max(80),
        departure_at: z.string().min(4),
        pickup: z.string().min(2).max(160),
        dropoff: z.string().min(2).max(160),
        price_fcfa: z.number().int().min(0),
        total_seats: z.number().int().min(1).max(200),
        amenities: z.array(z.string().max(40)).max(12).default([]),
        about: z.string().max(1000).optional(),
        image_url: z.string().url().optional(),
        university_id: z.string().max(40).optional(),
        status: z.enum(["draft", "published", "full", "completed", "cancelled"]).default("draft"),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { requireOrganizerId } = await import("@/lib/dash.server");
    const supabase = context.supabase;
    const organizerId = await requireOrganizerId(supabase, context.userId);
    const { id, ...fields } = data;

    if (id) {
      const { error } = await supabase
        .from("caravans")
        .update(fields as never)
        .eq("id", id)
        .eq("organizer_id", organizerId);
      if (error) throw new Error(error.message);
      return { id };
    }

    const { data: row, error } = await supabase
      .from("caravans")
      .insert({
        ...fields,
        organizer_id: organizerId,
        seats_left: fields.total_seats,
      } as never)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { id: row?.id ?? null };
  });

export const organizerSetCaravanStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        caravanId: z.string().uuid(),
        status: z.enum(["draft", "published", "full", "completed", "cancelled"]).optional(),
        hidden: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { requireOrganizerId } = await import("@/lib/dash.server");
    const supabase = context.supabase;
    const organizerId = await requireOrganizerId(supabase, context.userId);
    const patch: Record<string, unknown> = {};
    if (data.status) patch['status'] = data.status;
    if (typeof data.hidden === "boolean") patch['is_hidden'] = data.hidden;
    const { error } = await supabase
      .from("caravans")
      .update(patch as never)
      .eq("id", data.caravanId)
      .eq("organizer_id", organizerId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const organizerListBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireOrganizerId } = await import("@/lib/dash.server");
    const supabase = context.supabase;
    const organizerId = await requireOrganizerId(supabase, context.userId);

    const caravans = await supabase
      .from("caravans")
      .select("id, from_label, to_label, departure_at")
      .eq("organizer_id", organizerId);
    if (caravans.error) throw new Error(caravans.error.message);
    const ids = (caravans.data ?? []).map((c) => c.id);
    if (!ids.length) return [];

    const [bookings, tickets] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, caravan_id, user_id, seats, amount_fcfa, reference, status, created_at")
        .in("caravan_id", ids)
        .order("created_at", { ascending: false }),
      supabase.from("tickets").select("booking_id, status, checked_in_at, qr_code"),
    ]);
    for (const r of [bookings, tickets]) if (r.error) throw new Error(r.error.message);

    const userIds = [...new Set((bookings.data ?? []).map((b) => b.user_id))];
    const profiles = userIds.length
      ? (await supabase.from("profiles").select("id, full_name, phone, email").in("id", userIds))
          .data ?? []
      : [];

    const payments = await supabase
      .from("payments")
      .select("booking_id, method, status")
      .in(
        "booking_id",
        (bookings.data ?? []).map((b) => b.id),
      );

    return (bookings.data ?? []).map((b) => {
      const caravan = caravans.data?.find((c) => c.id === b.caravan_id);
      const profile = profiles.find((p) => p.id === b.user_id);
      const ticket = tickets.data?.find((t) => t.booking_id === b.id);
      const payment = payments.data?.find((p) => p.booking_id === b.id);
      return {
        id: b.id,
        reference: b.reference,
        student: profile?.full_name || "Étudiant",
        phone: profile?.phone ?? "—",
        email: profile?.email ?? "—",
        route: caravan ? `${caravan.from_label} → ${caravan.to_label}` : "—",
        departureAt: caravan?.departure_at ?? null,
        caravanId: b.caravan_id,
        seats: b.seats,
        amount: b.amount_fcfa,
        status: b.status,
        createdAt: b.created_at,
        method: payment?.method ?? null,
        paymentStatus: payment?.status ?? "pending",
        ticketStatus: ticket?.status ?? null,
        checkedInAt: ticket?.checked_in_at ?? null,
        qrCode: ticket?.qr_code ?? null,
      };
    });
  });

export const organizerSetBookingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        bookingId: z.string().uuid(),
        status: z.enum(["pending", "confirmed", "cancelled", "refunded"]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const supabase = context.supabase;
    const { error } = await supabase
      .from("bookings")
      .update({ status: data.status } as never)
      .eq("id", data.bookingId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const organizerScanTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ code: z.string().min(3).max(80) }).parse(d))
  .handler(async ({ context, data }) => {
    const supabase = context.supabase;
    const code = data.code.trim().toUpperCase();

    const { data: ticket, error } = await supabase
      .from("tickets")
      .select(
        `id, status, checked_in_at, qr_code,
         bookings(reference, seats, status, user_id, caravans(from_label, to_label, departure_at, organizer_id))`,
      )
      .or(`qr_code.eq.${code},qr_code.ilike.%${code}%`)
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!ticket) return { result: "unknown" as const, message: "Billet introuvable" };

    const booking = ticket.bookings;
    const profile = booking?.user_id
      ? (await supabase.from("profiles").select("full_name").eq("id", booking.user_id).maybeSingle())
          .data
      : null;
    const info = {
      reference: booking?.reference ?? "—",
      student: profile?.full_name ?? "Étudiant",
      seats: booking?.seats ?? 1,
      route: booking?.caravans
        ? `${booking.caravans.from_label} → ${booking.caravans.to_label}`
        : "—",
      departureAt: booking?.caravans?.departure_at ?? null,
    };

    if (ticket.status === "used")
      return { result: "used" as const, message: "Billet déjà scanné", ...info };
    if (ticket.status === "void" || booking?.status === "cancelled" || booking?.status === "refunded")
      return { result: "void" as const, message: "Billet annulé", ...info };

    const { error: upErr } = await supabase
      .from("tickets")
      .update({
        status: "used",
        checked_in_at: new Date().toISOString(),
        checked_in_by: context.userId,
      } as never)
      .eq("id", ticket.id);
    if (upErr) throw new Error(upErr.message);

    return { result: "valid" as const, message: "Embarquement validé", ...info };
  });

export const organizerPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireOrganizerId } = await import("@/lib/dash.server");
    const supabase = context.supabase;
    const organizerId = await requireOrganizerId(supabase, context.userId);

    const [org, caravans, payouts] = await Promise.all([
      supabase.from("organizers").select("commission_rate").eq("id", organizerId).maybeSingle(),
      supabase.from("caravans").select("id, from_label, to_label").eq("organizer_id", organizerId),
      supabase
        .from("payouts")
        .select("id, amount_fcfa, method, status, requested_at, processed_at")
        .eq("organizer_id", organizerId)
        .order("requested_at", { ascending: false }),
    ]);
    for (const r of [org, caravans, payouts]) if (r.error) throw new Error(r.error.message);

    const ids = (caravans.data ?? []).map((c) => c.id);
    const bookings = ids.length
      ? (
          await supabase
            .from("bookings")
            .select("id, caravan_id, reference, amount_fcfa, status, user_id, created_at")
            .in("caravan_id", ids)
        ).data ?? []
      : [];
    const payments = bookings.length
      ? (
          await supabase
            .from("payments")
            .select("booking_id, amount_fcfa, commission_fcfa, method, status, paid_at, created_at")
            .in(
              "booking_id",
              bookings.map((b) => b.id),
            )
        ).data ?? []
      : [];
    const userIds = [...new Set(bookings.map((b) => b.user_id))];
    const profiles = userIds.length
      ? (await supabase.from("profiles").select("id, full_name").in("id", userIds)).data ?? []
      : [];

    const commissionRate = Number(org.data?.commission_rate ?? 0.08);
    const rows = payments.map((p) => {
      const booking = bookings.find((b) => b.id === p.booking_id);
      const caravan = caravans.data?.find((c) => c.id === booking?.caravan_id);
      return {
        id: p.booking_id,
        reference: booking?.reference ?? "—",
        student: profiles.find((x) => x.id === booking?.user_id)?.full_name ?? "—",
        route: caravan ? `${caravan.from_label} → ${caravan.to_label}` : "—",
        amount: p.amount_fcfa,
        commission: p.commission_fcfa,
        net: p.amount_fcfa - p.commission_fcfa,
        method: p.method,
        status: p.status,
        date: p.paid_at ?? p.created_at,
      };
    });

    const paid = rows.filter((r) => r.status === "paid");
    const byMethod = new Map<string, number>();
    for (const r of paid) byMethod.set(r.method, (byMethod.get(r.method) ?? 0) + r.amount);

    return {
      commissionRate,
      totals: {
        gross: paid.reduce((a, r) => a + r.amount, 0),
        commission: paid.reduce((a, r) => a + r.commission, 0),
        net: paid.reduce((a, r) => a + r.net, 0),
        pending: rows.filter((r) => r.status === "pending").reduce((a, r) => a + r.amount, 0),
      },
      byMethod: [...byMethod.entries()].map(([method, amount]) => ({ method, amount })),
      payments: rows.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")),
      payouts: (payouts.data ?? []).map((p) => ({
        id: p.id,
        amount: p.amount_fcfa,
        method: p.method,
        status: p.status,
        requestedAt: p.requested_at,
        processedAt: p.processed_at,
      })),
    };
  });

export const organizerRequestPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        amount: z.number().int().min(1000),
        method: z.enum(["wave", "orange", "free"]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { requireOrganizerId } = await import("@/lib/dash.server");
    const supabase = context.supabase;
    const organizerId = await requireOrganizerId(supabase, context.userId);
    const { error } = await supabase.from("payouts").insert({
      organizer_id: organizerId,
      amount_fcfa: data.amount,
      method: data.method,
      status: "requested",
    } as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const organizerHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireOrganizerId } = await import("@/lib/dash.server");
    const supabase = context.supabase;
    const organizerId = await requireOrganizerId(supabase, context.userId);

    const [caravans, reviews] = await Promise.all([
      supabase
        .from("caravans")
        .select(
          `id, from_label, to_label, departure_at, total_seats, seats_left, status,
           bookings(amount_fcfa, status)`,
        )
        .eq("organizer_id", organizerId)
        .in("status", ["completed", "cancelled"])
        .order("departure_at", { ascending: false }),
      supabase
        .from("reviews")
        .select("caravan_id, rating, status")
        .eq("organizer_id", organizerId)
        .eq("status", "published"),
    ]);
    for (const r of [caravans, reviews]) if (r.error) throw new Error(r.error.message);

    const publishedReviews = reviews.data ?? [];
    const rows = (caravans.data ?? []).map((c) => {
      const revenue = (c.bookings ?? [])
        .filter((b) => b.status === "confirmed" || b.status === "pending")
        .reduce((a, b) => a + b.amount_fcfa, 0);
      const forCaravan = publishedReviews.filter((r) => r.caravan_id === c.id);
      const rating = forCaravan.length
        ? Math.round((forCaravan.reduce((a, r) => a + r.rating, 0) / forCaravan.length) * 10) / 10
        : 0;
      return {
        id: c.id,
        route: `${c.from_label} → ${c.to_label}`,
        departureAt: c.departure_at,
        capacity: c.total_seats,
        booked: c.total_seats - c.seats_left,
        revenue,
        status: c.status as "completed" | "cancelled",
        rating,
        reviewCount: forCaravan.length,
      };
    });

    return {
      caravans: rows,
      totals: {
        count: rows.length,
        revenue: rows.reduce((a, r) => a + r.revenue, 0),
        avgRating: publishedReviews.length
          ? Math.round(
              (publishedReviews.reduce((a, r) => a + r.rating, 0) / publishedReviews.length) * 10,
            ) / 10
          : 0,
      },
    };
  });

export const organizerReputation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireOrganizerId } = await import("@/lib/dash.server");
    const supabase = context.supabase;
    const organizerId = await requireOrganizerId(supabase, context.userId);
    const { data, error } = await supabase
      .from("reviews")
      .select("id, rating, comment, status, created_at, user_id, caravans(from_label, to_label)")
      .eq("organizer_id", organizerId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = [...new Set((data ?? []).map((r) => r.user_id))];
    const profiles = ids.length
      ? (await supabase.from("profiles").select("id, full_name").in("id", ids)).data ?? []
      : [];

    const published = (data ?? []).filter((r) => r.status === "published");
    const distribution = [5, 4, 3, 2, 1].map((score) => ({
      score,
      count: published.filter((r) => r.rating === score).length,
    }));

    return {
      average: published.length
        ? Math.round((published.reduce((a, r) => a + r.rating, 0) / published.length) * 10) / 10
        : 0,
      total: published.length,
      distribution,
      reviews: (data ?? []).map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment ?? "",
        status: r.status,
        createdAt: r.created_at,
        author: profiles.find((p) => p.id === r.user_id)?.full_name ?? "Anonyme",
        trip: r.caravans ? `${r.caravans.from_label} → ${r.caravans.to_label}` : "—",
      })),
    };
  });

export const organizerTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireOrganizerId } = await import("@/lib/dash.server");
    const supabase = context.supabase;
    const organizerId = await requireOrganizerId(supabase, context.userId);

    const [org, members] = await Promise.all([
      supabase.from("organizers").select("owner_id").eq("id", organizerId).maybeSingle(),
      supabase
        .from("organizer_members")
        .select("id, user_id, role, created_at")
        .eq("organizer_id", organizerId),
    ]);
    for (const r of [org, members]) if (r.error) throw new Error(r.error.message);

    const ids = [
      ...new Set([...(members.data ?? []).map((m) => m.user_id), org.data?.owner_id].filter(Boolean)),
    ] as string[];
    const profiles = ids.length
      ? (await supabase.from("profiles").select("id, full_name, email, phone").in("id", ids)).data ??
        []
      : [];

    const rows = (members.data ?? []).map((m) => {
      const p = profiles.find((x) => x.id === m.user_id);
      return {
        id: m.id,
        userId: m.user_id,
        name: p?.full_name || "Membre",
        email: p?.email ?? "—",
        role: m.role as string,
        createdAt: m.created_at,
      };
    });

    if (org.data?.owner_id) {
      const p = profiles.find((x) => x.id === org.data!.owner_id);
      rows.unshift({
        id: "owner",
        userId: org.data.owner_id,
        name: p?.full_name || "Propriétaire",
        email: p?.email ?? "—",
        role: "owner",
        createdAt: "",
      });
    }
    return rows;
  });

export const organizerAddMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        email: z.string().email(),
        role: z.enum(["manager", "finance", "scanner", "support"]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { requireOrganizerId } = await import("@/lib/dash.server");
    const supabase = context.supabase;
    const organizerId = await requireOrganizerId(supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();
    if (!profile) throw new Error("Aucun compte CaravaneHub avec cet e-mail");

    const { error } = await supabase.from("organizer_members").insert({
      organizer_id: organizerId,
      user_id: profile.id,
      role: data.role,
    } as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const organizerRemoveMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ memberId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { requireOrganizerId } = await import("@/lib/dash.server");
    const supabase = context.supabase;
    const organizerId = await requireOrganizerId(supabase, context.userId);
    const { error } = await supabase
      .from("organizer_members")
      .delete()
      .eq("id", data.memberId)
      .eq("organizer_id", organizerId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const organizerSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireOrganizerId } = await import("@/lib/dash.server");
    const supabase = context.supabase;
    const organizerId = await requireOrganizerId(supabase, context.userId);
    const { data, error } = await supabase
      .from("organizers")
      .select("*")
      .eq("id", organizerId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const organizerUpdateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        name: z.string().min(2).max(120).optional(),
        description: z.string().max(1000).optional(),
        phone: z.string().max(40).optional(),
        whatsapp: z.string().max(40).optional(),
        university_id: z.string().max(40).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { requireOrganizerId } = await import("@/lib/dash.server");
    const supabase = context.supabase;
    const organizerId = await requireOrganizerId(supabase, context.userId);
    const { data: row, error } = await supabase
      .from("organizers")
      .update(data as never)
      .eq("id", organizerId)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const organizerCreateSpace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        name: z.string().min(2).max(120),
        description: z.string().max(1000).optional(),
        phone: z.string().max(40).optional(),
        whatsapp: z.string().max(40).optional(),
        university_id: z.string().max(40).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { findOrganizerId } = await import("@/lib/dash.server");
    const supabase = context.supabase;
    const existing = await findOrganizerId(supabase, context.userId);
    if (existing) return { id: existing };
    const { data: row, error } = await supabase
      .from("organizers")
      .insert({ ...data, owner_id: context.userId, status: "pending" } as never)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { id: row?.id ?? null };
  });
