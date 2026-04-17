"use client";

import { createBrowserClient } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";

let client: SupabaseClient | null = null;

export function createSupabaseBrowserClient(): SupabaseClient | null {
  if (client) {
    return client;
  }

  const config = getSupabaseConfig();
  if (!config) {
    return null;
  }

  client = createBrowserClient(config.url, config.anonKey);
  return client;
}
