import SupabaseClientSingleton from "./SupabaseClientSingleton"

/**
 * Get the Supabase browser client using Singleton pattern
 * 
 * This function uses the Singleton pattern to ensure only one instance
 * of the Supabase client exists throughout the application lifecycle.
 * 
 * @returns The Supabase client instance
 */
export function getSupabaseClient() {
  const singleton = SupabaseClientSingleton.getInstance()
  return singleton.getClient()
}
