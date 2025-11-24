"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, NavigationIcon, Loader2, AlertCircle, Moon, Sun, Search } from "lucide-react"
import { Map } from "@/components/map"
import { ThresholdInput } from "@/components/ThresholdInput"
import { StopSelectionCard } from "@/components/StopSelectionCard"
import { VirtualizedStopList } from "@/components/VirtualizedStopList"
import { BusResultCard } from "@/components/BusResultCard"
import { FilterControls } from "@/components/FilterControls"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { routePlannerStore } from "@/lib/stores/routePlannerStore"
import type { StopWithDistance } from "@/lib/types/database"

/**
 * Skeleton loader for stop cards
 */
function StopCardSkeleton() {
  return (
    <div className="rounded-lg border p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="size-5 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
        <div className="h-6 w-16 bg-muted rounded" />
      </div>
    </div>
  )
}

/**
 * Skeleton loader for bus result cards
 */
function BusCardSkeleton() {
  return (
    <div className="rounded-lg border p-4 animate-pulse">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-muted rounded" />
              <div className="h-5 w-20 bg-muted rounded" />
            </div>
          </div>
          <div className="h-8 w-20 bg-muted rounded" />
        </div>
        <div className="h-12 bg-muted/30 rounded" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded" />
        </div>
      </div>
    </div>
  )
}

/**
 * Route Planner Page Component
 * Requirements 8.4: Wrapped with Error Boundary for component error handling
 */
function RoutePlannerPageContent() {
  const [state, setState] = React.useState(routePlannerStore.getState())
  const [darkMode, setDarkMode] = React.useState(false)

  // Subscribe to store updates
  React.useEffect(() => {
    const observer = {
      update: (newState: typeof state) => {
        setState(newState)
      }
    }
    
    routePlannerStore.subscribe(observer)

    // Initialize store
    routePlannerStore.ensureInitialized()

    return () => {
      routePlannerStore.unsubscribe(observer)
    }
  }, [])

  // Dark mode toggle
  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  // Track if a search has been performed
  const [hasSearched, setHasSearched] = React.useState(false)

  // Screen reader announcements
  const [announcement, setAnnouncement] = React.useState("")

  const announce = (message: string) => {
    setAnnouncement(message)
    // Clear after announcement is read
    setTimeout(() => setAnnouncement(""), 1000)
  }

  // Handlers
  const handleGetLocation = () => {
    routePlannerStore.handleGetLocation()
  }

  const handleSearchStops = async () => {
    if (!state.fromLocation || !state.toLocation) {
      return
    }

    setHasSearched(true)
    announce("Searching for nearby stops")

    try {
      // If coordinates are not set, search for stops by name to get coordinates
      let fromCoords = state.fromCoords
      let toCoords = state.toCoords

      // Search for starting location if coordinates not set
      if (!fromCoords && state.fromLocation !== "Current Location") {
        const response = await fetch(`/api/stops/search?q=${encodeURIComponent(state.fromLocation)}`)
        if (response.ok) {
          const stops = await response.json()
          if (stops && stops.length > 0) {
            fromCoords = {
              lat: stops[0].latitude,
              lng: stops[0].longitude
            }
          } else {
            announce("Starting location not found")
            return
          }
        }
      }

      // Search for destination location if coordinates not set
      if (!toCoords) {
        const response = await fetch(`/api/stops/search?q=${encodeURIComponent(state.toLocation)}`)
        if (response.ok) {
          const stops = await response.json()
          if (stops && stops.length > 0) {
            toCoords = {
              lat: stops[0].latitude,
              lng: stops[0].longitude
            }
          } else {
            announce("Destination location not found")
            return
          }
        }
      }

      if (!fromCoords || !toCoords) {
        announce("Please provide valid locations")
        return
      }

      // Discover stops near starting location
      await routePlannerStore.discoverStopsNearLocation(
        fromCoords,
        state.startingThreshold,
        true
      )

      // Discover stops near destination location
      if (state.destinationThreshold !== null) {
        await routePlannerStore.discoverStopsNearLocation(
          toCoords,
          state.destinationThreshold,
          false
        )
      }

      const totalStops = state.startingStops.length + state.destinationStops.length
      announce(`Search complete. Found ${totalStops} stops.`)
    } catch (error) {
      console.error("Error searching stops:", error)
      announce("Error searching for stops")
    }
  }

  // Handle threshold changes - re-discover stops if search has been performed
  // Requirement 1.5: Threshold change reactivity
  const handleStartingThresholdChange = async (value: number | null) => {
    if (value === null) return
    
    routePlannerStore.setStartingThreshold(value)
    
    // Re-discover stops if a search has already been performed
    if (hasSearched && state.fromCoords) {
      await routePlannerStore.discoverStopsNearLocation(
        state.fromCoords,
        value,
        true
      )
    }
  }

  const handleDestinationThresholdChange = async (value: number | null) => {
    routePlannerStore.setDestinationThreshold(value)
    
    // Re-discover stops if a search has already been performed
    if (hasSearched && state.toCoords) {
      if (value !== null) {
        await routePlannerStore.discoverStopsNearLocation(
          state.toCoords,
          value,
          false
        )
      }
    }
  }

  const handleOnboardingStopSelect = async (stop: StopWithDistance) => {
    await routePlannerStore.selectOnboardingStop(stop)
    announce(`Selected onboarding stop: ${stop.name}`)
  }

  const handleOffboardingStopSelect = async (stop: StopWithDistance) => {
    await routePlannerStore.selectOffboardingStop(stop)
    announce(`Selected offboarding stop: ${stop.name}`)

    // Automatically search for buses when both stops are selected
    if (state.selectedOnboardingStop) {
      announce("Searching for bus routes")
      await routePlannerStore.searchBusesForRoute()
      announce(`Found ${state.availableBuses.length} bus routes`)
    }
  }

  const handleRetry = () => {
    // Clear error and retry the last action
    handleSearchStops()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to main content link for keyboard navigation */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Header - Responsive for mobile */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                🚌 Dhaka Bus Route Planner
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                Find the best bus routes with threshold-based stop discovery
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle dark mode"
              className="shrink-0 min-w-[44px] min-h-[44px]"
            >
              {darkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="container mx-auto px-4 py-4" role="alert" aria-live="assertive">
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-semibold text-destructive">Error</p>
                <p className="text-sm text-destructive/90">{state.error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="shrink-0"
                aria-label="Retry search"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content - Mobile-first responsive layout */}
      <main id="main-content" className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column: Inputs and Controls - Responsive spacing */}
          <div className="space-y-4 sm:space-y-6">
            {/* Location Inputs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
                  Location Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Starting Location */}
                <div className="space-y-2">
                  <label htmlFor="from" className="text-sm font-medium">
                    Starting Location
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="from"
                      placeholder="Enter starting location"
                      value={state.fromLocation}
                      onChange={(e) =>
                        routePlannerStore.setFromLocation(e.target.value)
                      }
                      className="flex-1 min-h-[48px] text-base"
                      aria-required="true"
                      aria-describedby="from-description"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleGetLocation}
                      title="Use current location"
                      aria-label="Get current location"
                      className="min-w-[48px] min-h-[48px] shrink-0"
                    >
                      <NavigationIcon className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                  <p id="from-description" className="sr-only">
                    Enter your starting location or use the button to get your current location
                  </p>
                </div>

                {/* Destination Location */}
                <div className="space-y-2">
                  <label htmlFor="to" className="text-sm font-medium">
                    Destination Location
                  </label>
                  <Input
                    id="to"
                    placeholder="Enter destination"
                    value={state.toLocation}
                    onChange={(e) =>
                      routePlannerStore.setToLocation(e.target.value)
                    }
                    className="min-h-[48px] text-base"
                    aria-required="true"
                    aria-describedby="to-description"
                  />
                  <p id="to-description" className="sr-only">
                    Enter your destination location
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Threshold Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Threshold Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ThresholdInput
                  label="Starting Location Threshold"
                  value={state.startingThreshold}
                  onChange={handleStartingThresholdChange}
                  allowNoThreshold={false}
                />
                <ThresholdInput
                  label="Destination Location Threshold"
                  value={state.destinationThreshold}
                  onChange={handleDestinationThresholdChange}
                  allowNoThreshold={true}
                />
              </CardContent>
            </Card>

            {/* Search Button - Touch-optimized */}
            <Button
              onClick={handleSearchStops}
              className="w-full min-h-[52px] text-base"
              size="lg"
              disabled={
                !state.fromLocation || !state.toLocation || state.loading
              }
              aria-label={state.loading ? "Searching for stops" : "Search for nearby stops"}
              aria-busy={state.loading}
            >
              {state.loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" aria-hidden="true" />
                  Search Stops
                </>
              )}
            </Button>

            {/* Walking Distance Display */}
            {(state.selectedOnboardingStop || state.selectedOffboardingStop) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">🚶 Walking Distances</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3" role="region" aria-label="Walking distances information">
                  {/* Walking distance to onboarding stop */}
                  {state.selectedOnboardingStop && state.walkingDistanceToOnboarding !== null && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <svg
                          className="size-5 text-muted-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          />
                        </svg>
                        <span className="text-sm font-medium">To {state.selectedOnboardingStop.name}</span>
                      </div>
                      <span className="text-sm font-semibold">
                        {state.walkingDistanceToOnboarding < 1000
                          ? `${Math.round(state.walkingDistanceToOnboarding)}m`
                          : `${(state.walkingDistanceToOnboarding / 1000).toFixed(2)}km`}
                      </span>
                    </div>
                  )}

                  {/* Walking distance from offboarding stop */}
                  {state.selectedOffboardingStop && state.walkingDistanceFromOffboarding !== null && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <svg
                          className="size-5 text-muted-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                          />
                        </svg>
                        <span className="text-sm font-medium">From {state.selectedOffboardingStop.name}</span>
                      </div>
                      <span className="text-sm font-semibold">
                        {state.walkingDistanceFromOffboarding < 1000
                          ? `${Math.round(state.walkingDistanceFromOffboarding)}m`
                          : `${(state.walkingDistanceFromOffboarding / 1000).toFixed(2)}km`}
                      </span>
                    </div>
                  )}

                  {/* Warning for excessive walking distance (Requirement 9.5) */}
                  {((state.walkingDistanceToOnboarding !== null && state.walkingDistanceToOnboarding > 2000) ||
                    (state.walkingDistanceFromOffboarding !== null && state.walkingDistanceFromOffboarding > 2000)) && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20" role="alert" aria-live="polite">
                      <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                          Long Walking Distance
                        </p>
                        <p className="text-xs text-orange-800 dark:text-orange-300 mt-1">
                          One or more walking distances exceed 2km. Consider selecting closer stops or adjusting your thresholds.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Stop Selection */}
            {(state.startingStops.length > 0 ||
              state.destinationStops.length > 0 ||
              (state.fromCoords && state.toCoords && !state.loading)) && (
              <div className="space-y-4 sm:space-y-6">
                {/* Starting Stops */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      📍 Nearby Stops (Starting Location)
                    </CardTitle>
                    {state.startingStops.length > 0 && (
                      <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
                        {state.startingStops.length} stop(s) found within{" "}
                        {state.startingThreshold}m
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {state.loading ? (
                      <div className="space-y-3">
                        <StopCardSkeleton />
                        <StopCardSkeleton />
                        <StopCardSkeleton />
                      </div>
                    ) : state.startingStops.length > 0 ? (
                      // Use virtualization for performance when there are many stops
                      state.startingStops.length > 10 ? (
                        <VirtualizedStopList
                          stops={state.startingStops}
                          selectedStopId={state.selectedOnboardingStop?.id || null}
                          onSelect={handleOnboardingStopSelect}
                          selectionMode="radio"
                          role="radiogroup"
                          ariaLabel="Select onboarding stop"
                        />
                      ) : (
                        <div className="space-y-3 max-h-[60vh] sm:max-h-96 overflow-y-auto" role="radiogroup" aria-label="Select onboarding stop">
                          {state.startingStops.map((stop) => (
                            <StopSelectionCard
                              key={stop.id}
                              stop={stop}
                              isSelected={
                                state.selectedOnboardingStop?.id === stop.id
                              }
                              onSelect={handleOnboardingStopSelect}
                              selectionMode="radio"
                            />
                          ))}
                        </div>
                      )
                    ) : (
                      <div className="text-center py-8">
                        <div className="flex flex-col items-center gap-3">
                          <div className="rounded-full bg-muted p-4">
                            <svg
                              className="size-8 text-muted-foreground"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              No stops found
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Try increasing the threshold or selecting a
                              different location
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Destination Stops */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      🎯 Nearby Stops (Destination)
                    </CardTitle>
                    {state.destinationStops.length > 0 && (
                      <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
                        {state.destinationStops.length} stop(s) found
                        {state.destinationThreshold !== null
                          ? ` within ${state.destinationThreshold}m`
                          : ""}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {state.loading ? (
                      <div className="space-y-3">
                        <StopCardSkeleton />
                        <StopCardSkeleton />
                        <StopCardSkeleton />
                      </div>
                    ) : state.destinationStops.length > 0 ? (
                      // Use virtualization for performance when there are many stops
                      state.destinationStops.length > 10 ? (
                        <VirtualizedStopList
                          stops={state.destinationStops}
                          selectedStopId={state.selectedOffboardingStop?.id || null}
                          onSelect={handleOffboardingStopSelect}
                          selectionMode="radio"
                          role="radiogroup"
                          ariaLabel="Select offboarding stop"
                        />
                      ) : (
                        <div className="space-y-3 max-h-[60vh] sm:max-h-96 overflow-y-auto" role="radiogroup" aria-label="Select offboarding stop">
                          {state.destinationStops.map((stop) => (
                            <StopSelectionCard
                              key={stop.id}
                              stop={stop}
                              isSelected={
                                state.selectedOffboardingStop?.id === stop.id
                              }
                              onSelect={handleOffboardingStopSelect}
                              selectionMode="radio"
                            />
                          ))}
                        </div>
                      )
                    ) : (
                      <div className="text-center py-8">
                        <div className="flex flex-col items-center gap-3">
                          <div className="rounded-full bg-muted p-4">
                            <svg
                              className="size-8 text-muted-foreground"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              No stops found
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {state.destinationThreshold === null
                                ? "Click 'Search Stops' to find all stops"
                                : "Try increasing the threshold or selecting a different location"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right Column: Map - Responsive positioning */}
          <div className="space-y-4 sm:space-y-6 order-first lg:order-last">
            <Card className="lg:sticky lg:top-6">
              <CardHeader>
                <CardTitle className="text-base">🗺️ Map View</CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                <Map
                  stops={[
                    ...state.startingStops,
                    ...state.destinationStops,
                  ]}
                  startingLocation={state.fromCoords}
                  destinationLocation={state.toCoords}
                  selectedOnboardingStop={state.selectedOnboardingStop}
                  selectedOffboardingStop={state.selectedOffboardingStop}
                  center={
                    state.fromCoords || { lat: 23.8103, lng: 90.4125 }
                  }
                  zoom={12}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bus Results Section (Full Width) - Responsive */}
        {state.allBuses.length > 0 && (
          <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" role="region" aria-label="Bus search results">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                🚌 Available Buses
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground" role="status" aria-live="polite">
                Showing {state.availableBuses.length} of {state.allBuses.length} bus(es)
              </p>
            </div>

            {/* Filter Controls */}
            <FilterControls
              acFilter={state.filters.isAC}
              onACFilterChange={(filter) =>
                routePlannerStore.setACFilter(filter)
              }
              coachTypeFilter={state.filters.coachTypes}
              onCoachTypeFilterChange={(types) =>
                routePlannerStore.setCoachTypeFilter(types)
              }
              sortBy={state.sortBy}
              onSortByChange={(sortBy) => routePlannerStore.setSortBy(sortBy)}
              sortOrder={state.sortOrder}
              onSortOrderChange={(order) =>
                routePlannerStore.setSortOrder(order)
              }
            />

            {/* Bus Results - Responsive grid */}
            {state.loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4" aria-busy="true" aria-label="Loading bus results">
                <BusCardSkeleton />
                <BusCardSkeleton />
                <BusCardSkeleton />
                <BusCardSkeleton />
              </div>
            ) : state.availableBuses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4" role="list" aria-label="Available bus routes">
                {state.availableBuses.map((bus) => (
                  <div key={bus.id} role="listitem">
                    <BusResultCard bus={bus} />
                  </div>
                ))}
              </div>
            ) : (
              // Empty state when filters eliminate all results
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="rounded-full bg-muted p-6">
                      <svg
                        className="size-12 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No buses match your filters
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Try adjusting your filter criteria to see more results. There are {state.allBuses.length} total bus(es) available.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State for Bus Results */}
        {state.selectedOnboardingStop &&
          state.selectedOffboardingStop &&
          state.availableBuses.length === 0 &&
          !state.loading && (
            <div className="mt-8">
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="rounded-full bg-muted p-6">
                      <svg
                        className="size-12 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No buses found
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        No direct bus routes available between the selected
                        stops. Try selecting different stops or adjusting your
                        thresholds.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
      </main>
    </div>
  )
}


/**
 * Route Planner Page with Error Boundary
 * Requirements 8.4: React error boundaries for component errors
 */
export default function RoutePlannerPage() {
  return (
    <ErrorBoundary>
      <RoutePlannerPageContent />
    </ErrorBoundary>
  )
}
