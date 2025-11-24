import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Singleton Pattern Implementation for Supabase Browser Client
 * 
 * Ensures only one instance of the Supabase client exists throughout the application lifecycle.
 * This prevents multiple client initializations and maintains a single connection pool.
 */
class SupabaseClientSingleton {
  private static instance: SupabaseClientSingleton | null = null
  private client: SupabaseClient | null = null
  private isInitialized: boolean = false

  /**
   * Private constructor to prevent direct instantiation
   * This enforces the Singleton pattern by making the constructor inaccessible
   */
  private constructor() {
    // Private constructor prevents external instantiation
  }

  /**
   * Get the single instance of SupabaseClientSingleton
   * This is the only way to access the Singleton instance
   * 
   * @returns The single instance of SupabaseClientSingleton
   */
  public static getInstance(): SupabaseClientSingleton {
    if (SupabaseClientSingleton.instance === null) {
      SupabaseClientSingleton.instance = new SupabaseClientSingleton()
    }
    return SupabaseClientSingleton.instance
  }

  /**
   * Initialize the Supabase client if not already initialized
   * This method ensures lazy initialization - client is only created when needed
   * 
   * @returns The Supabase client instance
   * @throws Error if environment variables are missing or invalid
   */
  public getClient(): SupabaseClient {
    if (!this.isInitialized || this.client === null) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!url || !anonKey) {
        throw new Error(
          "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
        )
      }

      // Validate URL format early to avoid cryptic runtime errors
      try {
        // eslint-disable-next-line no-new
        new URL(url)
      } catch {
        throw new Error("Invalid NEXT_PUBLIC_SUPABASE_URL: Must be a valid http(s) URL")
      }

      this.client = createBrowserClient(url, anonKey)
      this.isInitialized = true
    }

    return this.client
  }

  /**
   * Reset the singleton instance (useful for testing)
   * This method allows resetting the singleton in test environments
   */
  public static resetInstance(): void {
    SupabaseClientSingleton.instance = null
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

export default SupabaseClientSingleton

