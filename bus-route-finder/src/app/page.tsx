"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, NavigationIcon, Clock, Star } from "lucide-react"

export default function RoutePlanner() {
  const [fromLocation, setFromLocation] = useState("")
  const [toLocation, setToLocation] = useState("")
  const [routes, setRoutes] = useState<any[]>([])

  const handleSearch = () => {
    // Mock route data for demonstration
    const mockRoutes = [
      {
        id: 1,
        busNumber: "Route 42",
        duration: "25 mins",
        stops: 8,
        rating: 4.2,
        nextDeparture: "10:30 AM",
        fare: "$2.50",
      },
      {
        id: 2,
        busNumber: "Route 15",
        duration: "32 mins",
        stops: 12,
        rating: 3.8,
        nextDeparture: "10:45 AM",
        fare: "$2.50",
      },
      {
        id: 3,
        busNumber: "Express 7",
        duration: "18 mins",
        stops: 4,
        rating: 4.6,
        nextDeparture: "11:00 AM",
        fare: "$3.00",
      },
    ]
    setRoutes(mockRoutes)
  }

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Mock setting current location
          setFromLocation("Current Location")
        },
        (error) => {
          console.error("Error getting location:", error)
        },
      )
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
          <Button onClick={handleSearch} className="w-full md:w-auto" disabled={!fromLocation || !toLocation}>
            Find Routes
          </Button>
        </CardContent>
      </Card>

      {/* Route Results */}
      {routes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Available Routes</h2>
          <div className="grid gap-4">
            {routes.map((route) => (
              <Card key={route.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{route.busNumber}</h3>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm text-muted-foreground">{route.rating}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {route.duration}
                        </div>
                        <span>{route.stops} stops</span>
                        <span className="font-medium text-primary">{route.fare}</span>
                      </div>
                    </div>
                    <div className="flex flex-col md:items-end gap-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Next: </span>
                        <span className="font-medium">{route.nextDeparture}</span>
                      </div>
                      <Button size="sm">Select Route</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
