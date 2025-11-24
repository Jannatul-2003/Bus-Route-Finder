import { getSupabaseServer } from "@/lib/supabase/server"
import { BusRouteService } from "@/lib/services/BusRouteService"
import { DistanceCalculator } from "@/lib/strategies/DistanceCalculator"
import { OSRMStrategy } from "@/lib/strategies/OSRMStrategy"
import { HaversineStrategy } from "@/lib/strategies/HaversineStrategy"
import { type NextRequest, NextResponse } from "next/server"

/**
 * GET /api/buses/between-stops
 * 
 * Find all buses that travel between two stops in the correct order
 * 
 * Query Parameters:
 * - onboarding: ID of the onboarding stop (required)
 * - offboarding: ID of the offboarding stop (required)
 * 
 * Requirements: 4.1
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(7)
  
  try {
    // Extract and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const onboardingStopId = searchParams.get("onboarding")
    const offboardingStopId = searchParams.get("offboarding")
    
    console.log(`[${requestId}] GET /api/buses/between-stops - onboarding=${onboardingStopId}, offboarding=${offboardingStopId}`)
    
    // Validate required parameters
    if (!onboardingStopId || !offboardingStopId) {
      console.warn(`[${requestId}] Missing required parameters`)
      return NextResponse.json(
        { 
          error: "Missing required parameters",
          details: "onboarding and offboarding stop IDs are required"
        },
        { status: 400 }
      )
    }
    
    // Validate that stops are different
    if (onboardingStopId === offboardingStopId) {
      console.warn(`[${requestId}] Onboarding and offboarding stops are the same`)
      return NextResponse.json(
        { 
          error: "Invalid stop selection",
          details: "Onboarding and offboarding stops must be different"
        },
        { status: 400 }
      )
    }
    
    // Initialize services
    const supabase = await getSupabaseServer()
    const osrmStrategy = new OSRMStrategy()
    const haversineStrategy = new HaversineStrategy()
    const distanceCalculator = new DistanceCalculator(osrmStrategy, haversineStrategy)
    const busRouteService = new BusRouteService(supabase, distanceCalculator)
    
    // Find bus routes
    const routes = await busRouteService.findBusRoutes(
      onboardingStopId,
      offboardingStopId
    )
    
    const duration = Date.now() - startTime
    console.log(`[${requestId}] Found ${routes.length} bus routes in ${duration}ms`)
    
    return NextResponse.json({
      routes,
      count: routes.length,
      onboardingStopId,
      offboardingStopId
    })
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] Error in /api/buses/between-stops (${duration}ms):`, error)
    
    return NextResponse.json(
      { 
        error: "Failed to find bus routes",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
