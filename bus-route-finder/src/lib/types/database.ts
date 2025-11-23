/**
 * Database model types
 */

export interface Stop {
  id: string
  name: string
  latitude: number
  longitude: number
  accessible: boolean
  created_at: string
}

export interface StopWithDistance extends Stop {
  distance: number // distance in meters from reference point
  distanceMethod: 'OSRM' | 'Haversine'
}

export interface Bus {
  id: string
  name: string
  status: 'active' | 'inactive'
  is_ac: boolean
  coach_type: 'standard' | 'express' | 'luxury'
  created_at: string
  updated_at: string
}

export interface RouteStop {
  id: string
  bus_id: string
  stop_id: string
  stop_order: number
  direction: 'outbound' | 'inbound'
  distance_to_next: number | null
  duration_to_next: number | null
  created_at: string
  updated_at: string
}

export interface Coordinates {
  lat: number
  lng: number
}
