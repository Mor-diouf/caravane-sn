import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Publishable-key client for public (anon) reads inside server functions. */
export function createPublicClient() {
  return createClient<Database>(
    process.env["SUPABASE_URL"] || "https://szuvxthwsilzlpdqgyvx.supabase.co",
    process.env["SUPABASE_PUBLISHABLE_KEY"] || "sb_publishable_CC09O_VBnfHGp_VbUOxrVA_9fR-9KWy",
    {
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
