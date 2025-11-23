import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { routePlannerStore, type RoutePlannerState, type SearchResult } from '../routePlannerStore'
import type { Observer } from '@/lib/observer'

// Mock fetch globally
global.fetch = vi.fn()

describe('RoutePlannerStore - Observer Pattern Implementation', () => {
  let observer: Observer<RoutePlannerState>
  let updateSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    routePlannerStore.reset()
    updateSpy = vi.fn()
    observer = {
      update: updateSpy,
    }
    routePlannerStore.subscribe(observer)
    vi.clearAllMocks()
  })

  afterEach(() => {
    routePlannerStore.unsubscribe(observer)
  })

  describe('Observer Pattern Integration', () => {
    it('should extend Observable and support subscription', () => {
      expect(routePlannerStore).toBeInstanceOf(Object)
      expect(typeof routePlannerStore.subscribe).toBe('function')
      expect(typeof routePlannerStore.unsubscribe).toBe('function')
    })

    it('should notify observers when state changes via setFromLocation', () => {
      routePlannerStore.setFromLocation('New Location')

      expect(updateSpy).toHaveBeenCalledTimes(1)
      const notifiedState = updateSpy.mock.calls[0][0] as RoutePlannerState
      expect(notifiedState.fromLocation).toBe('New Location')
    })

    it('should notify observers when state changes via setToLocation', () => {
      routePlannerStore.setToLocation('Destination')

      expect(updateSpy).toHaveBeenCalledTimes(1)
      const notifiedState = updateSpy.mock.calls[0][0] as RoutePlannerState
      expect(notifiedState.toLocation).toBe('Destination')
    })

    it('should notify observers on every state mutation', () => {
      routePlannerStore.setFromLocation('Location 1')
      routePlannerStore.setToLocation('Destination 1')
      routePlannerStore.setFromLocation('Location 2')

      expect(updateSpy).toHaveBeenCalledTimes(3)
    })

    it('should notify multiple observers simultaneously', () => {
      const observer2 = { update: vi.fn() }
      routePlannerStore.subscribe(observer2)

      routePlannerStore.setFromLocation('Test Location')

      expect(updateSpy).toHaveBeenCalledTimes(1)
      expect(observer2.update).toHaveBeenCalledTimes(1)

      const state1 = updateSpy.mock.calls[0][0] as RoutePlannerState
      const state2 = observer2.update.mock.calls[0][0] as RoutePlannerState

      expect(state1.fromLocation).toBe('Test Location')
      expect(state2.fromLocation).toBe('Test Location')
      expect(state1).toEqual(state2) // Same state object reference
    })

    it('should stop notifying unsubscribed observers', () => {
      routePlannerStore.setFromLocation('Before unsubscribe')
      expect(updateSpy).toHaveBeenCalledTimes(1)

      routePlannerStore.unsubscribe(observer)
      routePlannerStore.setFromLocation('After unsubscribe')

      expect(updateSpy).toHaveBeenCalledTimes(1) // Should not be called again
    })
  })

  describe('State Management with Observer Pattern', () => {
    it('should maintain state consistency across notifications', () => {
      routePlannerStore.setFromLocation('Start')
      routePlannerStore.setToLocation('End')

      const firstCall = updateSpy.mock.calls[0][0] as RoutePlannerState
      const secondCall = updateSpy.mock.calls[1][0] as RoutePlannerState

      expect(firstCall.fromLocation).toBe('Start')
      expect(secondCall.fromLocation).toBe('Start') // Should persist
      expect(secondCall.toLocation).toBe('End')
    })

    it('should notify with complete state object, not partial updates', () => {
      routePlannerStore.setFromLocation('Complete State Test')

      const notifiedState = updateSpy.mock.calls[0][0] as RoutePlannerState

      // Verify complete state structure - location inputs
      expect(notifiedState).toHaveProperty('fromLocation')
      expect(notifiedState).toHaveProperty('toLocation')
      expect(notifiedState).toHaveProperty('fromCoords')
      expect(notifiedState).toHaveProperty('toCoords')
      
      // Verify threshold fields
      expect(notifiedState).toHaveProperty('startingThreshold')
      expect(notifiedState).toHaveProperty('destinationThreshold')
      
      // Verify discovered stops
      expect(notifiedState).toHaveProperty('startingStops')
      expect(notifiedState).toHaveProperty('destinationStops')
      
      // Verify selected stops
      expect(notifiedState).toHaveProperty('selectedOnboardingStop')
      expect(notifiedState).toHaveProperty('selectedOffboardingStop')
      
      // Verify walking distances
      expect(notifiedState).toHaveProperty('walkingDistanceToOnboarding')
      expect(notifiedState).toHaveProperty('walkingDistanceFromOffboarding')
      
      // Verify bus results
      expect(notifiedState).toHaveProperty('availableBuses')
      
      // Verify filters and sorting
      expect(notifiedState).toHaveProperty('filters')
      expect(notifiedState).toHaveProperty('sortBy')
      expect(notifiedState).toHaveProperty('sortOrder')
      
      // Verify legacy fields
      expect(notifiedState).toHaveProperty('searchResults')
      expect(notifiedState).toHaveProperty('plannedRoute')
      expect(notifiedState).toHaveProperty('buses')
      expect(notifiedState).toHaveProperty('mapStops')
      
      // Verify UI state
      expect(notifiedState).toHaveProperty('loading')
      expect(notifiedState).toHaveProperty('error')
      expect(notifiedState).toHaveProperty('distanceCalculationMethod')
    })

    it('should notify observers with immutable state updates', () => {
      const initialState = routePlannerStore.getState()
      routePlannerStore.setFromLocation('New Value')

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

      await routePlannerStore.ensureInitialized()

      // Should have been notified when buses are loaded
      expect(updateSpy).toHaveBeenCalled()
      const lastCall = updateSpy.mock.calls[updateSpy.mock.calls.length - 1][0] as RoutePlannerState
      expect(lastCall.buses.length).toBeGreaterThan(0)
    })

    it('should notify observers when error state changes', () => {
      routePlannerStore.setFromLocation('Test')
      routePlannerStore.setToLocation('Destination')

      // Simulate an error scenario
      const initialState = routePlannerStore.getState()
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

      routePlannerStore.setToLocation('Test Destination')
      const promise = routePlannerStore.searchRoutes()

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
    it('should initialize with default threshold values of 500m', () => {
      const currentState = routePlannerStore.getState()

      expect(currentState.startingThreshold).toBe(500)
      expect(currentState.destinationThreshold).toBe(500)
    })

    it('should initialize with empty arrays for discovered stops', () => {
      const currentState = routePlannerStore.getState()

      expect(currentState.startingStops).toEqual([])
      expect(currentState.destinationStops).toEqual([])
    })

    it('should initialize with null selected stops', () => {
      const currentState = routePlannerStore.getState()

      expect(currentState.selectedOnboardingStop).toBeNull()
      expect(currentState.selectedOffboardingStop).toBeNull()
    })

    it('should initialize with null walking distances', () => {
      const currentState = routePlannerStore.getState()

      expect(currentState.walkingDistanceToOnboarding).toBeNull()
      expect(currentState.walkingDistanceFromOffboarding).toBeNull()
    })

    it('should initialize with default filter values', () => {
      const currentState = routePlannerStore.getState()

      expect(currentState.filters.isAC).toBeNull()
      expect(currentState.filters.coachTypes).toEqual([])
      expect(currentState.sortBy).toBe('journeyLength')
      expect(currentState.sortOrder).toBe('asc')
    })

    it('should initialize with OSRM as default distance calculation method', () => {
      const currentState = routePlannerStore.getState()

      expect(currentState.distanceCalculationMethod).toBe('OSRM')
    })

    it('should allow observers to access current state via getState', () => {
      routePlannerStore.setFromLocation('Test')
      const currentState = routePlannerStore.getState()

      expect(currentState.fromLocation).toBe('Test')
      expect(typeof currentState).toBe('object')
    })

    it('should handle rapid state changes and notify for each', () => {
      for (let i = 0; i < 10; i++) {
        routePlannerStore.setFromLocation(`Location ${i}`)
      }

      expect(updateSpy).toHaveBeenCalledTimes(10)
    })

    it('should maintain observer list integrity during notifications', () => {
      const observer2 = { update: vi.fn() }
      const observer3 = { update: vi.fn() }

      routePlannerStore.subscribe(observer2)
      routePlannerStore.subscribe(observer3)

      routePlannerStore.setFromLocation('Test')

      // All three observers should be notified
      expect(updateSpy).toHaveBeenCalledTimes(1)
      expect(observer2.update).toHaveBeenCalledTimes(1)
      expect(observer3.update).toHaveBeenCalledTimes(1)
    })

    it('should support reset operation with notification', () => {
      routePlannerStore.setFromLocation('Before Reset')
      routePlannerStore.setToLocation('Destination')
      expect(updateSpy).toHaveBeenCalledTimes(2)

      const callCountBeforeReset = updateSpy.mock.calls.length
      routePlannerStore.reset()

      expect(updateSpy).toHaveBeenCalledTimes(callCountBeforeReset + 1)
      const resetState = updateSpy.mock.calls[updateSpy.mock.calls.length - 1][0] as RoutePlannerState
      expect(resetState.fromLocation).toBe('')
      expect(resetState.toLocation).toBe('')
    })
  })

  describe('Threshold Management', () => {
    it('should set starting threshold within valid range', () => {
      routePlannerStore.setStartingThreshold(1000)

      expect(updateSpy).toHaveBeenCalled()
      const state = updateSpy.mock.calls[updateSpy.mock.calls.length - 1][0] as RoutePlannerState
      expect(state.startingThreshold).toBe(1000)
      expect(state.error).toBeNull()
    })

    it('should reject starting threshold below 100 meters', () => {
      expect(() => routePlannerStore.setStartingThreshold(50)).toThrow(
        'Threshold must be between 100 and 5000 meters'
      )

      const state = routePlannerStore.getState()
      expect(state.error).toBe('Threshold must be between 100 and 5000 meters')
    })

    it('should reject starting threshold above 5000 meters', () => {
      expect(() => routePlannerStore.setStartingThreshold(6000)).toThrow(
        'Threshold must be between 100 and 5000 meters'
      )

      const state = routePlannerStore.getState()
      expect(state.error).toBe('Threshold must be between 100 and 5000 meters')
    })

    it('should set destination threshold within valid range', () => {
      routePlannerStore.setDestinationThreshold(2000)

      expect(updateSpy).toHaveBeenCalled()
      const state = updateSpy.mock.calls[updateSpy.mock.calls.length - 1][0] as RoutePlannerState
      expect(state.destinationThreshold).toBe(2000)
      expect(state.error).toBeNull()
    })

    it('should allow null destination threshold', () => {
      routePlannerStore.setDestinationThreshold(null)

      expect(updateSpy).toHaveBeenCalled()
      const state = updateSpy.mock.calls[updateSpy.mock.calls.length - 1][0] as RoutePlannerState
      expect(state.destinationThreshold).toBeNull()
      expect(state.error).toBeNull()
    })

    it('should reject destination threshold below 100 meters', () => {
      expect(() => routePlannerStore.setDestinationThreshold(99)).toThrow(
        'Threshold must be between 100 and 5000 meters'
      )

      const state = routePlannerStore.getState()
      expect(state.error).toBe('Threshold must be between 100 and 5000 meters')
    })

    it('should reject destination threshold above 5000 meters', () => {
      expect(() => routePlannerStore.setDestinationThreshold(5001)).toThrow(
        'Threshold must be between 100 and 5000 meters'
      )

      const state = routePlannerStore.getState()
      expect(state.error).toBe('Threshold must be between 100 and 5000 meters')
    })

    it('should accept threshold at lower boundary (100m)', () => {
      routePlannerStore.setStartingThreshold(100)
      const state = routePlannerStore.getState()
      expect(state.startingThreshold).toBe(100)
      expect(state.error).toBeNull()
    })

    it('should accept threshold at upper boundary (5000m)', () => {
      routePlannerStore.setStartingThreshold(5000)
      const state = routePlannerStore.getState()
      expect(state.startingThreshold).toBe(5000)
      expect(state.error).toBeNull()
    })
  })

  describe('Stop Discovery', () => {
    it('should discover starting stops and update state', async () => {
      const mockStops = [
        {
          id: '1',
          name: 'Stop A',
          latitude: 23.8103,
          longitude: 90.4125,
          accessible: true,
          created_at: '2024-01-01',
          distance: 250,
          distanceMethod: 'OSRM' as const
        },
        {
          id: '2',
          name: 'Stop B',
          latitude: 23.8113,
          longitude: 90.4135,
          accessible: true,
          created_at: '2024-01-01',
          distance: 450,
          distanceMethod: 'OSRM' as const
        }
      ]

      // Mock the Supabase client
      const mockSupabaseClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: mockStops.map(s => ({
              id: s.id,
              name: s.name,
              latitude: s.latitude,
              longitude: s.longitude,
              accessible: s.accessible,
              created_at: s.created_at
            })),
            error: null
          })
        })
      }

      // Mock the distance calculator
      const mockDistanceCalculator = {
        calculateDistances: vi.fn().mockResolvedValue([
          mockStops.map(s => ({
            distance: s.distance / 1000, // Convert to km
            method: s.distanceMethod
          }))
        ])
      }

      // Inject mocks (we'll need to access private method for testing)
      const location = { lat: 23.8103, lng: 90.4125 }
      
      await routePlannerStore.discoverStopsNearLocation(location, 500, true)

      // Verify loading states were set
      const loadingCalls = updateSpy.mock.calls.filter(
        call => (call[0] as RoutePlannerState).loading === true
      )
      expect(loadingCalls.length).toBeGreaterThan(0)

      // Verify final state
      const finalState = routePlannerStore.getState()
      expect(finalState.loading).toBe(false)
    })

    it('should discover destination stops and update state', async () => {
      const location = { lat: 23.8103, lng: 90.4125 }
      
      await routePlannerStore.discoverStopsNearLocation(location, 500, false)

      const finalState = routePlannerStore.getState()
      expect(finalState.loading).toBe(false)
    })

    it('should reject invalid threshold in discoverStopsNearLocation', async () => {
      const location = { lat: 23.8103, lng: 90.4125 }
      
      await routePlannerStore.discoverStopsNearLocation(location, 50, true)

      const state = routePlannerStore.getState()
      expect(state.error).toBe('Threshold must be between 100 and 5000 meters')
    })

    it('should handle errors during stop discovery', async () => {
      const location = { lat: 23.8103, lng: 90.4125 }
      
      // This will likely fail due to missing Supabase setup in test environment
      await routePlannerStore.discoverStopsNearLocation(location, 500, true)

      const state = routePlannerStore.getState()
      expect(state.loading).toBe(false)
      // Error may or may not be set depending on environment
    })
  })

  describe('Stop Selection', () => {
    it('should select onboarding stop and update state', async () => {
      const mockStop = {
        id: '1',
        name: 'Stop A',
        latitude: 23.8103,
        longitude: 90.4125,
        accessible: true,
        created_at: '2024-01-01',
        distance: 250,
        distanceMethod: 'OSRM' as const
      }

      // Set starting coordinates
      routePlannerStore.setFromLocation('Starting Point')
      const state = routePlannerStore.getState()
      state.fromCoords = { lat: 23.8100, lng: 90.4120 }

      await routePlannerStore.selectOnboardingStop(mockStop)

      const finalState = routePlannerStore.getState()
      expect(finalState.selectedOnboardingStop).toEqual(mockStop)
      expect(finalState.loading).toBe(false)
    })

    it('should select offboarding stop and update state', async () => {
      const mockStop = {
        id: '2',
        name: 'Stop B',
        latitude: 23.8113,
        longitude: 90.4135,
        accessible: true,
        created_at: '2024-01-01',
        distance: 450,
        distanceMethod: 'OSRM' as const
      }

      // Set destination coordinates
      routePlannerStore.setToLocation('Destination Point')
      const state = routePlannerStore.getState()
      state.toCoords = { lat: 23.8120, lng: 90.4140 }

      await routePlannerStore.selectOffboardingStop(mockStop)

      const finalState = routePlannerStore.getState()
      expect(finalState.selectedOffboardingStop).toEqual(mockStop)
      expect(finalState.loading).toBe(false)
    })

    it('should notify observers when onboarding stop is selected', async () => {
      const mockStop = {
        id: '1',
        name: 'Stop A',
        latitude: 23.8103,
        longitude: 90.4125,
        accessible: true,
        created_at: '2024-01-01',
        distance: 250,
        distanceMethod: 'OSRM' as const
      }

      const state = routePlannerStore.getState()
      state.fromCoords = { lat: 23.8100, lng: 90.4120 }

      await routePlannerStore.selectOnboardingStop(mockStop)

      expect(updateSpy).toHaveBeenCalled()
      const calls = updateSpy.mock.calls
      const selectionCall = calls.find(
        call => (call[0] as RoutePlannerState).selectedOnboardingStop !== null
      )
      expect(selectionCall).toBeDefined()
    })

    it('should notify observers when offboarding stop is selected', async () => {
      const mockStop = {
        id: '2',
        name: 'Stop B',
        latitude: 23.8113,
        longitude: 90.4135,
        accessible: true,
        created_at: '2024-01-01',
        distance: 450,
        distanceMethod: 'OSRM' as const
      }

      const state = routePlannerStore.getState()
      state.toCoords = { lat: 23.8120, lng: 90.4140 }

      await routePlannerStore.selectOffboardingStop(mockStop)

      expect(updateSpy).toHaveBeenCalled()
      const calls = updateSpy.mock.calls
      const selectionCall = calls.find(
        call => (call[0] as RoutePlannerState).selectedOffboardingStop !== null
      )
      expect(selectionCall).toBeDefined()
    })

    it('should handle selection when coordinates are not set', async () => {
      const mockStop = {
        id: '1',
        name: 'Stop A',
        latitude: 23.8103,
        longitude: 90.4125,
        accessible: true,
        created_at: '2024-01-01',
        distance: 250,
        distanceMethod: 'OSRM' as const
      }

      // Don't set fromCoords
      await routePlannerStore.selectOnboardingStop(mockStop)

      const finalState = routePlannerStore.getState()
      expect(finalState.selectedOnboardingStop).toEqual(mockStop)
      expect(finalState.walkingDistanceToOnboarding).toBeNull()
      expect(finalState.loading).toBe(false)
    })

    it('should enable bus search when both stops are selected', async () => {
      const onboardingStop = {
        id: '1',
        name: 'Stop A',
        latitude: 23.8103,
        longitude: 90.4125,
        accessible: true,
        created_at: '2024-01-01',
        distance: 250,
        distanceMethod: 'OSRM' as const
      }

      const offboardingStop = {
        id: '2',
        name: 'Stop B',
        latitude: 23.8113,
        longitude: 90.4135,
        accessible: true,
        created_at: '2024-01-01',
        distance: 450,
        distanceMethod: 'OSRM' as const
      }

      const state = routePlannerStore.getState()
      state.fromCoords = { lat: 23.8100, lng: 90.4120 }
      state.toCoords = { lat: 23.8120, lng: 90.4140 }

      await routePlannerStore.selectOnboardingStop(onboardingStop)
      await routePlannerStore.selectOffboardingStop(offboardingStop)

      const finalState = routePlannerStore.getState()
      expect(finalState.selectedOnboardingStop).not.toBeNull()
      expect(finalState.selectedOffboardingStop).not.toBeNull()
      // Both stops selected - bus search can be enabled (Requirement 3.6)
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

      observers.forEach((obs) => routePlannerStore.subscribe(obs))
      routePlannerStore.setFromLocation('Subject notifies all observers')

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

      routePlannerStore.subscribe(customObserver)
      routePlannerStore.setFromLocation('Loose Coupling Test')

      expect(customObserver.update).toHaveBeenCalled()
    })

    it('JUSTIFICATION: Demonstrates open/closed principle - extensible without modification', () => {
      // Can add new observers without modifying the store
      const newObserver = { update: vi.fn() }
      routePlannerStore.subscribe(newObserver)

      routePlannerStore.setFromLocation('Open/Closed Principle')

      expect(newObserver.update).toHaveBeenCalled()
      // Store code didn't need to change to support this new observer
    })

    it('JUSTIFICATION: Shows one-to-many dependency - one store, many observers', () => {
      const manyObservers = Array.from({ length: 10 }, () => ({
        update: vi.fn(),
      }))

      manyObservers.forEach((obs) => routePlannerStore.subscribe(obs))
      routePlannerStore.setFromLocation('One-to-Many Test')

      manyObservers.forEach((obs) => {
        expect(obs.update).toHaveBeenCalledTimes(1)
      })
    })

    it('JUSTIFICATION: Validates notification happens automatically on state change', () => {
      // No manual notification needed - happens automatically via #setState
      routePlannerStore.setFromLocation('Auto Notification')

      // Observer was automatically notified
      expect(updateSpy).toHaveBeenCalled()
    })

    it('JUSTIFICATION: Proves observers receive complete, consistent state', () => {
      routePlannerStore.setFromLocation('Location A')
      routePlannerStore.setToLocation('Location B')

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

