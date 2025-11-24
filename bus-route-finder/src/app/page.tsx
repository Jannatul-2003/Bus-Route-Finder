// "use client"

// import { useState, useEffect } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { MapPin, NavigationIcon, ArrowRight, Loader2 } from "lucide-react"
// import { Map } from "@/components/map"

// interface Bus {
//   id: string
//   name: string
//   status: string
// }

// interface Stop {
//   id: string
//   name: string
//   latitude: number
//   longitude: number
// }

// interface SearchResult {
//   busId: string
//   busName: string
//   stopId: string
//   stopName: string
//   distance: number
// }

// interface PlannedRoute {
//   from: Stop
//   to: Stop
//   buses: Bus[]
// }

// export default function RoutePlanner() {
//   const [fromLocation, setFromLocation] = useState("")
//   const [toLocation, setToLocation] = useState("")
//   const [fromCoords, setFromCoords] = useState<{ lat: number; lng: number } | null>(null)
//   const [searchResults, setSearchResults] = useState<SearchResult[]>([])
//   const [plannedRoute, setPlannedRoute] = useState<PlannedRoute | null>(null)
//   const [buses, setBuses] = useState<Bus[]>([])
//   const [loading, setLoading] = useState(false)
//   const [mapStops, setMapStops] = useState<Stop[]>([])

//   useEffect(() => {
//     const fetchActiveBuses = async () => {
//       try {
//         const response = await fetch("/api/buses")
//         const data = await response.json()
//         setBuses(data.filter((b: Bus) => b.status === "active"))
//       } catch (error) {
//         console.error("[v0] Error fetching buses:", error)
//       }
//     }
//     fetchActiveBuses()
//   }, [])

//   const handleGetLocation = () => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           setFromLocation("Current Location")
//           setFromCoords({
//             lat: position.coords.latitude,
//             lng: position.coords.longitude,
//           })
//         },
//         (error) => {
//           console.error("Error getting location:", error)
//         },
//       )
//     }
//   }

//   const handleSearch = async () => {
//     if (!toLocation) return

//     setLoading(true)
//     try {
//       // Step 1: Search for destination stop
//       const stopsResponse = await fetch(`/api/stops/search?q=${encodeURIComponent(toLocation)}`)
//       const stops = await stopsResponse.json()

//       if (!stops || stops.length === 0) {
//         console.error("[v0] No stops found for destination")
//         setLoading(false)
//         return
//       }

//       const destinationStop = stops[0]
//       setMapStops([destinationStop])

//       // Step 2: Get buses serving this destination
//       const busesResponse = await fetch(`/api/route-stops/by-stop?stop_id=${destinationStop.id}`)
//       const servingBuses = await busesResponse.json()

//       if (!servingBuses || servingBuses.length === 0) {
//         console.error("[v0] No buses serve this destination")
//         setLoading(false)
//         return
//       }

//       // Step 3: For each bus, find closest stop to "from" location
//       const results: SearchResult[] = []

//       for (const bus of servingBuses) {
//         try {
//           const closestResponse = await fetch(
//             `/api/route-stops/closest?bus_id=${bus.id}&latitude=${fromCoords?.lat || 0}&longitude=${fromCoords?.lng || 0}`,
//           )
//           const closestStop = await closestResponse.json()

//           if (closestStop && closestStop.id) {
//             results.push({
//               busId: bus.id,
//               busName: bus.name,
//               stopId: closestStop.id,
//               stopName: closestStop.name,
//               distance: closestStop.distance,
//             })
//           }
//         } catch (error) {
//           console.error("[v0] Error finding closest stop for bus:", error)
//         }
//       }

//       // Sort by distance
//       results.sort((a, b) => a.distance - b.distance)
//       setSearchResults(results)
//     } catch (error) {
//       console.error("[v0] Error searching routes:", error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleResultClick = async (result: SearchResult) => {
//     // Set the clicked stop as new destination
//     setToLocation(result.stopName)

//     // Fetch the stop details to get coordinates
//     try {
//       const stopsResponse = await fetch(`/api/stops/search?q=${encodeURIComponent(result.stopName)}`)
//       const stops = await stopsResponse.json()
//       if (stops && stops.length > 0) {
//         const stop = stops[0]
//         setMapStops([stop])

//         // Update planned route
//         if (fromCoords) {
//           const bus = buses.find((b) => b.id === result.busId)
//           if (bus) {
//             setPlannedRoute({
//               from: {
//                 id: "current",
//                 name: fromLocation,
//                 latitude: fromCoords.lat,
//                 longitude: fromCoords.lng,
//               },
//               to: stop,
//               buses: [bus],
//             })
//           }
//         }
//       }
//     } catch (error) {
//       console.error("[v0] Error handling result click:", error)
//     }
//   }

//   return (
//     <div className="container mx-auto px-4 py-8 max-w-4xl">
//       <div className="text-center mb-8">
//         <h1 className="text-3xl font-bold text-balance mb-2">Plan Your Journey</h1>
//         <p className="text-muted-foreground text-pretty">
//           Find the best bus routes for your destination with real-time information
//         </p>
//       </div>

//       {/* Route Planning Form */}
//       <Card className="mb-8">
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <MapPin className="h-5 w-5 text-primary" />
//             Route Planner
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <label htmlFor="from" className="text-sm font-medium">
//                 From
//               </label>
//               <div className="flex gap-2">
//                 <Input
//                   id="from"
//                   placeholder="Enter starting location"
//                   value={fromLocation}
//                   onChange={(e) => setFromLocation(e.target.value)}
//                   className="flex-1"
//                 />
//                 <Button variant="outline" size="icon" onClick={handleGetLocation} title="Use current location">
//                   <NavigationIcon className="h-4 w-4" />
//                 </Button>
//               </div>
//             </div>
//             <div className="space-y-2">
//               <label htmlFor="to" className="text-sm font-medium">
//                 To
//               </label>
//               <Input
//                 id="to"
//                 placeholder="Enter destination"
//                 value={toLocation}
//                 onChange={(e) => setToLocation(e.target.value)}
//               />
//             </div>
//           </div>
//           <Button
//             onClick={handleSearch}
//             className="w-full md:w-auto"
//             disabled={!fromLocation || !toLocation || loading}
//           >
//             {loading ? (
//               <>
//                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                 Searching...
//               </>
//             ) : (
//               "Find Routes"
//             )}
//           </Button>
//         </CardContent>
//       </Card>

//       {/* Map Display */}
//       {mapStops.length > 0 && (
//         <Card className="mb-8">
//           <CardHeader>
//             <CardTitle>Route Map</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <Map stops={mapStops} />
//           </CardContent>
//         </Card>
//       )}

//       {/* Search Results */}
//       {searchResults.length > 0 && (
//         <div className="space-y-4 mb-8">
//           <h2 className="text-xl font-semibold">Available Routes ({searchResults.length})</h2>
//           <div className="grid gap-3">
//             {searchResults.map((result, index) => (
//               <Card
//                 key={index}
//                 className="cursor-pointer hover:shadow-md transition-shadow"
//                 onClick={() => handleResultClick(result)}
//               >
//                 <CardContent className="p-4">
//                   <div className="flex items-center justify-between">
//                     <div className="flex-1">
//                       <h3 className="font-semibold text-lg">{result.busName}</h3>
//                       <p className="text-sm text-muted-foreground">{result.stopName}</p>
//                     </div>
//                     <div className="text-right">
//                       <p className="font-medium text-primary">{result.distance.toFixed(2)} km</p>
//                       <ArrowRight className="h-4 w-4 text-muted-foreground mt-1" />
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Planned Route Display */}
//       {plannedRoute && (
//         <Card>
//           <CardHeader>
//             <CardTitle>Your Planned Route</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div className="flex items-center gap-4">
//               <div className="flex-1">
//                 <p className="text-sm text-muted-foreground">From</p>
//                 <p className="font-semibold">{plannedRoute.from.name}</p>
//               </div>
//               <ArrowRight className="h-5 w-5 text-primary" />
//               <div className="flex-1">
//                 <p className="text-sm text-muted-foreground">To</p>
//                 <p className="font-semibold">{plannedRoute.to.name}</p>
//               </div>
//             </div>
//             <div className="pt-4 border-t">
//               <p className="text-sm font-medium mb-2">Buses:</p>
//               <div className="space-y-2">
//                 {plannedRoute.buses.map((bus) => (
//                   <div key={bus.id} className="flex items-center gap-2 text-sm">
//                     <div className="w-2 h-2 rounded-full bg-primary" />
//                     {bus.name}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   )
// }
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, NavigationIcon, Loader2, AlertCircle, Moon, Sun, Search } from "lucide-react"
import { Map } from "@/components/map"
import { ThresholdInput } from "@/components/ThresholdInput"
import { StopSelectionCard } from "@/components/StopSelectionCard"
import { BusResultCard } from "@/components/BusResultCard"
import { FilterControls } from "@/components/FilterControls"
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

export default function RoutePlannerPage() {
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

  // Handlers
  const handleGetLocation = () => {
    routePlannerStore.handleGetLocation()
  }

  const handleSearchStops = async () => {
    if (!state.fromLocation || !state.toLocation) {
      console.log("[DEBUG] Missing location inputs:", { fromLocation: state.fromLocation, toLocation: state.toLocation })
      return
    }

    console.log("[DEBUG] Starting search with:", { 
      fromLocation: state.fromLocation, 
      toLocation: state.toLocation,
      fromCoords: state.fromCoords,
      toCoords: state.toCoords,
      startingThreshold: state.startingThreshold,
      destinationThreshold: state.destinationThreshold
    })

    try {
      let fromCoords = state.fromCoords
      let toCoords = state.toCoords

      // Geocode starting location if coordinates not set
      if (!fromCoords && state.fromLocation !== "Current Location") {
        console.log("[DEBUG] Geocoding starting location:", state.fromLocation)
        fromCoords = await geocodeLocation(state.fromLocation)
        if (!fromCoords) {
          routePlannerStore.setError(
            `Could not find coordinates for "${state.fromLocation}". Please try a more specific location name.`
          )
          return
        }
        console.log("[DEBUG] Geocoded fromCoords:", fromCoords)
        // Store the coordinates in the store so they can be used for walking distance calculation
        routePlannerStore.setFromCoords(fromCoords)
      }

      // Geocode destination location if coordinates not set
      if (!toCoords) {
        console.log("[DEBUG] Geocoding destination location:", state.toLocation)
        toCoords = await geocodeLocation(state.toLocation)
        if (!toCoords) {
          routePlannerStore.setError(
            `Could not find coordinates for "${state.toLocation}". Please try a more specific location name.`
          )
          return
        }
        console.log("[DEBUG] Geocoded toCoords:", toCoords)
        // Store the coordinates in the store so they can be used for walking distance calculation
        routePlannerStore.setToCoords(toCoords)
      }

      if (!fromCoords || !toCoords) {
        console.log("[DEBUG] Missing coordinates:", { fromCoords, toCoords })
        return
      }

      // Discover stops near starting location
      console.log("[DEBUG] Discovering stops near starting location:", fromCoords, state.startingThreshold)
      await routePlannerStore.discoverStopsNearLocation(
        fromCoords,
        state.startingThreshold,
        true
      )
      console.log("[DEBUG] Starting stops discovered:", state.startingStops.length)

      // Discover stops near destination location
      if (state.destinationThreshold !== null) {
        console.log("[DEBUG] Discovering stops near destination location:", toCoords, state.destinationThreshold)
        await routePlannerStore.discoverStopsNearLocation(
          toCoords,
          state.destinationThreshold,
          false
        )
        console.log("[DEBUG] Destination stops discovered:", state.destinationStops.length)
      }
    } catch (error) {
      console.error("[DEBUG] Error searching stops:", error)
      routePlannerStore.setError(`Error searching stops: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Geocode a location name to coordinates using Nominatim (OpenStreetMap)
   * This allows users to enter any place name, not just bus stop names
   */
  const geocodeLocation = async (locationName: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      // Use Nominatim API for geocoding (free, no API key required)
      // Bias results towards Dhaka, Bangladesh
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(locationName + ", Dhaka, Bangladesh")}` +
        `&format=json` +
        `&limit=1` +
        `&countrycodes=bd`
      )
      
      if (!response.ok) {
        console.error("[DEBUG] Geocoding API error:", response.status)
        return null
      }

      const results = await response.json()
      console.log("[DEBUG] Geocoding results:", results)

      if (results && results.length > 0) {
        return {
          lat: parseFloat(results[0].lat),
          lng: parseFloat(results[0].lon)
        }
      }

      return null
    } catch (error) {
      console.error("[DEBUG] Geocoding error:", error)
      return null
    }
  }

  const handleOnboardingStopSelect = async (stop: StopWithDistance) => {
    await routePlannerStore.selectOnboardingStop(stop)
  }

  const handleOffboardingStopSelect = async (stop: StopWithDistance) => {
    console.log("[DEBUG] Offboarding stop selected:", stop)
    await routePlannerStore.selectOffboardingStop(stop)

    // Get the latest state after selection
    const latestState = routePlannerStore.getState()
    console.log("[DEBUG] Latest state after offboarding selection:", {
      onboarding: latestState.selectedOnboardingStop?.name,
      offboarding: latestState.selectedOffboardingStop?.name
    })
    
    // Don't automatically search - user will click "Find Buses" button
  }

  const handleFindBuses = async () => {
    console.log("[DEBUG] Find Buses clicked")
    
    // If no offboarding stop is selected and no destination threshold is set,
    // we need to find a stop matching the destination location name
    if (!state.selectedOffboardingStop) {
      console.log("[DEBUG] No offboarding stop selected, searching by destination name")
      
      // Search for a stop matching the destination location
      try {
        const response = await fetch(`/api/stops/search?q=${encodeURIComponent(state.toLocation)}`)
        if (response.ok) {
          const stops = await response.json()
          console.log("[DEBUG] Found destination stops by name:", stops)
          
          if (stops && stops.length > 0) {
            // Use the first matching stop as the offboarding stop
            const destinationStop = stops[0]
            
            // Create a StopWithDistance object (distance = 0 since we're matching by name)
            const offboardingStop = {
              ...destinationStop,
              distance: 0,
              distanceMethod: 'OSRM' as const
            }
            
            console.log("[DEBUG] Auto-selecting offboarding stop:", offboardingStop.name)
            await routePlannerStore.selectOffboardingStop(offboardingStop)
          } else {
            routePlannerStore.setError(
              `No stop found matching "${state.toLocation}". Please try a different name or set a destination threshold to find nearby stops.`
            )
            return
          }
        }
      } catch (error) {
        console.error("[DEBUG] Error searching for destination stop:", error)
        routePlannerStore.setError(`Error finding destination stop: ${error instanceof Error ? error.message : String(error)}`)
        return
      }
    }
    
    // Now search for buses
    const latestState = routePlannerStore.getState()
    if (latestState.selectedOnboardingStop && latestState.selectedOffboardingStop) {
      console.log("[DEBUG] Searching for buses between stops...")
      await routePlannerStore.searchBusesForRoute()
      
      const finalState = routePlannerStore.getState()
      console.log("[DEBUG] Bus search completed, available buses:", finalState.availableBuses.length)
    }
  }

  const handleRetry = () => {
    // Clear error and retry the last action
    handleSearchStops()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                🚌 Dhaka Bus Route Planner
              </h1>
              <p className="text-muted-foreground">
                Find the best bus routes with threshold-based stop discovery
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle dark mode"
              className="shrink-0"
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
        <div className="container mx-auto px-4 py-4">
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-destructive">Error</p>
                <p className="text-sm text-destructive/90">{state.error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="shrink-0"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Inputs and Controls */}
          <div className="space-y-6">
            {/* Location Inputs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
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
                      placeholder="e.g., Merul Badda, Dhanmondi 27, Gulshan Circle"
                      value={state.fromLocation}
                      onChange={(e) =>
                        routePlannerStore.setFromLocation(e.target.value)
                      }
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleGetLocation}
                      title="Use current location"
                      aria-label="Get current location"
                    >
                      <NavigationIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter any location in Dhaka - we'll find nearby bus stops
                  </p>
                </div>

                {/* Destination Location */}
                <div className="space-y-2">
                  <label htmlFor="to" className="text-sm font-medium">
                    Destination Location
                  </label>
                  <Input
                    id="to"
                    placeholder="e.g., Badda, Mohakhali, Uttara"
                    value={state.toLocation}
                    onChange={(e) =>
                      routePlannerStore.setToLocation(e.target.value)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter any location in Dhaka - we'll find nearby bus stops
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
                  onChange={(value) =>
                    routePlannerStore.setStartingThreshold(value || 500)
                  }
                  allowNoThreshold={false}
                />
                <ThresholdInput
                  label="Destination Location Threshold"
                  value={state.destinationThreshold}
                  onChange={(value) =>
                    routePlannerStore.setDestinationThreshold(value)
                  }
                  allowNoThreshold={true}
                />
              </CardContent>
            </Card>

            {/* Search Button */}
            <Button
              onClick={handleSearchStops}
              className="w-full"
              size="lg"
              disabled={
                !state.fromLocation || !state.toLocation || state.loading
              }
            >
              {state.loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search Stops
                </>
              )}
            </Button>

            {/* Find Buses Button - Shows when onboarding stop is selected */}
            {state.selectedOnboardingStop && (
              <Button
                onClick={handleFindBuses}
                className="w-full"
                size="lg"
                variant="default"
                disabled={state.loading}
              >
                {state.loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Finding Buses...
                  </>
                ) : (
                  <>
                    🚌 Find Buses
                  </>
                )}
              </Button>
            )}

            {/* Stop Selection */}
            {(state.startingStops.length > 0 ||
              state.destinationStops.length > 0) && (
              <div className="space-y-6">
                {/* Starting Stops */}
                {state.startingStops.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        📍 Nearby Stops (Starting Location)
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {state.startingStops.length} stop(s) found within{" "}
                        {state.startingThreshold}m
                      </p>
                    </CardHeader>
                    <CardContent>
                      {state.loading ? (
                        <div className="space-y-3">
                          <StopCardSkeleton />
                          <StopCardSkeleton />
                          <StopCardSkeleton />
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
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
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Destination Stops */}
                {state.destinationStops.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        🎯 Nearby Stops (Destination)
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {state.destinationStops.length} stop(s) found
                        {state.destinationThreshold !== null
                          ? ` within ${state.destinationThreshold}m`
                          : ""}
                      </p>
                    </CardHeader>
                    <CardContent>
                      {state.loading ? (
                        <div className="space-y-3">
                          <StopCardSkeleton />
                          <StopCardSkeleton />
                          <StopCardSkeleton />
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
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
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Map */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-base">🗺️ Map View</CardTitle>
              </CardHeader>
              <CardContent>
                <Map
                  stops={[
                    ...state.startingStops,
                    ...state.destinationStops,
                  ]}
                  center={
                    state.fromCoords || { lat: 23.8103, lng: 90.4125 }
                  }
                  zoom={12}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bus Results Section (Full Width) */}
        {state.allBuses.length > 0 && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                🚌 Available Buses
              </h2>
              <p className="text-sm text-muted-foreground">
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

            {/* Bus Results */}
            {state.loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BusCardSkeleton />
                <BusCardSkeleton />
                <BusCardSkeleton />
                <BusCardSkeleton />
              </div>
            ) : state.availableBuses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state.availableBuses.map((bus) => (
                  <BusResultCard key={bus.id} bus={bus} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="rounded-full bg-muted p-6">
                      <svg
                        className="size-4 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No buses match your filters
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        {state.allBuses.length} bus(es) found, but none match your current filter settings.
                        Try adjusting or clearing your filters.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State for No Buses Found (before filtering) */}
        {state.selectedOnboardingStop &&
          state.selectedOffboardingStop &&
          state.allBuses.length === 0 &&
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
      </div>
    </div>
  )
}
