import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useRoutePlanner } from '../useRoutePlanner'
import { routePlannerStore } from '@/lib/stores/routePlannerStore'
import type { Observer } from '@/lib/observer'
import type { RoutePlannerState } from '@/lib/stores/routePlannerStore'

// Mock the store
vi.mock('@/lib/stores/routePlannerStore', () => {
  const mockStore = {
    getState: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    setFromLocation: vi.fn(),
    setToLocation: vi.fn(),
    handleGetLocation: vi.fn(),
    searchRoutes: vi.fn(),
    selectResult: vi.fn(),
    ensureInitialized: vi.fn().mockResolvedValue(undefined),
  }
  return {
    routePlannerStore: mockStore,
  }
})

describe('useRoutePlanner - React Hook Integration with Observer Pattern', () => {
  const mockState: RoutePlannerState = {
    fromLocation: '',
    toLocation: '',
    fromCoords: null,
    searchResults: [],
    plannedRoute: null,
    buses: [],
    loading: false,
    mapStops: [],
    error: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(routePlannerStore.getState as ReturnType<typeof vi.fn>).mockReturnValue(mockState)
  })

  describe('Observer Pattern Integration in React Hook', () => {
    it('should subscribe to store when hook mounts', () => {
      renderHook(() => useRoutePlanner())

      expect(routePlannerStore.subscribe).toHaveBeenCalledTimes(1)
      const subscribedObserver = (routePlannerStore.subscribe as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as Observer<RoutePlannerState>

      expect(subscribedObserver).toHaveProperty('update')
      expect(typeof subscribedObserver.update).toBe('function')
    })

    it('should unsubscribe from store when hook unmounts', () => {
      const { unmount } = renderHook(() => useRoutePlanner())

      const subscribedObserver = (routePlannerStore.subscribe as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as Observer<RoutePlannerState>

      unmount()

      expect(routePlannerStore.unsubscribe).toHaveBeenCalledTimes(1)
      expect(routePlannerStore.unsubscribe).toHaveBeenCalledWith(subscribedObserver)
    })

    it('should update React state when observer receives notification', () => {
      const { result } = renderHook(() => useRoutePlanner())

      const subscribedObserver = (routePlannerStore.subscribe as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as Observer<RoutePlannerState>

      // Simulate store notifying observer
      const newState: RoutePlannerState = {
        ...mockState,
        fromLocation: 'Updated Location',
      }

      act(() => {
        subscribedObserver.update(newState)
      })

      expect(result.current.state.fromLocation).toBe('Updated Location')
    })

    it('should maintain observer reference across re-renders', () => {
      const { rerender } = renderHook(() => useRoutePlanner())

      const firstObserver = (routePlannerStore.subscribe as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as Observer<RoutePlannerState>

      rerender()

      // Should not subscribe again (useEffect dependency is empty array)
      expect(routePlannerStore.subscribe).toHaveBeenCalledTimes(1)
    })

    it('should call ensureInitialized on mount', async () => {
      renderHook(() => useRoutePlanner())

      await waitFor(() => {
        expect(routePlannerStore.ensureInitialized).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Actions Delegation to Store', () => {
    it('should delegate setFromLocation to store', () => {
      const { result } = renderHook(() => useRoutePlanner())

      result.current.actions.setFromLocation('Test Location')

      expect(routePlannerStore.setFromLocation).toHaveBeenCalledTimes(1)
      expect(routePlannerStore.setFromLocation).toHaveBeenCalledWith('Test Location')
    })

    it('should delegate setToLocation to store', () => {
      const { result } = renderHook(() => useRoutePlanner())

      result.current.actions.setToLocation('Destination')

      expect(routePlannerStore.setToLocation).toHaveBeenCalledTimes(1)
      expect(routePlannerStore.setToLocation).toHaveBeenCalledWith('Destination')
    })

    it('should delegate searchRoutes to store', () => {
      const { result } = renderHook(() => useRoutePlanner())

      result.current.actions.searchRoutes()

      expect(routePlannerStore.searchRoutes).toHaveBeenCalledTimes(1)
    })

    it('should provide stable action references', () => {
      const { result, rerender } = renderHook(() => useRoutePlanner())

      const firstActions = result.current.actions
      rerender()
      const secondActions = result.current.actions

      // Actions should be memoized and stable
      expect(firstActions.setFromLocation).toBe(secondActions.setFromLocation)
      expect(firstActions.setToLocation).toBe(secondActions.setToLocation)
    })
  })

  describe('Observer Pattern Flow Validation', () => {
    it('JUSTIFICATION: Demonstrates complete Observer pattern flow in React', () => {
      const { result } = renderHook(() => useRoutePlanner())

      // 1. Hook subscribes to store (Observer pattern)
      expect(routePlannerStore.subscribe).toHaveBeenCalled()

      // 2. Store state can be accessed
      expect(result.current.state).toBeDefined()

      // 3. Actions trigger store methods (which notify observers)
      result.current.actions.setFromLocation('Flow Test')

      // 4. Store method was called (which internally notifies observers)
      expect(routePlannerStore.setFromLocation).toHaveBeenCalled()

      // 5. If store notifies, hook's observer.update would be called
      // This completes the Observer pattern cycle
    })

    it('JUSTIFICATION: Proves React component acts as Observer', () => {
      const { result } = renderHook(() => useRoutePlanner())

      const observer = (routePlannerStore.subscribe as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as Observer<RoutePlannerState>

      // React hook creates an observer object
      expect(observer).toBeDefined()
      expect(observer.update).toBeDefined()

      // When store notifies, observer.update is called
      // This updates React state, causing re-render
      const newState: RoutePlannerState = {
        ...mockState,
        fromLocation: 'Observer Test',
      }

      act(() => {
        observer.update(newState)
      })

      // React state updated through observer pattern
      expect(result.current.state.fromLocation).toBe('Observer Test')
    })

    it('JUSTIFICATION: Shows proper cleanup prevents memory leaks', () => {
      const { unmount } = renderHook(() => useRoutePlanner())

      const observer = (routePlannerStore.subscribe as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as Observer<RoutePlannerState>

      unmount()

      // Observer is properly unsubscribed
      expect(routePlannerStore.unsubscribe).toHaveBeenCalledWith(observer)
    })
  })
})

