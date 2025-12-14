import { describe, it, expect, beforeEach, vi } from 'vitest'
import { communityStore } from '../communityStore'
import type { Community } from '../../types/community'

// Mock fetch globally
global.fetch = vi.fn()

describe('CommunityStore - Community Creation', () => {
  const mockCommunity: Community = {
    id: 'new-community-id',
    name: 'Test Community',
    description: 'A test community',
    center_latitude: 23.8103,
    center_longitude: 90.4125,
    radius_meters: 1000,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  beforeEach(() => {
    communityStore.reset()
    vi.clearAllMocks()
  })

  describe('Community Creation', () => {
    it('should create community successfully', async () => {
      // Mock successful API response
      const fetchSpy = vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockCommunity
      } as Response)

      const result = await communityStore.createCommunity({
        name: 'Test Community',
        description: 'A test community',
        center_latitude: 23.8103,
        center_longitude: 90.4125,
        radius_meters: 1000
      })

      expect(fetchSpy).toHaveBeenCalledWith('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Community',
          description: 'A test community',
          center_latitude: 23.8103,
          center_longitude: 90.4125,
          radius_meters: 1000
        })
      })

      expect(result).toEqual(mockCommunity)
      
      const state = communityStore.getState()
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should handle community creation failure', async () => {
      // Mock failed API response
      const fetchSpy = vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Insufficient permissions to create community' })
      } as Response)

      const result = await communityStore.createCommunity({
        name: 'Test Community',
        description: 'A test community',
        center_latitude: 23.8103,
        center_longitude: 90.4125,
        radius_meters: 1000
      })

      expect(result).toBeNull()
      
      const state = communityStore.getState()
      expect(state.loading).toBe(false)
      expect(state.error).toBe('Failed to create community')
    })

    it('should handle network errors during creation', async () => {
      // Mock network error
      const fetchSpy = vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

      const result = await communityStore.createCommunity({
        name: 'Test Community',
        description: 'A test community',
        center_latitude: 23.8103,
        center_longitude: 90.4125,
        radius_meters: 1000
      })

      expect(result).toBeNull()
      
      const state = communityStore.getState()
      expect(state.loading).toBe(false)
      expect(state.error).toBe('Network error')
    })

    it('should set loading state during creation', async () => {
      // Mock delayed response
      let resolvePromise: (value: any) => void
      const delayedPromise = new Promise(resolve => {
        resolvePromise = resolve
      })

      const fetchSpy = vi.mocked(fetch).mockReturnValue(delayedPromise as Promise<Response>)

      // Start creation (don't await yet)
      const creationPromise = communityStore.createCommunity({
        name: 'Test Community',
        description: 'A test community',
        center_latitude: 23.8103,
        center_longitude: 90.4125,
        radius_meters: 1000
      })

      // Check loading state is true
      const loadingState = communityStore.getState()
      expect(loadingState.loading).toBe(true)

      // Resolve the promise
      resolvePromise!({
        ok: true,
        status: 201,
        json: async () => mockCommunity
      } as Response)

      // Wait for completion
      await creationPromise

      // Check loading state is false
      const finalState = communityStore.getState()
      expect(finalState.loading).toBe(false)
    })
  })
})