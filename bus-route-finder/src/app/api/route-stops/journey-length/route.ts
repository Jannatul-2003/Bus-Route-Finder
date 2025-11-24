import { getSupabaseServer } from "@/lib/supabase/server"
import { BusRouteService } from "@/lib/services/BusRouteService"
import { DistanceCalculator } from "@/lib/strategies/DistanceCalculator"
import { OSRMStrategy } from "@/lib/strategies/OSRMStrategy"
import { HaversineStrategy } from "@/lib/strategies/HaversineStrategy"
import { type NextRequest, NextResponse } from "next/server"

/**
 * GET /api/route-stops/journey-length
 * 
 * Calculate journey length between two stops on a specific bus route
 * 
 * Query Parameters:
 * - busId: ID of the bus (required)
 * - onboardingOrder: Stop order of onboarding stop (required)
 * - offboardingOrder: Stop order of offboarding stop (required)
 * - direction: Route direction - 'outbound' or 'inbound' (required)
 * 
 * Requirements: 5.1
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(7)
  
  try {
    // Extract and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const busId = searchParams.get("busId")
    const onboardingOrder = searchParams.get("onboardingOrder")
    const offboardingOrder = searchParams.get("offboardingOrder")
    const direction = searchParams.get("direction")
    
    console.log(`[${requestId}] GET /api/route-stops/journey-length - busId=${busId}, onboardingOrder=${onboardingOrder}, offboardingOrder=${offboardingOrder}, direction=${direction}`)
    
    // Validate required parameters
    if (!busId || !onboardingOrder || !offboardingOrder || !direction) {
      console.warn(`[${requestId}] Missing required parameters`)
      return NextResponse.json(
        { 
          error: "Missing required parameters",
          details: "busId, onboardingOrder, offboardingOrder, and direction are required"
        },
        { status: 400 }
      )
    }
    
    // Validate direction
    if (direction !== 'outbound' && direction !== 'inbound') {
      console.warn(`[${requestId}] Invalid direction: ${direction}`)
      return NextResponse.json(
        { 
          error: "Invalid direction",
          details: "Direction must be 'outbound' or 'inbound'"
        },
        { status: 400 }
      )
    }
    
    // Parse and validate stop orders
    const onboardingStopOrder = parseInt(onboardingOrder, 10)
    if (isNaN(onboardingStopOrder) || onboardingStopOrder < 0) {
      console.warn(`[${requestId}] Invalid onboardingOrder: ${onboardingOrder}`)
      return NextResponse.json(
        { 
          error: "Invalid onboarding order",
          details: "Onboarding order must be a non-negative integer"
        },
        { status: 400 }
      )
    }
    
    const offboardingStopOrder = parseInt(offboardingOrder, 10)
    if (isNaN(offboardingStopOrder) || offboardingStopOrder < 0) {
      console.warn(`[${requestId}] Invalid offboardingOrder: ${offboardingOrder}`)
      return NextResponse.json(
        { 
          error: "Invalid offboarding order",
          details: "Offboarding order must be a non-negative integer"
        },
        { status: 400 }
      )
    }
    
    // Validate stop order relationship (Requirements 4.2: onboarding before offboarding)
    if (onboardingStopOrder >= offboardingStopOrder) {
      console.warn(`[${requestId}] Invalid stop order: onboarding (${onboardingStopOrder}) >= offboarding (${offboardingStopOrder})`)
      return NextResponse.json(
        { 
          error: "Invalid stop order",
          details: "Onboarding stop must come before offboarding stop in the route"
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
    
    // Calculate journey length
    const journeyLength = await busRouteService.calculateJourneyLength(
      busId,
      onboardingStopOrder,
      offboardingStopOrder,
      direction as 'outbound' | 'inbound'
    )
    
    const duration = Date.now() - startTime
    console.log(`[${requestId}] Calculated journey length: ${journeyLength.toFixed(3)} km in ${duration}ms`)
    
    return NextResponse.json({
      journeyLength,
      journeyLengthKm: journeyLength,
      journeyLengthMeters: journeyLength * 1000,
      busId,
      onboardingStopOrder,
      offboardingStopOrder,
      direction
    })
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] Error in /api/route-stops/journey-length (${duration}ms):`, error)
    
    return NextResponse.json(
      { 
        error: "Failed to calculate journey length",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
