// ============================================================================
// Compatibility adapter: Re-exports Supabase from src/lib/supabase.ts
// ============================================================================

export {
  supabase,
  isSupabaseConfigured,
  checkSupabaseConnection,
} from "@/lib/supabase";
export type { SupabaseHealthCheckResult } from "@/lib/supabase";
