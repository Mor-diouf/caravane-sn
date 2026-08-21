import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin, monthKey, monthLabel } = await import("@/lib/dash.server");
    const supabase = context.supabase;
    await assertAdmin(supabase, context.userId);

    const [payments, bookings, profiles, organizers, caravans, disputes, payouts, auditLogs] =
      await Promise.all([
        supabase.from("payments").select("amount_fcfa, commission_fcfa, status, paid_at, created_at"),
        supabase.from("bookings").select("id, seats, amount_fcfa, status, created_at"),
        supabase.from("profiles").select("id, created_at, is_blocked"),
        supabase.from("organizers").select("id, name, status, is_pro, created_at"),
        supabase
          .from("caravans")
          .select("id, status, is_hidden, total_seats, seats_left, departure_at, from_label, to_label"),
        supabase
          .from("disputes")
          .select("id, subject, status, created_at, amount_refunded_fcfa, booking_id, resolution")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("payouts")
          .select("id, amount_fcfa, status, requested_at, organizer_id, method, organizers(name)")
          .order("requested_at", { ascending: false })
          .limit(10),
        supabase
          .from("audit_log")
          .select("id, action, entity, entity_id, actor_id, created_at, meta")
          .order("created_at", { ascending: false })
          .limit(12),
      ]);

    for (const r of [payments, bookings, profiles, organizers, caravans, disputes, payouts, auditLogs]) {
      if (r.error) throw new Error(r.error.message);
    }

    const paid = (payments.data ?? []).filter((p) => p.status === "paid");
    const gmv = paid.reduce((a, p) => a + p.amount_fcfa, 0);
    const commission = paid.reduce((a, p) => a + p.commission_fcfa, 0);

    const seatsTotal = (caravans.data ?? []).reduce((a, c) => a + c.total_seats, 0);
    const seatsSold = (caravans.data ?? []).reduce((a, c) => a + (c.total_seats - c.seats_left), 0);

    const byMonth = new Map<string, { gmv: number; commission: number }>();
    for (const p of paid) {
      const key = monthKey(p.paid_at ?? p.created_at);
      const cur = byMonth.get(key) ?? { gmv: 0, commission: 0 };
      cur.gmv += p.amount_fcfa;
      cur.commission += p.commission_fcfa;
      byMonth.set(key, cur);
    }
    const growth = [...byMonth.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([key, v]) => ({ month: monthLabel(key), gmv: v.gmv, commission: v.commission }));

    const actionLabels: Record<string, { title: string; tone: "success" | "warning" | "info" | "danger" }> = {
      caravan_created: { title: "Caravane créée", tone: "success" },
      caravan_published: { title: "Caravane publiée", tone: "success" },
      caravan_cancelled: { title: "Caravane annulée", tone: "danger" },
      booking_confirmed: { title: "Réservation confirmée", tone: "success" },
      booking_cancelled: { title: "Réservation annulée", tone: "warning" },
      payment_paid: { title: "Paiement encaissé", tone: "success" },
      payment_refunded: { title: "Remboursement effectué", tone: "warning" },
      organizer_approved: { title: "Organisateur approuvé", tone: "success" },
      organizer_rejected: { title: "Organisateur rejeté", tone: "danger" },
      payout_requested: { title: "Retrait demandé", tone: "info" },
      payout_paid: { title: "Retrait versé", tone: "success" },
      ticket_scanned: { title: "Billet scanné", tone: "info" },
      dispute_opened: { title: "Litige ouvert", tone: "danger" },
      dispute_resolved: { title: "Litige résolu", tone: "success" },
    };

    const activity = (auditLogs.data ?? []).map((log) => {
      const label = actionLabels[log.action] ?? { title: log.action, tone: "info" as const };
      const meta = (log.meta as Record<string, string | number> | null) ?? {};
      const detail = (meta["name"] ?? meta["reference"] ?? meta["subject"] ?? log.entity_id ?? "") as string;
      return {
        id: log.id,
        title: label.title,
        detail: String(detail),
        tone: label.tone,
        time: new Date(log.created_at).toLocaleString("fr-FR", {
          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
        }),
      };
    });

    return {
      kpis: {
        gmv,
        commission,
        students: (profiles.data ?? []).length,
        blocked: (profiles.data ?? []).filter((p) => p.is_blocked).length,
        organizers: (organizers.data ?? []).length,
        pendingOrganizers: (organizers.data ?? []).filter((o) => o.status === "pending").length,
        caravans: (caravans.data ?? []).length,
        activeCaravans: (caravans.data ?? []).filter(
          (c) => c.status === "published" && !c.is_hidden,
        ).length,
        bookings: (bookings.data ?? []).length,
        fillRate: seatsTotal ? Math.round((seatsSold / seatsTotal) * 100) : 0,
        disputes: (disputes.data ?? []).filter((d) => d.status !== "resolved" && d.status !== "rejected")
          .length,
        pendingPayouts: (payouts.data ?? []).filter((p) => p.status === "requested").length,
        pendingPayoutAmount: (payouts.data ?? [])
          .filter((p) => p.status === "requested")
          .reduce((a, p) => a + p.amount_fcfa, 0),
      },
      growth,
      pending: (organizers.data ?? [])
        .filter((o) => o.status === "pending")
        .map((o) => ({ id: o.id, name: o.name, createdAt: o.created_at })),
      recentDisputes: (disputes.data ?? []).map((d) => ({
        id: d.id.substring(0, 8).toUpperCase(),
        subject: d.subject ?? "Litige",
        status: d.status as "open" | "review" | "resolved" | "rejected",
        amount: d.amount_refunded_fcfa ?? 0,
        createdAt: d.created_at,
      })),
      recentPayouts: (payouts.data ?? []).map((p) => ({
        id: p.id,
        organizer: (p.organizers as { name: string } | null)?.name ?? "Organisateur",
        amount: p.amount_fcfa,
        method: p.method ?? "wave",
        status: p.status as "requested" | "processing" | "paid",
        requestedAt: p.requested_at,
      })),
      activity,
    };
  });


export const adminListOrganizers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/dash.server");
    await assertAdmin(context.supabase, context.userId);

    const { data, error } = await context.supabase
      .from("organizers")
      .select(
        `id, name, description, phone, whatsapp, status, is_pro, rating, commission_rate,
         documents, created_at, verified_at, owner_id,
         universities(abbr, name),
         caravans(id, price_fcfa, total_seats, seats_left)`,
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const ownerIds = (data ?? []).map((o) => o.owner_id).filter(Boolean) as string[];
    const owners = ownerIds.length
      ? (
          await context.supabase
            .from("profiles")
            .select("id, full_name, email, phone")
            .in("id", ownerIds)
        ).data ?? []
      : [];

    return (data ?? []).map((o) => {
      const owner = owners.find((p) => p.id === o.owner_id) ?? null;
      const caravans = o.caravans ?? [];
      return {
        id: o.id,
        name: o.name,
        status: o.status,
        isPro: o.is_pro,
        rating: Number(o.rating ?? 0),
        commissionRate: Number(o.commission_rate ?? 0),
        documents: (o.documents ?? {}) as Record<string, string>,
        createdAt: o.created_at,
        verifiedAt: o.verified_at,
        university: o.universities?.name ?? "—",
        universityAbbr: o.universities?.abbr ?? "—",
        contact: owner?.full_name ?? "—",
        email: owner?.email ?? "—",
        phone: o.phone ?? owner?.phone ?? "—",
        caravans: caravans.length,
        revenue: caravans.reduce(
          (a, c) => a + c.price_fcfa * (c.total_seats - c.seats_left),
          0,
        ),
      };
    });
  });

export const adminSetOrganizerStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        organizerId: z.string().uuid(),
        status: z.enum(["pending", "approved", "suspended", "rejected"]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("@/lib/dash.server");
    const supabase = context.supabase;
    await assertAdmin(supabase, context.userId);

    const patch: Record<string, unknown> = { status: data.status };
    if (data.status === "approved") {
      patch['verified_at'] = new Date().toISOString();
      patch['verified_by'] = context.userId;
    }
    const { data: org, error } = await supabase
      .from("organizers")
      .update(patch as never)
      .eq("id", data.organizerId)
      .select("id, owner_id, name")
      .maybeSingle();
    if (error) throw new Error(error.message);

    // Le statut d'organisateur suit la validation du dossier.
    if (org?.owner_id) {
      if (data.status === "approved") {
        await supabase
          .from("user_roles")
          .upsert({ user_id: org.owner_id, role: "organizer", granted_by: context.userId } as never, {
            onConflict: "user_id,role",
          });
      } else {
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", org.owner_id)
          .eq("role", "organizer");
      }
    }

    await supabase.from("audit_log").insert({
      actor_id: context.userId,
      action: `organizer.${data.status}`,
      entity: "organizers",
      entity_id: data.organizerId,
      meta: { name: org?.name ?? null },
    } as never);

    return { ok: true };
  });

export const adminSetOrganizerPro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ organizerId: z.string().uuid(), isPro: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("@/lib/dash.server");
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("organizers")
      .update({ is_pro: data.isPro } as never)
      .eq("id", data.organizerId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/dash.server");
    const supabase = context.supabase;
    await assertAdmin(supabase, context.userId);

    const [profiles, roles, bookings] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, phone, is_blocked, created_at, universities(abbr)")
        .order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("bookings").select("user_id, seats, amount_fcfa, status"),
    ]);
    for (const r of [profiles, roles, bookings]) if (r.error) throw new Error(r.error.message);

    return (profiles.data ?? []).map((p) => {
      const userRoles = (roles.data ?? []).filter((r) => r.user_id === p.id).map((r) => r.role);
      const mine = (bookings.data ?? []).filter(
        (b) => b.user_id === p.id && (b.status === "confirmed" || b.status === "pending"),
      );
      const role = userRoles.includes("admin")
        ? "admin"
        : userRoles.includes("organizer")
          ? "organizer"
          : "student";
      return {
        id: p.id,
        name: p.full_name || "Sans nom",
        email: p.email ?? "—",
        phone: p.phone ?? "—",
        university: p.universities?.abbr ?? "—",
        role: role as "student" | "organizer" | "admin",
        trips: mine.length,
        spent: mine.reduce((a, b) => a + b.amount_fcfa, 0),
        joined: p.created_at,
        blocked: p.is_blocked,
      };
    });
  });

export const adminSetUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(["student", "organizer", "admin"]),
        grant: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("@/lib/dash.server");
    const supabase = context.supabase;
    await assertAdmin(supabase, context.userId);

    if (data.grant) {
      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: data.userId, role: data.role, granted_by: context.userId } as never, {
          onConflict: "user_id,role",
        });
      if (error) throw new Error(error.message);
    } else {
      if (data.role === "admin" && data.userId === context.userId)
        throw new Error("Vous ne pouvez pas retirer votre propre statut d'administrateur");
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }

    await supabase.from("audit_log").insert({
      actor_id: context.userId,
      action: data.grant ? `role.grant.${data.role}` : `role.revoke.${data.role}`,
      entity: "user_roles",
      entity_id: data.userId,
      meta: {},
    } as never);

    return { ok: true };
  });

export const adminSetUserBlocked = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ userId: z.string().uuid(), blocked: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("@/lib/dash.server");
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("profiles")
      .update({ is_blocked: data.blocked } as never)
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListCaravans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/dash.server");
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("caravans")
      .select(
        `id, from_label, to_label, departure_at, price_fcfa, total_seats, seats_left, status,
         is_hidden, created_at, organizers(id, name), universities(abbr)`,
      )
      .order("departure_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((c) => ({
      id: c.id,
      route: `${c.from_label} → ${c.to_label}`,
      departureAt: c.departure_at,
      price: c.price_fcfa,
      capacity: c.total_seats,
      booked: c.total_seats - c.seats_left,
      revenue: c.price_fcfa * (c.total_seats - c.seats_left),
      status: c.status,
      hidden: c.is_hidden,
      organizer: c.organizers?.name ?? "—",
      organizerId: c.organizers?.id ?? null,
      university: c.universities?.abbr ?? "—",
    }));
  });

export const adminSetCaravanHidden = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ caravanId: z.string().uuid(), hidden: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("@/lib/dash.server");
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("caravans")
      .update({ is_hidden: data.hidden } as never)
      .eq("id", data.caravanId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminFinance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/dash.server");
    const supabase = context.supabase;
    await assertAdmin(supabase, context.userId);

    const [payments, payouts, caravans] = await Promise.all([
      supabase
        .from("payments")
        .select(
          `id, amount_fcfa, commission_fcfa, method, status, paid_at, created_at, user_id,
           bookings(reference, caravans(from_label, to_label, organizers(name), universities(abbr)))`,
        )
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("payouts")
        .select("id, amount_fcfa, method, status, requested_at, processed_at, organizers(name)")
        .order("requested_at", { ascending: false }),
      supabase
        .from("caravans")
        .select("price_fcfa, total_seats, seats_left, universities(abbr)"),
    ]);
    for (const r of [payments, payouts, caravans]) if (r.error) throw new Error(r.error.message);

    const students = (payments.data ?? []).map((p) => p.user_id);
    const profiles = students.length
      ? (await supabase.from("profiles").select("id, full_name").in("id", students)).data ?? []
      : [];

    const split = new Map<string, number>();
    for (const c of caravans.data ?? []) {
      const key = c.universities?.abbr ?? "Autres";
      split.set(key, (split.get(key) ?? 0) + c.price_fcfa * (c.total_seats - c.seats_left));
    }
    const totalSplit = [...split.values()].reduce((a, b) => a + b, 0) || 1;

    return {
      payments: (payments.data ?? []).map((p) => ({
        id: p.id,
        reference: p.bookings?.reference ?? "—",
        student: profiles.find((x) => x.id === p.user_id)?.full_name ?? "—",
        organizer: p.bookings?.caravans?.organizers?.name ?? "—",
        route: p.bookings?.caravans
          ? `${p.bookings.caravans.from_label} → ${p.bookings.caravans.to_label}`
          : "—",
        amount: p.amount_fcfa,
        commission: p.commission_fcfa,
        method: p.method,
        status: p.status,
        date: p.paid_at ?? p.created_at,
      })),
      payouts: (payouts.data ?? []).map((p) => ({
        id: p.id,
        organizer: p.organizers?.name ?? "—",
        amount: p.amount_fcfa,
        method: p.method,
        status: p.status,
        requestedAt: p.requested_at,
        processedAt: p.processed_at,
      })),
      universitySplit: [...split.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name, revenue]) => ({
          name,
          revenue,
          value: Math.round((revenue / totalSplit) * 100),
        })),
    };
  });

export const adminSetPayoutStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        payoutId: z.string().uuid(),
        status: z.enum(["requested", "approved", "paid", "rejected"]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("@/lib/dash.server");
    await assertAdmin(context.supabase, context.userId);
    const patch: Record<string, unknown> = { status: data.status, processed_by: context.userId };
    if (data.status === "paid" || data.status === "rejected")
      patch['processed_at'] = new Date().toISOString();
    const { error } = await context.supabase
      .from("payouts")
      .update(patch as never)
      .eq("id", data.payoutId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/dash.server");
    const supabase = context.supabase;
    await assertAdmin(supabase, context.userId);
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `id, rating, comment, status, reported_reason, created_at, user_id, organizers(name)`,
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (data ?? []).map((r) => r.user_id);
    const profiles = ids.length
      ? (await supabase.from("profiles").select("id, full_name").in("id", ids)).data ?? []
      : [];
    return (data ?? []).map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment ?? "",
      status: r.status,
      reason: r.reported_reason ?? "—",
      createdAt: r.created_at,
      author: profiles.find((p) => p.id === r.user_id)?.full_name ?? "Anonyme",
      organizer: r.organizers?.name ?? "—",
    }));
  });

export const adminSetReviewStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        reviewId: z.string().uuid(),
        status: z.enum(["published", "reported", "hidden"]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("@/lib/dash.server");
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("reviews")
      .update({ status: data.status } as never)
      .eq("id", data.reviewId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListDisputes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/dash.server");
    const supabase = context.supabase;
    await assertAdmin(supabase, context.userId);
    const { data, error } = await supabase
      .from("disputes")
      .select(
        `id, subject, description, status, resolution, amount_refunded_fcfa, created_at,
         resolved_at, opened_by, organizers(name), bookings(reference, amount_fcfa)`,
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (data ?? []).map((d) => d.opened_by);
    const profiles = ids.length
      ? (await supabase.from("profiles").select("id, full_name").in("id", ids)).data ?? []
      : [];
    return (data ?? []).map((d) => ({
      id: d.id,
      subject: d.subject,
      description: d.description ?? "",
      status: d.status,
      resolution: d.resolution ?? null,
      refunded: d.amount_refunded_fcfa,
      createdAt: d.created_at,
      resolvedAt: d.resolved_at,
      student: profiles.find((p) => p.id === d.opened_by)?.full_name ?? "—",
      organizer: d.organizers?.name ?? "—",
      reference: d.bookings?.reference ?? "—",
      amount: d.bookings?.amount_fcfa ?? 0,
    }));
  });

export const adminResolveDispute = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        disputeId: z.string().uuid(),
        status: z.enum(["open", "investigating", "resolved", "rejected"]),
        resolution: z.string().max(500).optional(),
        refund: z.number().int().min(0).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("@/lib/dash.server");
    await assertAdmin(context.supabase, context.userId);
    const patch: Record<string, unknown> = { status: data.status };
    if (data.resolution) patch['resolution'] = data.resolution;
    if (typeof data.refund === "number") patch['amount_refunded_fcfa'] = data.refund;
    if (data.status === "resolved" || data.status === "rejected") {
      patch['resolved_at'] = new Date().toISOString();
      patch['resolved_by'] = context.userId;
    }
    const { error } = await context.supabase
      .from("disputes")
      .update(patch as never)
      .eq("id", data.disputeId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminGetSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/dash.server");
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("platform_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const adminUpdateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        commission_rate: z.number().min(0).max(1).optional(),
        wave_enabled: z.boolean().optional(),
        orange_enabled: z.boolean().optional(),
        free_enabled: z.boolean().optional(),
        auto_approve_organizers: z.boolean().optional(),
        min_payout_fcfa: z.number().int().min(0).optional(),
        support_phone: z.string().max(40).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("@/lib/dash.server");
    const supabase = context.supabase;
    await assertAdmin(supabase, context.userId);
    const { data: row, error } = await supabase
      .from("platform_settings")
      .update(data as never)
      .eq("id", true)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/dash.server");
    const supabase = context.supabase;
    await assertAdmin(supabase, context.userId);

    const { data, error } = await supabase
      .from("caravans")
      .select("to_label, price_fcfa, total_seats, seats_left, universities(abbr, name)");
    if (error) throw new Error(error.message);

    const dest = new Map<string, { bookings: number; revenue: number; seats: number; sold: number }>();
    const uni = new Map<string, { revenue: number; caravans: number }>();
    for (const c of data ?? []) {
      const sold = c.total_seats - c.seats_left;
      const d = dest.get(c.to_label) ?? { bookings: 0, revenue: 0, seats: 0, sold: 0 };
      d.bookings += sold;
      d.revenue += sold * c.price_fcfa;
      d.seats += c.total_seats;
      d.sold += sold;
      dest.set(c.to_label, d);

      const key = c.universities?.abbr ?? "Autres";
      const u = uni.get(key) ?? { revenue: 0, caravans: 0 };
      u.revenue += sold * c.price_fcfa;
      u.caravans += 1;
      uni.set(key, u);
    }

    return {
      destinations: [...dest.entries()]
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .map(([name, v]) => ({
          name,
          bookings: v.bookings,
          revenue: v.revenue,
          fillRate: v.seats ? Math.round((v.sold / v.seats) * 100) : 0,
        })),
      universities: [...uni.entries()]
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .map(([name, v]) => ({ name, revenue: v.revenue, caravans: v.caravans })),
    };
  });
