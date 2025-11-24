import { createServerClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

/**
 * Singleton Pattern Implementation for Supabase Server Client
 * 
 * Ensures only one instance of the Supabase server client exists per request context.
 * This prevents multiple client initializations and maintains efficient resource usage.
 * 
 * Note: In Next.js server components, each request may need a fresh client due to cookie handling,
 * but the Singleton pattern ensures we don't create unnecessary instances within the same context.
 */
class SupabaseServerSingleton {
  private static instance: SupabaseServerSingleton | null = null
  private client: SupabaseClient | null = null
  private isInitialized: boolean = false
  private initializationContext: string | null = null

  /**
   * Private constructor to prevent direct instantiation
   * This enforces the Singleton pattern by making the constructor inaccessible
   */
  private constructor() {
    // Private constructor prevents external instantiation
  }

  /**
   * Get the single instance of SupabaseServerSingleton
   * This is the only way to access the Singleton instance
   * 
   * @returns The single instance of SupabaseServerSingleton
   */
  public static getInstance(): SupabaseServerSingleton {
    if (SupabaseServerSingleton.instance === null) {
      SupabaseServerSingleton.instance = new SupabaseServerSingleton()
    }
    return SupabaseServerSingleton.instance
  }

  /**
   * Initialize the Supabase server client if not already initialized
   * This method ensures lazy initialization - client is only created when needed
   * 
   * @param contextId Optional context identifier for request-specific instances
   * @returns The Supabase server client instance
   * @throws Error if environment variables are missing or invalid
   */
  public async getClient(contextId?: string): Promise<SupabaseClient> {
    // For server components, we may need a new client per request due to cookies
    // But we still use Singleton to avoid creating multiple instances unnecessarily
    const shouldReinitialize = contextId && this.initializationContext !== contextId

    if (!this.isInitialized || this.client === null || shouldReinitialize) {
      const cookieStore = await cookies()

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!url || !anonKey) {
        throw new Error(
          "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
        )
      }

      try {
        // eslint-disable-next-line no-new
        new URL(url)
      } catch {
        throw new Error("Invalid NEXT_PUBLIC_SUPABASE_URL: Must be a valid http(s) URL")
      }

      this.client = createServerClient(url, anonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {
              // Handle cookie setting errors silently
            }
          },
        },
      })

      this.isInitialized = true
      if (contextId) {
        this.initializationContext = contextId
      }
    }

    return this.client
  }

  /**
   * Reset the singleton instance (useful for testing)
   * This method allows resetting the singleton in test environments
   */
  public static resetInstance(): void {
    SupabaseServerSingleton.instance = null
  }

  /**
   * Check if the client has been initialized
   * 
   * @returns true if client is initialized, false otherwise
   */
  public isClientInitialized(): boolean {
    return this.isInitialized && this.client !== null
  }
}

export default SupabaseServerSingleton

