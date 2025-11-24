import { getSupabaseServer } from "@/lib/supabase/server"
import { StopDiscoveryService } from "@/lib/services/StopDiscoveryService"
import { DistanceCalculator } from "@/lib/strategies/DistanceCalculator"
import { OSRMStrategy } from "@/lib/strategies/OSRMStrategy"
import { HaversineStrategy } from "@/lib/strategies/HaversineStrategy"
import { type NextRequest, NextResponse } from "next/server"

/**
 * GET /api/stops/within-threshold
 * 
 * Discover bus stops within a threshold distance from a location
 * 
 * Query Parameters:
 * - lat: Latitude of reference location (required)
 * - lng: Longitude of reference location (required)
 * - threshold: Maximum distance in meters (required, 100-5000)
 * 
 * Requirements: 2.1, 2.2
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(7)
  
  try {
    // Extract and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    const threshold = searchParams.get("threshold")
    
    console.log(`[${requestId}] GET /api/stops/within-threshold - lat=${lat}, lng=${lng}, threshold=${threshold}`)
    
    // Validate required parameters
    if (!lat || !lng || !threshold) {
      console.warn(`[${requestId}] Missing required parameters`)
      return NextResponse.json(
        { 
          error: "Missing required parameters",
          details: "lat, lng, and threshold are required"
        },
        { status: 400 }
      )
    }
    
    // Parse and validate latitude
    const latitude = parseFloat(lat)
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      console.warn(`[${requestId}] Invalid latitude: ${lat}`)
      return NextResponse.json(
        { 
          error: "Invalid latitude",
          details: "Latitude must be a number between -90 and 90"
        },
        { status: 400 }
      )
    }
    
    // Parse and validate longitude
    const longitude = parseFloat(lng)
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      console.warn(`[${requestId}] Invalid longitude: ${lng}`)
      return NextResponse.json(
        { 
          error: "Invalid longitude",
          details: "Longitude must be a number between -180 and 180"
        },
        { status: 400 }
      )
    }
    
    // Parse and validate threshold (Requirements 1.3: 100-5000 meters)
    const thresholdMeters = parseFloat(threshold)
    if (isNaN(thresholdMeters) || thresholdMeters < 100 || thresholdMeters > 5000) {
      console.warn(`[${requestId}] Invalid threshold: ${threshold}`)
      return NextResponse.json(
        { 
          error: "Invalid threshold",
          details: "Threshold must be a number between 100 and 5000 meters"
        },
        { status: 400 }
      )
    }
    
    // Initialize services
    const supabase = await getSupabaseServer()
    const osrmStrategy = new OSRMStrategy()
    const haversineStrategy = new HaversineStrategy()
    const distanceCalculator = new DistanceCalculator(osrmStrategy, haversineStrategy)
    const stopDiscoveryService = new StopDiscoveryService(distanceCalculator, supabase)
    
    // Discover stops within threshold
    const stops = await stopDiscoveryService.discoverStops(
      { lat: latitude, lng: longitude },
      thresholdMeters
    )
    
    const duration = Date.now() - startTime
    console.log(`[${requestId}] Found ${stops.length} stops within ${thresholdMeters}m in ${duration}ms`)
    
    return NextResponse.json({
      stops,
      count: stops.length,
      threshold: thresholdMeters,
      location: { lat: latitude, lng: longitude }
    })
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] Error in /api/stops/within-threshold (${duration}ms):`, error)
    
    return NextResponse.json(
      { 
        error: "Failed to discover stops",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
