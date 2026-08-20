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

/** Organisateur dont l'utilisateur est propriétaire, sinon membre d'équipe. */
export async function findOrganizerId(supabase: Client, userId: string) {
  const owned = await supabase
    .from("organizers")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();
  if (owned.error) throw new Error(owned.error.message);
  if (owned.data) return owned.data.id;

  const member = await supabase
    .from("organizer_members")
    .select("organizer_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (member.error) throw new Error(member.error.message);
  return member.data?.organizer_id ?? null;
}

export async function requireOrganizerId(supabase: Client, userId: string) {
  const id = await findOrganizerId(supabase, userId);
  if (!id) throw new Error("Aucun espace organisateur associé à ce compte");
  return id;
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
