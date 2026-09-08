import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

let _publicClient: SupabaseClient<Database> | null = null;

/** Publishable-key client for public (anon) reads inside server functions. */
export function createPublicClient() {
  if (_publicClient) return _publicClient;

  const url =
    process.env["SUPABASE_URL"] ||
    process.env["VITE_SUPABASE_URL"] ||
    "https://bgywpaicfbtpnxxjwfpu.supabase.co";

  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ||
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
    process.env["SUPABASE_ANON_KEY"] ||
    "sb_publishable_bCKoq7mskDyyreEBZEIVZQ_P8821EG1";

  _publicClient = createClient<Database>(url, key, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return _publicClient;
}
