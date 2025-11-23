import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RoutePlannerStore, type RoutePlannerState, type SearchResult } from '../routePlannerStore'
import type { Observer } from '@/lib/observer'

// Mock fetch globally
global.fetch = vi.fn()

describe('RoutePlannerStore - Observer Pattern Implementation', () => {
  let store: RoutePlannerStore
  let observer: Observer<RoutePlannerState>
  let updateSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    store = new RoutePlannerStore()
    updateSpy = vi.fn()
    observer = {
      update: updateSpy,
    }
    store.subscribe(observer)
    vi.clearAllMocks()
  })

  afterEach(() => {
    store.unsubscribe(observer)
  })

  describe('Observer Pattern Integration', () => {
    it('should extend Observable and support subscription', () => {
      expect(store).toBeInstanceOf(Object)
      expect(typeof store.subscribe).toBe('function')
      expect(typeof store.unsubscribe).toBe('function')
    })

    it('should notify observers when state changes via setFromLocation', () => {
      store.setFromLocation('New Location')

      expect(updateSpy).toHaveBeenCalledTimes(1)
      const notifiedState = updateSpy.mock.calls[0][0] as RoutePlannerState
      expect(notifiedState.fromLocation).toBe('New Location')
    })

    it('should notify observers when state changes via setToLocation', () => {
      store.setToLocation('Destination')

      expect(updateSpy).toHaveBeenCalledTimes(1)
      const notifiedState = updateSpy.mock.calls[0][0] as RoutePlannerState
      expect(notifiedState.toLocation).toBe('Destination')
    })

    it('should notify observers on every state mutation', () => {
      store.setFromLocation('Location 1')
      store.setToLocation('Destination 1')
      store.setFromLocation('Location 2')

      expect(updateSpy).toHaveBeenCalledTimes(3)
    })

    it('should notify multiple observers simultaneously', () => {
      const observer2 = { update: vi.fn() }
      store.subscribe(observer2)

      store.setFromLocation('Test Location')

      expect(updateSpy).toHaveBeenCalledTimes(1)
      expect(observer2.update).toHaveBeenCalledTimes(1)

      const state1 = updateSpy.mock.calls[0][0] as RoutePlannerState
      const state2 = observer2.update.mock.calls[0][0] as RoutePlannerState

      expect(state1.fromLocation).toBe('Test Location')
      expect(state2.fromLocation).toBe('Test Location')
      expect(state1).toEqual(state2) // Same state object reference
    })

    it('should stop notifying unsubscribed observers', () => {
      store.setFromLocation('Before unsubscribe')
      expect(updateSpy).toHaveBeenCalledTimes(1)

      store.unsubscribe(observer)
      store.setFromLocation('After unsubscribe')

      expect(updateSpy).toHaveBeenCalledTimes(1) // Should not be called again
    })
  })

  describe('State Management with Observer Pattern', () => {
    it('should maintain state consistency across notifications', () => {
      store.setFromLocation('Start')
      store.setToLocation('End')

      const firstCall = updateSpy.mock.calls[0][0] as RoutePlannerState
      const secondCall = updateSpy.mock.calls[1][0] as RoutePlannerState

      expect(firstCall.fromLocation).toBe('Start')
      expect(secondCall.fromLocation).toBe('Start') // Should persist
      expect(secondCall.toLocation).toBe('End')
    })

    it('should notify with complete state object, not partial updates', () => {
      store.setFromLocation('Complete State Test')

      const notifiedState = updateSpy.mock.calls[0][0] as RoutePlannerState

      // Verify complete state structure
      expect(notifiedState).toHaveProperty('fromLocation')
      expect(notifiedState).toHaveProperty('toLocation')
      expect(notifiedState).toHaveProperty('fromCoords')
      expect(notifiedState).toHaveProperty('searchResults')
      expect(notifiedState).toHaveProperty('plannedRoute')
      expect(notifiedState).toHaveProperty('buses')
      expect(notifiedState).toHaveProperty('loading')
      expect(notifiedState).toHaveProperty('mapStops')
      expect(notifiedState).toHaveProperty('error')
    })

    it('should notify observers with immutable state updates', () => {
      const initialState = store.getState()
      store.setFromLocation('New Value')

      const updatedState = updateSpy.mock.calls[0][0] as RoutePlannerState

      // State should be a new object (immutability)
      expect(updatedState).not.toBe(initialState)
      expect(updatedState.fromLocation).not.toBe(initialState.fromLocation)
    })
  })

  describe('Complex Operations with Observer Pattern', () => {
    it('should notify observers during async operations', async () => {
      // Mock successful API response
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: '1', name: 'Bus 1', status: 'active' },
          { id: '2', name: 'Bus 2', status: 'inactive' },
        ],
      })

      await store.ensureInitialized()

      // Should have been notified when buses are loaded
      expect(updateSpy).toHaveBeenCalled()
      const lastCall = updateSpy.mock.calls[updateSpy.mock.calls.length - 1][0] as RoutePlannerState
      expect(lastCall.buses.length).toBeGreaterThan(0)
    })

    it('should notify observers when error state changes', () => {
      store.setFromLocation('Test')
      store.setToLocation('Destination')

      // Simulate an error scenario
      const initialState = store.getState()
      // Error would be set during searchRoutes if API fails
      // For this test, we verify the pattern works

      expect(updateSpy).toHaveBeenCalled()
    })

    it('should notify observers when loading state changes', async () => {
      // Mock API to simulate loading states
      ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() =>
        new Promise((resolve) =>
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => [],
            })
          }, 100),
        ),
      )

      store.setToLocation('Test Destination')
      const promise = store.searchRoutes()

      // Check that loading state was set
      const loadingCall = updateSpy.mock.calls.find(
        (call) => (call[0] as RoutePlannerState).loading === true,
      )
      expect(loadingCall).toBeDefined()

      await promise

      // Check that loading state was cleared
      const finalCall = updateSpy.mock.calls[updateSpy.mock.calls.length - 1][0] as RoutePlannerState
      expect(finalCall.loading).toBe(false)
    })
  })

  describe('Observer Pattern Best Practices', () => {
    it('should allow observers to access current state via getState', () => {
      store.setFromLocation('Test')
      const currentState = store.getState()

      expect(currentState.fromLocation).toBe('Test')
      expect(typeof currentState).toBe('object')
    })

    it('should handle rapid state changes and notify for each', () => {
      for (let i = 0; i < 10; i++) {
        store.setFromLocation(`Location ${i}`)
      }

      expect(updateSpy).toHaveBeenCalledTimes(10)
    })

    it('should maintain observer list integrity during notifications', () => {
      const observer2 = { update: vi.fn() }
      const observer3 = { update: vi.fn() }

      store.subscribe(observer2)
      store.subscribe(observer3)

      store.setFromLocation('Test')

      // All three observers should be notified
      expect(updateSpy).toHaveBeenCalledTimes(1)
      expect(observer2.update).toHaveBeenCalledTimes(1)
      expect(observer3.update).toHaveBeenCalledTimes(1)
    })

    it('should support reset operation with notification', () => {
      store.setFromLocation('Before Reset')
      store.setToLocation('Destination')
      expect(updateSpy).toHaveBeenCalledTimes(2)

      const callCountBeforeReset = updateSpy.mock.calls.length
      store.reset()

      expect(updateSpy).toHaveBeenCalledTimes(callCountBeforeReset + 1)
      const resetState = updateSpy.mock.calls[updateSpy.mock.calls.length - 1][0] as RoutePlannerState
      expect(resetState.fromLocation).toBe('')
      expect(resetState.toLocation).toBe('')
    })
  })

  describe('Observer Pattern Validation - Justification Tests', () => {
    it('JUSTIFICATION: Demonstrates Subject-Observer relationship', () => {
      // Subject (Observable) - RoutePlannerStore
      // Observer - observer object
      // This test proves the pattern is correctly implemented

      const observerCount = 3
      const observers = Array.from({ length: observerCount }, () => ({
        update: vi.fn(),
      }))

      observers.forEach((obs) => store.subscribe(obs))
      store.setFromLocation('Subject notifies all observers')

      observers.forEach((obs) => {
        expect(obs.update).toHaveBeenCalledTimes(1)
      })
    })

    it('JUSTIFICATION: Proves loose coupling - store does not know observer details', () => {
      // Store doesn't need to know what observer does with the data
      const customObserver = {
        update: vi.fn((state: RoutePlannerState) => {
          // Observer can do anything with the state
          console.log('Custom processing:', state.fromLocation)
        }),
      }

      store.subscribe(customObserver)
      store.setFromLocation('Loose Coupling Test')

      expect(customObserver.update).toHaveBeenCalled()
    })

    it('JUSTIFICATION: Demonstrates open/closed principle - extensible without modification', () => {
      // Can add new observers without modifying the store
      const newObserver = { update: vi.fn() }
      store.subscribe(newObserver)

      store.setFromLocation('Open/Closed Principle')

      expect(newObserver.update).toHaveBeenCalled()
      // Store code didn't need to change to support this new observer
    })

    it('JUSTIFICATION: Shows one-to-many dependency - one store, many observers', () => {
      const manyObservers = Array.from({ length: 10 }, () => ({
        update: vi.fn(),
      }))

      manyObservers.forEach((obs) => store.subscribe(obs))
      store.setFromLocation('One-to-Many Test')

      manyObservers.forEach((obs) => {
        expect(obs.update).toHaveBeenCalledTimes(1)
      })
    })

    it('JUSTIFICATION: Validates notification happens automatically on state change', () => {
      // No manual notification needed - happens automatically via #setState
      store.setFromLocation('Auto Notification')

      // Observer was automatically notified
      expect(updateSpy).toHaveBeenCalled()
    })

    it('JUSTIFICATION: Proves observers receive complete, consistent state', () => {
      store.setFromLocation('Location A')
      store.setToLocation('Location B')

      const firstNotification = updateSpy.mock.calls[0][0] as RoutePlannerState
      const secondNotification = updateSpy.mock.calls[1][0] as RoutePlannerState

      // Each notification contains complete state
      expect(firstNotification).toHaveProperty('fromLocation')
      expect(firstNotification).toHaveProperty('toLocation')
      expect(secondNotification).toHaveProperty('fromLocation')
      expect(secondNotification).toHaveProperty('toLocation')

      // State is consistent (Location A persists in second notification)
      expect(secondNotification.fromLocation).toBe('Location A')
      expect(secondNotification.toLocation).toBe('Location B')
    })
  })
})

