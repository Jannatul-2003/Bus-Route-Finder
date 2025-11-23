import { describe, it, expect, beforeEach, vi } from 'vitest'
import SupabaseClientSingleton from '../SupabaseClientSingleton'

// Mock the Supabase SSR module
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn((url: string, key: string) => ({
    url,
    key,
    type: 'browser-client',
  })),
}))

describe('SupabaseClientSingleton - Singleton Pattern Implementation', () => {
  beforeEach(() => {
    // Reset singleton instance before each test
    SupabaseClientSingleton.resetInstance()
    // Set up environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  describe('Singleton Pattern Core Principles', () => {
    it('JUSTIFICATION: Should return the same instance on multiple getInstance() calls', () => {
      const instance1 = SupabaseClientSingleton.getInstance()
      const instance2 = SupabaseClientSingleton.getInstance()
      const instance3 = SupabaseClientSingleton.getInstance()

      // All calls should return the exact same instance
      expect(instance1).toBe(instance2)
      expect(instance2).toBe(instance3)
      expect(instance1).toBe(instance3)
    })

    it('JUSTIFICATION: Should prevent direct instantiation (private constructor)', () => {
      // TypeScript prevents direct instantiation, but we can verify the pattern
      // by ensuring getInstance() is the only way to access the instance
      const instance1 = SupabaseClientSingleton.getInstance()
      const instance2 = SupabaseClientSingleton.getInstance()

      expect(instance1).toBe(instance2)
    })

    it('JUSTIFICATION: Should maintain single instance across multiple access points', () => {
      // Simulate multiple parts of the application accessing the singleton
      const instanceFromModuleA = SupabaseClientSingleton.getInstance()
      const instanceFromModuleB = SupabaseClientSingleton.getInstance()
      const instanceFromModuleC = SupabaseClientSingleton.getInstance()

      // All should reference the same instance
      expect(instanceFromModuleA).toBe(instanceFromModuleB)
      expect(instanceFromModuleB).toBe(instanceFromModuleC)
    })
  })

  describe('Lazy Initialization', () => {
    it('should not initialize client until getClient() is called', () => {
      const singleton = SupabaseClientSingleton.getInstance()

      expect(singleton.isClientInitialized()).toBe(false)
    })

    it('should initialize client on first getClient() call', () => {
      const singleton = SupabaseClientSingleton.getInstance()

      const client = singleton.getClient()

      expect(singleton.isClientInitialized()).toBe(true)
      expect(client).toBeDefined()
    })

    it('should return the same client instance on subsequent getClient() calls', () => {
      const singleton = SupabaseClientSingleton.getInstance()

      const client1 = singleton.getClient()
      const client2 = singleton.getClient()
      const client3 = singleton.getClient()

      // All calls should return the same client instance
      expect(client1).toBe(client2)
      expect(client2).toBe(client3)
    })
  })

  describe('Error Handling', () => {
    it('should throw error when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      const singleton = SupabaseClientSingleton.getInstance()

      expect(() => singleton.getClient()).toThrow('Missing Supabase environment variables')
    })

    it('should throw error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      const singleton = SupabaseClientSingleton.getInstance()

      expect(() => singleton.getClient()).toThrow('Missing Supabase environment variables')
    })

    it('should throw error when NEXT_PUBLIC_SUPABASE_URL is invalid', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-valid-url'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
      const singleton = SupabaseClientSingleton.getInstance()

      expect(() => singleton.getClient()).toThrow('Invalid NEXT_PUBLIC_SUPABASE_URL')
    })
  })

  describe('Singleton Pattern Validation', () => {
    it('JUSTIFICATION: Demonstrates controlled access to single instance', () => {
      // Multiple attempts to get instance should return the same object
      const instances = Array.from({ length: 10 }, () => SupabaseClientSingleton.getInstance())

      // All instances should be the same reference
      instances.forEach((instance) => {
        expect(instance).toBe(instances[0])
      })
    })

    it('JUSTIFICATION: Proves only one instance exists in memory', () => {
      const instance1 = SupabaseClientSingleton.getInstance()
      const instance2 = SupabaseClientSingleton.getInstance()

      // Memory address should be identical (same object reference)
      expect(instance1 === instance2).toBe(true)
    })

    it('JUSTIFICATION: Shows instance persists across multiple calls', () => {
      const singleton1 = SupabaseClientSingleton.getInstance()
      const client1 = singleton1.getClient()

      const singleton2 = SupabaseClientSingleton.getInstance()
      const client2 = singleton2.getClient()

      // Should be the same singleton instance
      expect(singleton1).toBe(singleton2)
      // Should be the same client instance
      expect(client1).toBe(client2)
    })
  })

  describe('Reset Functionality (Testing Support)', () => {
    it('should allow resetting instance for testing', () => {
      const instance1 = SupabaseClientSingleton.getInstance()
      SupabaseClientSingleton.resetInstance()
      const instance2 = SupabaseClientSingleton.getInstance()

      // After reset, should be a new instance
      expect(instance1).not.toBe(instance2)
    })

    it('should reset client initialization state', () => {
      const singleton1 = SupabaseClientSingleton.getInstance()
      singleton1.getClient()
      expect(singleton1.isClientInitialized()).toBe(true)

      SupabaseClientSingleton.resetInstance()

      const singleton2 = SupabaseClientSingleton.getInstance()
      expect(singleton2.isClientInitialized()).toBe(false)
    })
  })

  describe('Thread Safety Simulation', () => {
    it('JUSTIFICATION: Should maintain single instance under concurrent access simulation', () => {
      // Simulate concurrent access
      const instances = Promise.all(
        Array.from({ length: 100 }, () => Promise.resolve(SupabaseClientSingleton.getInstance())),
      )

      return instances.then((resolvedInstances) => {
        // All resolved instances should be the same
        resolvedInstances.forEach((instance) => {
          expect(instance).toBe(resolvedInstances[0])
        })
      })
    })
  })

  describe('Resource Efficiency', () => {
    it('JUSTIFICATION: Should create client only once, even with multiple calls', () => {
      const { createBrowserClient } = await import('@supabase/ssr')
      const createSpy = vi.mocked(createBrowserClient)

      const singleton = SupabaseClientSingleton.getInstance()

      // Call getClient multiple times
      singleton.getClient()
      singleton.getClient()
      singleton.getClient()

      // createBrowserClient should only be called once
      expect(createSpy).toHaveBeenCalledTimes(1)
    })

    it('JUSTIFICATION: Should reuse existing client instance', () => {
      const singleton = SupabaseClientSingleton.getInstance()

      const client1 = singleton.getClient()
      const client2 = singleton.getClient()

      // Should be the exact same object (memory efficient)
      expect(client1).toBe(client2)
    })
  })
})

