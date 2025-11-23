import SupabaseServerSingleton from "./SupabaseServerSingleton"

/**
 * Get the Supabase server client using Singleton pattern
 * 
 * This function uses the Singleton pattern to ensure efficient resource usage
 * and prevent unnecessary client instantiations in server-side code.
 * 
 * @param contextId Optional context identifier for request-specific instances
 * @returns The Supabase server client instance
 */
export async function getSupabaseServer(contextId?: string) {
  const singleton = SupabaseServerSingleton.getInstance()
  return await singleton.getClient(contextId)
}
