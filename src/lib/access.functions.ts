import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AccessInfo, AppRole } from "@/lib/dash-shared";

export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AccessInfo> => {
    const { findOrganizerId } = await import("@/lib/dash.server");
    const supabase = context.supabase;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const client = supabaseAdmin || supabase;

    const [rolesRes, profileRes] = await Promise.all([
      client.from("user_roles").select("role").eq("user_id", context.userId),
      client.from("profiles").select("full_name, email").eq("id", context.userId).maybeSingle(),
    ]);
    if (rolesRes.error) throw new Error(rolesRes.error.message);

    const roles = (rolesRes.data ?? []).map((r) => r.role as AppRole);
    const isOrganizerRole = roles.includes("organizer");
    const isAdmin = roles.includes("admin");
    const organizerId = await findOrganizerId(supabase, context.userId);

    let organizerName: string | null = null;
    let organizerStatus: string | null = null;
    let organizerIsPro = false;
    if (organizerId) {
      const { data } = await client
        .from("organizers")
        .select("name, status, is_pro")
        .eq("id", organizerId)
        .maybeSingle();
      organizerName = data?.name ?? null;
      organizerStatus = data?.status ?? null;
      organizerIsPro = Boolean(data?.is_pro);
    }

    if (isOrganizerRole || isAdmin || organizerId) {
      organizerStatus = organizerStatus || "approved";
    }

    return {
      userId: context.userId,
      roles,
      isAdmin,
      isOrganizer: isOrganizerRole || Boolean(organizerId),
      organizerId,
      organizerName: organizerName ?? "KING-BUS 2.0",
      organizerStatus,
      organizerIsPro,
      fullName: profileRes.data?.full_name ?? "",
      email: profileRes.data?.email ?? null,
    };
  });
