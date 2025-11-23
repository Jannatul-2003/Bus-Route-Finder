"use client"

import { Observable } from "@/lib/observer"

export interface Bus {
  id: string
  name: string
  status: string
}

export interface Stop {
  id: string
  name: string
  latitude: number
  longitude: number
  distance?: number
}

export interface SearchResult {
  busId: string
  busName: string
  stopId: string
  stopName: string
  distance: number
}

export interface PlannedRoute {
  from: Stop
  to: Stop
  buses: Bus[]
}

interface Coordinates {
  lat: number
  lng: number
}

export interface RoutePlannerState {
  fromLocation: string
  toLocation: string
  fromCoords: Coordinates | null
  searchResults: SearchResult[]
  plannedRoute: PlannedRoute | null
  buses: Bus[]
  loading: boolean
  mapStops: Stop[]
  error: string | null
}

const initialState: RoutePlannerState = {
  fromLocation: "",
  toLocation: "",
  fromCoords: null,
  searchResults: [],
  plannedRoute: null,
  buses: [],
  loading: false,
  mapStops: [],
  error: null,
}

class RoutePlannerStore extends Observable<RoutePlannerState> {
  #state: RoutePlannerState
  #isInitialized: boolean

  constructor() {
    super()
    this.#state = { ...initialState }
    this.#isInitialized = false
  }

  getState() {
    return this.#state
  }

  setFromLocation(value: string) {
    this.#setState({ fromLocation: value })
  }

  setToLocation(value: string) {
    this.#setState({ toLocation: value })
  }

  async ensureInitialized() {
    if (this.#isInitialized) return
    this.#isInitialized = true
    await this.#fetchActiveBuses()
  }

  handleGetLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      this.#setState({ error: "Geolocation is not supported in this environment" })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.#setState({
          fromLocation: "Current Location",
          fromCoords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          error: null,
        })
      },
      (error) => {
        console.error("[v0] Error getting location:", error)
        this.#setState({ error: "Unable to get your current location" })
      },
    )
  }

  async searchRoutes() {
    if (!this.#state.toLocation) return

    this.#setState({ loading: true, error: null })

    try {
      let searchCoords = this.#state.fromCoords

      if (!searchCoords && this.#state.fromLocation && this.#state.fromLocation !== "Current Location") {
        try {
          const fromStops = await this.#safeJsonFetch(
            `/api/stops/search?q=${encodeURIComponent(this.#state.fromLocation)}`,
          )

          if (!fromStops || fromStops.length === 0) {
            this.#setState({
              error: "Starting location not found. Please use 'Current Location' or enter a valid stop name",
            })
            return
          }

          searchCoords = {
            lat: fromStops[0].latitude,
            lng: fromStops[0].longitude,
          }
          this.#setState({ fromCoords: searchCoords })
        } catch (error) {
          console.error("[v0] Error fetching from location:", error)
          this.#setState({
            error: "Could not find starting location. Please try 'Current Location' instead",
          })
          return
        }
      }

      if (!searchCoords || searchCoords.lat === 0 || searchCoords.lng === 0) {
        this.#setState({
          error: "Please use 'Current Location' button or enter a valid stop name",
        })
        return
      }

      const stops = await this.#safeJsonFetch(`/api/stops/search?q=${encodeURIComponent(this.#state.toLocation)}`)

      if (!stops || stops.length === 0) {
        this.#setState({ error: "No stops found for that destination" })
        return
      }

      const destinationStop = stops[0]
      this.#setState({ mapStops: [destinationStop] })

      const servingBuses = await this.#safeJsonFetch(`/api/route-stops/by-stop?stop_id=${destinationStop.id}`)

      if (!servingBuses || servingBuses.length === 0) {
        this.#setState({ error: "No buses serve this destination" })
        return
      }

      const results: SearchResult[] = []

      for (const bus of servingBuses) {
        try {
          const closestStop = await this.#safeJsonFetch(
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

      results.sort((a, b) => a.distance - b.distance)
      this.#setState({ searchResults: results })
    } catch (error) {
      console.error("[v0] Error searching routes:", error)
      this.#setState({ error: `Error searching routes: ${String(error)}` })
    } finally {
      this.#setState({ loading: false })
    }
  }

  async selectResult(result: SearchResult) {
    this.#setState({ toLocation: result.stopName })

    try {
      const stops = await this.#safeJsonFetch(`/api/stops/search?q=${encodeURIComponent(result.stopName)}`)
      if (stops && stops.length > 0) {
        const stop = stops[0]
        this.#setState({ mapStops: [stop] })

        if (this.#state.fromCoords) {
          const bus = this.#state.buses.find((b) => b.id === result.busId)
          if (bus) {
            this.#setState({
              plannedRoute: {
                from: {
                  id: "current",
                  name: this.#state.fromLocation,
                  latitude: this.#state.fromCoords.lat,
                  longitude: this.#state.fromCoords.lng,
                },
                to: stop,
                buses: [bus],
              },
            })
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error handling result click:", error)
      this.#setState({ error: `Error loading stop details: ${String(error)}` })
    }
  }

  reset() {
    this.#state = { ...initialState }
    this.#isInitialized = false
    this.notify(this.#state)
  }

  #setState(partial: Partial<RoutePlannerState>) {
    this.#state = { ...this.#state, ...partial }
    this.notify(this.#state)
  }

  async #fetchActiveBuses() {
    try {
      const response = await fetch("/api/buses")
      if (!response.ok) {
        const text = await response.text()
        throw new Error(`API error: ${response.status} - ${text}`)
      }
      const data = await response.json()
      this.#setState({ buses: data.filter((b: Bus) => b.status === "active") })
    } catch (error) {
      console.error("[v0] Error fetching buses:", error)
      this.#setState({
        error: "Failed to load buses. Please check your Supabase configuration.",
      })
    }
  }

  async #safeJsonFetch(url: string) {
    const response = await fetch(url)
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`API error: ${response.status} - ${text}`)
    }
    return response.json()
  }
}

export const routePlannerStore = new RoutePlannerStore()

