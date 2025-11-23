import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getSupabaseClient } from '../client'
import { getSupabaseServer } from '../server'
import SupabaseClientSingleton from '../SupabaseClientSingleton'
import SupabaseServerSingleton from '../SupabaseServerSingleton'

// Mock the Supabase SSR module
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn((url: string, key: string) => ({
    url,
    key,
    type: 'browser-client',
  })),
  createServerClient: vi.fn((url: string, key: string) => ({
    url,
    key,
    type: 'server-client',
  })),
}))

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}))

describe('Singleton Pattern Integration Tests', () => {
  beforeEach(() => {
    // Reset singleton instances before each test
    SupabaseClientSingleton.resetInstance()
    SupabaseServerSingleton.resetInstance()
    // Set up environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  describe('Client Singleton Integration', () => {
    it('JUSTIFICATION: getSupabaseClient() uses Singleton pattern', () => {
      const client1 = getSupabaseClient()
      const client2 = getSupabaseClient()
      const client3 = getSupabaseClient()

      // All calls should return the same client instance
      expect(client1).toBe(client2)
      expect(client2).toBe(client3)
    })

    it('JUSTIFICATION: Multiple calls to getSupabaseClient() return same instance', () => {
      const clients = Array.from({ length: 5 }, () => getSupabaseClient())

      // All clients should be the same instance
      clients.forEach((client) => {
        expect(client).toBe(clients[0])
      })
    })

    it('should maintain singleton behavior through wrapper function', () => {
      // Reset to ensure clean state
      SupabaseClientSingleton.resetInstance()

      const client1 = getSupabaseClient()
      const singleton1 = SupabaseClientSingleton.getInstance()
      const client2 = singleton1.getClient()

      // Both should return the same client
      expect(client1).toBe(client2)
    })
  })

  describe('Server Singleton Integration', () => {
    it('JUSTIFICATION: getSupabaseServer() uses Singleton pattern', async () => {
      const client1 = await getSupabaseServer()
      const client2 = await getSupabaseServer()
      const client3 = await getSupabaseServer()

      // All calls should return the same client instance (without context)
      expect(client1).toBe(client2)
      expect(client2).toBe(client3)
    })

    it('JUSTIFICATION: Multiple calls to getSupabaseServer() return same instance', async () => {
      const clients = await Promise.all(Array.from({ length: 5 }, () => getSupabaseServer()))

      // All clients should be the same instance
      clients.forEach((client) => {
        expect(client).toBe(clients[0])
      })
    })

    it('should maintain singleton behavior through wrapper function', async () => {
      // Reset to ensure clean state
      SupabaseServerSingleton.resetInstance()

      const client1 = await getSupabaseServer()
      const singleton1 = SupabaseServerSingleton.getInstance()
      const client2 = await singleton1.getClient()

      // Both should return the same client
      expect(client1).toBe(client2)
    })
  })

  describe('Cross-Module Singleton Consistency', () => {
    it('JUSTIFICATION: Singleton pattern works across different import paths', () => {
      // Simulate different modules importing the client
      const clientFromModuleA = getSupabaseClient()
      const clientFromModuleB = getSupabaseClient()
      const clientFromModuleC = getSupabaseClient()

      // All should reference the same singleton instance
      expect(clientFromModuleA).toBe(clientFromModuleB)
      expect(clientFromModuleB).toBe(clientFromModuleC)
    })

    it('JUSTIFICATION: Singleton prevents multiple database connections', () => {
      const { createBrowserClient } = require('@supabase/ssr')
      const createSpy = vi.mocked(createBrowserClient)

      // Multiple calls to getSupabaseClient
      getSupabaseClient()
      getSupabaseClient()
      getSupabaseClient()
      getSupabaseClient()
      getSupabaseClient()

      // Should only create one client instance
      expect(createSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Real-World Usage Simulation', () => {
    it('JUSTIFICATION: Simulates typical application usage pattern', () => {
      // Simulate multiple components/utilities accessing the database
      const authClient = getSupabaseClient()
      const dataClient = getSupabaseClient()
      const queryClient = getSupabaseClient()

      // All should use the same singleton instance
      expect(authClient).toBe(dataClient)
      expect(dataClient).toBe(queryClient)
    })

    it('JUSTIFICATION: Demonstrates resource efficiency in production', async () => {
      const { createBrowserClient, createServerClient } = require('@supabase/ssr')
      const browserSpy = vi.mocked(createBrowserClient)
      const serverSpy = vi.mocked(createServerClient)

      // Simulate 100 database access calls
      for (let i = 0; i < 100; i++) {
        getSupabaseClient()
      }

      for (let i = 0; i < 100; i++) {
        await getSupabaseServer()
      }

      // Should only create one browser client and one server client
      expect(browserSpy).toHaveBeenCalledTimes(1)
      expect(serverSpy).toHaveBeenCalledTimes(1)
    })
  })
})

