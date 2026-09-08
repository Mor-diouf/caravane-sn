import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Client = SupabaseClient<Database>;

export async function isAdmin(supabase: Client, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function assertAdmin(supabase: Client, userId: string) {
  if (!(await isAdmin(supabase, userId))) throw new Error("Accès réservé aux administrateurs");
}

/** Organisateur dont l'utilisateur est propriétaire, sinon membre d'équipe, ou organisateur approuvé partagé si rôle organisateur/admin. */
export async function findOrganizerId(supabase: Client, userId: string) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const client = (supabaseAdmin || supabase) as Client;

    const owned = await client
      .from("organizers")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();
    if (owned.data?.id) {
      try {
        await client.from("organizer_members").upsert(
          { organizer_id: owned.data.id, user_id: userId, role: "manager" } as never,
          { onConflict: "organizer_id,user_id" },
        );
      } catch (_) {}
      return owned.data.id;
    }

    const member = await client
      .from("organizer_members")
      .select("organizer_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (member.data?.organizer_id) return member.data.organizer_id;

    // Fallback : Si l'utilisateur possède le rôle 'organizer' ou 'admin', le rattacher à l'organisateur approuvé partagé
    const { data: rolesData } = await client
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles = (rolesData ?? []).map((r) => r.role);

    if (roles.includes("organizer") || roles.includes("admin")) {
      const { data: sharedOrg } = await client
        .from("organizers")
        .select("id")
        .eq("status", "approved")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (sharedOrg?.id) {
        try {
          await client.from("organizer_members").upsert(
            { organizer_id: sharedOrg.id, user_id: userId, role: "manager" } as never,
            { onConflict: "organizer_id,user_id" },
          );
        } catch (_) {}
        return sharedOrg.id;
      }

      // Fallback si aucun n'est marqué 'approved'
      const { data: anyOrg } = await client
        .from("organizers")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (anyOrg?.id) {
        try {
          await client.from("organizer_members").upsert(
            { organizer_id: anyOrg.id, user_id: userId, role: "manager" } as never,
            { onConflict: "organizer_id,user_id" },
          );
        } catch (_) {}
        return anyOrg.id;
      }

      // Auto-création de l'espace KING-BUS 2.0 par défaut si la table était vide
      const { data: createdOrg } = await client
        .from("organizers")
        .insert({
          name: "KING-BUS 2.0",
          description: "Plateforme officielle de transport interurbain.",
          phone: "+221 78 188 01 02",
          whatsapp: "221781880102",
          status: "approved",
          is_pro: true,
          rating: 5.0,
          commission_rate: 0.00,
        } as never)
        .select("id")
        .single();

      if (createdOrg?.id) {
        try {
          await client.from("organizer_members").upsert(
            { organizer_id: createdOrg.id, user_id: userId, role: "manager" } as never,
            { onConflict: "organizer_id,user_id" },
          );
        } catch (_) {}
        return createdOrg.id;
      }
    }
  } catch (err) {
    console.error("[findOrganizerId] Error resolving organizer ID:", err);
  }

  return null;
}

export async function requireOrganizerId(supabase: Client, userId: string) {
  const orgId = await findOrganizerId(supabase, userId);
  if (!orgId) {
    throw new Error("Aucun espace organisateur associé à ce compte");
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const client = (supabaseAdmin || supabase) as Client;

  const { data: org } = await client
    .from("organizers")
    .select("status")
    .eq("id", orgId)
    .maybeSingle();

  if (org && org.status && org.status !== "approved") {
    // Check if user is granted organizer/admin role by admin
    const { data: rolesData } = await client
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles = (rolesData ?? []).map((r) => r.role);
    if (!roles.includes("organizer") && !roles.includes("admin")) {
      throw new Error("Votre espace organisateur n'a pas encore été validé par l'administration.");
    }
  }

  return orgId;
}

export function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("fr-FR", {
    month: "short",
    year: "2-digit",
  });
}
