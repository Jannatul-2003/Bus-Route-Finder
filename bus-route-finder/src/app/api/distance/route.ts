import { NextResponse } from "next/server"
import { DistanceCalculator } from "@/lib/strategies/DistanceCalculator"

/**
 * Distance Calculation API Route
 * 
 * Uses Strategy Pattern to calculate distances between origins and destinations.
 * Automatically falls back to Haversine if OSRM is unavailable.
 */
export async function POST(request: Request) {
  try {
    const { origins, destinations } = await request.json()

    if (!origins || !destinations) {
      return NextResponse.json({ error: "Missing origins or destinations" }, { status: 400 })
    }

    // Use Strategy Pattern - DistanceCalculator handles strategy selection and fallback
    // Use public OSRM API by default, or allow override via environment variable
    const osrmBaseUrl = process.env.OSRM_BASE_URL || process.env.NEXT_PUBLIC_OSRM_BASE_URL || "http://router.project-osrm.org"
    const calculator = DistanceCalculator.createDefault(osrmBaseUrl)

    // Calculate distances using the strategy pattern (with automatic fallback)
    const results = await calculator.calculateDistances(origins, destinations, true)

    // Transform results to match expected API format
    const distances = results.map((row) =>
      row.map((result) => ({
        distance: {
          text: `${result.distance.toFixed(2)} km`,
          value: result.distance * 1000, // Convert km to meters for API compatibility
        },
        duration: {
          text: result.duration
            ? `${Math.round(result.duration / 60)} mins`
            : `${Math.round(result.distance / 50)} mins`, // Estimate if duration not available
          value: result.duration || Math.round((result.distance / 50) * 60), // Estimate: 50 km/h average
        },
        method: result.method, // Include strategy name for debugging
      })),
    )

    return NextResponse.json({
      rows: distances.map((row) => ({ elements: row })),
      status: "OK",
    })
  } catch (error) {
    console.error("[v0] Error calculating distance:", error)
    return NextResponse.json({ error: "Failed to calculate distance", details: String(error) }, { status: 500 })
  }
}
