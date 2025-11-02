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

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, NavigationIcon, ArrowRight, Loader2, AlertCircle } from "lucide-react"
import { Map } from "@/components/map"

interface Bus {
  id: string
  name: string
  status: string
}

interface Stop {
  id: string
  name: string
  latitude: number
  longitude: number
}

interface SearchResult {
  busId: string
  busName: string
  stopId: string
  stopName: string
  distance: number
}

interface PlannedRoute {
  from: Stop
  to: Stop
  buses: Bus[]
}

export default function RoutePlanner() {
  const [fromLocation, setFromLocation] = useState("")
  const [toLocation, setToLocation] = useState("")
  const [fromCoords, setFromCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [plannedRoute, setPlannedRoute] = useState<PlannedRoute | null>(null)
  const [buses, setBuses] = useState<Bus[]>([])
  const [loading, setLoading] = useState(false)
  const [mapStops, setMapStops] = useState<Stop[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActiveBuses = async () => {
      try {
        const response = await fetch("/api/buses")
        if (!response.ok) {
          const text = await response.text()
          throw new Error(`API error: ${response.status} - ${text}`)
        }
        const data = await response.json()
        setBuses(data.filter((b: Bus) => b.status === "active"))
      } catch (error) {
        console.error("[v0] Error fetching buses:", error)
        setError("Failed to load buses. Please check your Supabase configuration.")
      }
    }
    fetchActiveBuses()
  }, [])

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFromLocation("Current Location")
          setFromCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Error getting location:", error)
          setError("Unable to get your current location")
        },
      )
    }
  }

  const safeJsonFetch = async (url: string) => {
    const response = await fetch(url)
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`API error: ${response.status} - ${text}`)
    }
    return response.json()
  }

  const handleSearch = async () => {
    if (!toLocation) return

    setLoading(true)
    setError(null)
    
    try {
      // If no coordinates yet, try to fetch them from the fromLocation input
      let searchCoords = fromCoords
      
      if (!searchCoords && fromLocation && fromLocation !== "Current Location") {
        try {
          const fromStops = await safeJsonFetch(`/api/stops/search?q=${encodeURIComponent(fromLocation)}`)
          
          if (!fromStops || fromStops.length === 0) {
            setError("Starting location not found. Please use 'Current Location' or enter a valid stop name")
            setLoading(false)
            return
          }
          
          // Use the first matching stop's coordinates
          searchCoords = {
            lat: fromStops[0].latitude,
            lng: fromStops[0].longitude,
          }
          setFromCoords(searchCoords)
        } catch (error) {
          console.error("[v0] Error fetching from location:", error)
          setError("Could not find starting location. Please try 'Current Location' instead")
          setLoading(false)
          return
        }
      }
      
      // Validate that we have valid coordinates
      if (!searchCoords || searchCoords.lat === 0 || searchCoords.lng === 0) {
        setError("Please use 'Current Location' button or enter a valid stop name")
        setLoading(false)
        return
      }
      // Step 1: Search for destination stop
      const stops = await safeJsonFetch(`/api/stops/search?q=${encodeURIComponent(toLocation)}`)

      if (!stops || stops.length === 0) {
        setError("No stops found for that destination")
        setLoading(false)
        return
      }

      const destinationStop = stops[0]
      setMapStops([destinationStop])

      // Step 2: Get buses serving this destination
      const servingBuses = await safeJsonFetch(`/api/route-stops/by-stop?stop_id=${destinationStop.id}`)

      if (!servingBuses || servingBuses.length === 0) {
        setError("No buses serve this destination")
        setLoading(false)
        return
      }

      // Step 3: For each bus, find closest stop to "from" location
      const results: SearchResult[] = []

      for (const bus of servingBuses) {
        try {
          const closestStop = await safeJsonFetch(
            `/api/route-stops/closest?bus_id=${bus.id}&latitude=${searchCoords.lat}&longitude=${searchCoords.lng}`,
          )

          if (closestStop && closestStop.id) {
            results.push({
              busId: bus.id,
              busName: bus.name,
              stopId: closestStop.id,
              stopName: closestStop.name,
              distance: closestStop.distance,
            })
          }
        } catch (error) {
          console.error("[v0] Error finding closest stop for bus:", error)
        }
      }

      // Sort by distance
      results.sort((a, b) => a.distance - b.distance)
      setSearchResults(results)
    } catch (error) {
      console.error("[v0] Error searching routes:", error)
      setError(`Error searching routes: ${String(error)}`)
    } finally {
      setLoading(false)
    }
  }


  const handleResultClick = async (result: SearchResult) => {
    // Set the clicked stop as new destination
    setToLocation(result.stopName)

    // Fetch the stop details to get coordinates
    try {
      const stops = await safeJsonFetch(`/api/stops/search?q=${encodeURIComponent(result.stopName)}`)
      if (stops && stops.length > 0) {
        const stop = stops[0]
        setMapStops([stop])

        // Update planned route
        if (fromCoords) {
          const bus = buses.find((b) => b.id === result.busId)
          if (bus) {
            setPlannedRoute({
              from: {
                id: "current",
                name: fromLocation,
                latitude: fromCoords.lat,
                longitude: fromCoords.lng,
              },
              to: stop,
              buses: [bus],
            })
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error handling result click:", error)
      setError(`Error loading stop details: ${String(error)}`)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-balance mb-2">Plan Your Journey</h1>
        <p className="text-muted-foreground text-pretty">
          Find the best bus routes for your destination with real-time information
        </p>
      </div>

      {error && (
        <Card className="mb-8 border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Route Planning Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Route Planner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="from" className="text-sm font-medium">
                From
              </label>
              <div className="flex gap-2">
                <Input
                  id="from"
                  placeholder="Enter starting location"
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={handleGetLocation} title="Use current location">
                  <NavigationIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="to" className="text-sm font-medium">
                To
              </label>
              <Input
                id="to"
                placeholder="Enter destination"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={handleSearch}
            className="w-full md:w-auto"
            disabled={!fromLocation || !toLocation || loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              "Find Routes"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Map Display */}
      {mapStops.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Route Map</CardTitle>
          </CardHeader>
          <CardContent>
            <Map stops={mapStops} />
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">Available Routes ({searchResults.length})</h2>
          <div className="grid gap-3">
            {searchResults.map((result, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleResultClick(result)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{result.busName}</h3>
                      <p className="text-sm text-muted-foreground">{result.stopName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-primary">{result.distance.toFixed(2)} km</p>
                      <ArrowRight className="h-4 w-4 text-muted-foreground mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Planned Route Display */}
      {plannedRoute && (
        <Card>
          <CardHeader>
            <CardTitle>Your Planned Route</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">From</p>
                <p className="font-semibold">{plannedRoute.from.name}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">To</p>
                <p className="font-semibold">{plannedRoute.to.name}</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Buses:</p>
              <div className="space-y-2">
                {plannedRoute.buses.map((bus) => (
                  <div key={bus.id} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    {bus.name}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
