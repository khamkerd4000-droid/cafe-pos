// ============================================================================
// Supabase Client & Connection Engine - QuickOne Cafe POS
// 100% Real Supabase - Zero Mock Data
// ============================================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("placeholder") &&
    !supabaseAnonKey.includes("placeholder")
);

// Fallback dummy URL to prevent createClient crashing during build time if env missing
const clientUrl = isSupabaseConfigured ? supabaseUrl : "https://placeholder-pos.supabase.co";
const clientKey = isSupabaseConfigured ? supabaseAnonKey : "placeholder-anon-key";

export const supabase: SupabaseClient = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export interface SupabaseHealthCheckResult {
  isConfigured: boolean;
  connected: boolean;
  hasTables: boolean;
  shopSettings?: any;
  error?: string;
}

/**
 * Validates connection to Supabase and verifies if the cafe tables exist in the schema.
 */
export async function checkSupabaseConnection(): Promise<SupabaseHealthCheckResult> {
  if (!isSupabaseConfigured) {
    return {
      isConfigured: false,
      connected: false,
      hasTables: false,
      error: "NEXT_PUBLIC_SUPABASE_URL ຫຼື NEXT_PUBLIC_SUPABASE_ANON_KEY ຍັງບໍ່ໄດ້ກຳນົດຄ່າ",
    };
  }

  try {
    const { data, error, status } = await supabase
      .from("shop_settings")
      .select("*")
      .limit(1);

    if (error) {
      // PGRST205 indicates the table doesn't exist in Supabase schema cache
      if (error.code === "PGRST205" || error.message.includes("Could not find the table")) {
        return {
          isConfigured: true,
          connected: true,
          hasTables: false,
          error: "ເຊື່ອມຕໍ່ Supabase ສຳເລັດແລ້ວ ແຕ່ຍັງບໍ່ມີຕາຕະລາງ 'shop_settings'. ກະລຸນາ Run ໄຟລ໌ supabase/schema_cafe.sql ໃນ SQL Editor.",
        };
      }

      return {
        isConfigured: true,
        connected: false,
        hasTables: false,
        error: error.message,
      };
    }

    return {
      isConfigured: true,
      connected: true,
      hasTables: true,
      shopSettings: data && data.length > 0 ? data[0] : null,
    };
  } catch (err: any) {
    return {
      isConfigured: true,
      connected: false,
      hasTables: false,
      error: err?.message || "ບໍ່ສາມາດເຊື່ອມຕໍ່ກັບ Supabase ໄດ້",
    };
  }
}
