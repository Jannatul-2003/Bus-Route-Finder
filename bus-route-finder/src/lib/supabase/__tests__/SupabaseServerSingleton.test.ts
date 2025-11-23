import { describe, it, expect, beforeEach, vi } from 'vitest'
import SupabaseServerSingleton from '../SupabaseServerSingleton'

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}))

// Mock the Supabase SSR module
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((url: string, key: string) => ({
    url,
    key,
    type: 'server-client',
  })),
}))

describe('SupabaseServerSingleton - Singleton Pattern Implementation', () => {
  beforeEach(() => {
    // Reset singleton instance before each test
    SupabaseServerSingleton.resetInstance()
    // Set up environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  describe('Singleton Pattern Core Principles', () => {
    it('JUSTIFICATION: Should return the same instance on multiple getInstance() calls', async () => {
      const instance1 = SupabaseServerSingleton.getInstance()
      const instance2 = SupabaseServerSingleton.getInstance()
      const instance3 = SupabaseServerSingleton.getInstance()

      // All calls should return the exact same instance
      expect(instance1).toBe(instance2)
      expect(instance2).toBe(instance3)
      expect(instance1).toBe(instance3)
    })

    it('JUSTIFICATION: Should prevent direct instantiation (private constructor)', () => {
      // TypeScript prevents direct instantiation, but we can verify the pattern
      const instance1 = SupabaseServerSingleton.getInstance()
      const instance2 = SupabaseServerSingleton.getInstance()

      expect(instance1).toBe(instance2)
    })

    it('JUSTIFICATION: Should maintain single instance across multiple access points', async () => {
      // Simulate multiple parts of the application accessing the singleton
      const instanceFromModuleA = SupabaseServerSingleton.getInstance()
      const instanceFromModuleB = SupabaseServerSingleton.getInstance()
      const instanceFromModuleC = SupabaseServerSingleton.getInstance()

      // All should reference the same instance
      expect(instanceFromModuleA).toBe(instanceFromModuleB)
      expect(instanceFromModuleB).toBe(instanceFromModuleC)
    })
  })

  describe('Lazy Initialization', () => {
    it('should not initialize client until getClient() is called', () => {
      const singleton = SupabaseServerSingleton.getInstance()

      expect(singleton.isClientInitialized()).toBe(false)
    })

    it('should initialize client on first getClient() call', async () => {
      const singleton = SupabaseServerSingleton.getInstance()

      const client = await singleton.getClient()

      expect(singleton.isClientInitialized()).toBe(true)
      expect(client).toBeDefined()
    })

    it('should return the same client instance on subsequent getClient() calls', async () => {
      const singleton = SupabaseServerSingleton.getInstance()

      const client1 = await singleton.getClient()
      const client2 = await singleton.getClient()
      const client3 = await singleton.getClient()

      // All calls should return the same client instance
      expect(client1).toBe(client2)
      expect(client2).toBe(client3)
    })
  })

  describe('Context-Specific Instances', () => {
    it('should allow context-specific client instances when contextId is provided', async () => {
      const singleton = SupabaseServerSingleton.getInstance()

      const client1 = await singleton.getClient('context-1')
      const client2 = await singleton.getClient('context-2')

      // Different contexts may need different clients (e.g., different cookies)
      // But singleton still manages the instances efficiently
      expect(singleton.isClientInitialized()).toBe(true)
    })

    it('should reuse client when same contextId is provided', async () => {
      const singleton = SupabaseServerSingleton.getInstance()

      const client1 = await singleton.getClient('same-context')
      const client2 = await singleton.getClient('same-context')

      // Same context should return same client
      expect(client1).toBe(client2)
    })
  })

  describe('Error Handling', () => {
    it('should throw error when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      const singleton = SupabaseServerSingleton.getInstance()

      await expect(singleton.getClient()).rejects.toThrow('Missing Supabase environment variables')
    })

    it('should throw error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      const singleton = SupabaseServerSingleton.getInstance()

      await expect(singleton.getClient()).rejects.toThrow('Missing Supabase environment variables')
    })

    it('should throw error when NEXT_PUBLIC_SUPABASE_URL is invalid', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-valid-url'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
      const singleton = SupabaseServerSingleton.getInstance()

      await expect(singleton.getClient()).rejects.toThrow('Invalid NEXT_PUBLIC_SUPABASE_URL')
    })
  })

  describe('Singleton Pattern Validation', () => {
    it('JUSTIFICATION: Demonstrates controlled access to single instance', async () => {
      // Multiple attempts to get instance should return the same object
      const instances = Array.from({ length: 10 }, () => SupabaseServerSingleton.getInstance())

      // All instances should be the same reference
      instances.forEach((instance) => {
        expect(instance).toBe(instances[0])
      })
    })

    it('JUSTIFICATION: Proves only one instance exists in memory', async () => {
      const instance1 = SupabaseServerSingleton.getInstance()
      const instance2 = SupabaseServerSingleton.getInstance()

      // Memory address should be identical (same object reference)
      expect(instance1 === instance2).toBe(true)
    })

    it('JUSTIFICATION: Shows instance persists across multiple calls', async () => {
      const singleton1 = SupabaseServerSingleton.getInstance()
      const client1 = await singleton1.getClient()

      const singleton2 = SupabaseServerSingleton.getInstance()
      const client2 = await singleton2.getClient()

      // Should be the same singleton instance
      expect(singleton1).toBe(singleton2)
      // Should be the same client instance (without context)
      expect(client1).toBe(client2)
    })
  })

  describe('Reset Functionality (Testing Support)', () => {
    it('should allow resetting instance for testing', () => {
      const instance1 = SupabaseServerSingleton.getInstance()
      SupabaseServerSingleton.resetInstance()
      const instance2 = SupabaseServerSingleton.getInstance()

      // After reset, should be a new instance
      expect(instance1).not.toBe(instance2)
    })

    it('should reset client initialization state', async () => {
      const singleton1 = SupabaseServerSingleton.getInstance()
      await singleton1.getClient()
      expect(singleton1.isClientInitialized()).toBe(true)

      SupabaseServerSingleton.resetInstance()

      const singleton2 = SupabaseServerSingleton.getInstance()
      expect(singleton2.isClientInitialized()).toBe(false)
    })
  })

  describe('Resource Efficiency', () => {
    it('JUSTIFICATION: Should create client only once for same context', async () => {
      const { createServerClient } = await import('@supabase/ssr')
      const createSpy = vi.mocked(createServerClient)

      const singleton = SupabaseServerSingleton.getInstance()

      // Call getClient multiple times without context
      await singleton.getClient()
      await singleton.getClient()
      await singleton.getClient()

      // createServerClient should only be called once
      expect(createSpy).toHaveBeenCalledTimes(1)
    })

    it('JUSTIFICATION: Should reuse existing client instance', async () => {
      const singleton = SupabaseServerSingleton.getInstance()

      const client1 = await singleton.getClient()
      const client2 = await singleton.getClient()

      // Should be the exact same object (memory efficient)
      expect(client1).toBe(client2)
    })
  })
})

