// import { getSupabaseServer } from "@/lib/supabase/server"
// import { NextResponse } from "next/server"

// export async function GET(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url)
//     const busId = searchParams.get("bus_id")
//     const latitude = Number.parseFloat(searchParams.get("latitude") || "0")
//     const longitude = Number.parseFloat(searchParams.get("longitude") || "0")
//     const direction = searchParams.get("direction") || "outbound"

//     if (!busId || latitude === 0 || longitude === 0) {
//       return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
//     }

//     if (
//       process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("YOUR_SUPABASE") ||
//       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes("YOUR_SUPABASE")
//     ) {
//       return NextResponse.json(
//         {
//           error:
//             "Supabase credentials not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.",
//         },
//         { status: 500 },
//       )
//     }

//     const supabase = await getSupabaseServer()

//     // Get all stops for this bus in the given direction
//     const { data: routeStops, error: routeError } = await supabase
//       .from("route_stops")
//       .select("stop_id, stop_order")
//       .eq("bus_id", busId)
//       .eq("direction", direction)
//       .order("stop_order", { ascending: true })

//     if (routeError) throw routeError

//     if (!routeStops || routeStops.length === 0) {
//       return NextResponse.json({ error: "No stops found for this bus" }, { status: 404 })
//     }

//     // Get stop details
//     const stopIds = routeStops.map((rs) => rs.stop_id)
//     const { data: stops, error: stopsError } = await supabase
//       .from("stops")
//       .select("id, name, latitude, longitude")
//       .in("id", stopIds)

//     if (stopsError) throw stopsError

//     if (!stops || stops.length === 0) {
//       return NextResponse.json({ error: "No stop details found" }, { status: 404 })
//     }

//     // Call OSRM Distance API
//     const origins = [{ lat: latitude, lng: longitude }]
//     const destinations = stops.map((stop) => ({ lat: stop.latitude, lng: stop.longitude }))

//     const distanceResponse = await fetch(`${request.headers.get("origin") || "http://localhost:3000"}/api/distance`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ origins, destinations }),
//     })

//     const distanceData = await distanceResponse.json()

//     if (!distanceResponse.ok) {
//       throw new Error(distanceData.error || "Failed to calculate distances")
//     }

//     // Extract distances and find closest stop
//     const distances = distanceData.rows[0]?.elements || []
//     const stopsWithDistance = stops.map((stop, index) => {
//       const element = distances[index]
//       const distanceInKm = element?.distance?.value ? element.distance.value / 1000 : Number.POSITIVE_INFINITY
//       return {
//         ...stop,
//         distance: distanceInKm,
//         stopOrder: routeStops.find((rs) => rs.stop_id === stop.id)?.stop_order || 0,
//       }
//     })

//     const DISTANCE_THRESHOLD_KM = 1
//     const closestStops = stopsWithDistance.filter((stop) => stop.distance <= DISTANCE_THRESHOLD_KM)

//     if (closestStops.length === 0) {
//       return NextResponse.json({ error: `No stops found within ${DISTANCE_THRESHOLD_KM}km` }, { status: 404 })
//     }

//     const closest = closestStops.sort((a, b) => a.distance - b.distance)[0]

//     const serializedClosest = {
//       id: closest.id,
//       name: closest.name,
//       latitude: closest.latitude,
//       longitude: closest.longitude,
//       distance: closest.distance,
//       stopOrder: closest.stopOrder,
//     }

//     return NextResponse.json(serializedClosest)
//   } catch (error) {
//     console.error("[v0] Error finding closest stop:", error)
//     return NextResponse.json({ error: "Failed to find closest stop", details: String(error) }, { status: 500 })
//   }
// }

import { getSupabaseServer } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const busId = searchParams.get("bus_id")
    const latitude = Number.parseFloat(searchParams.get("latitude") || "0")
    const longitude = Number.parseFloat(searchParams.get("longitude") || "0")
    const direction = searchParams.get("direction") || "outbound"
    const maxKmParam = Number.parseFloat(searchParams.get("max_km") || "")
    const DISTANCE_THRESHOLD_KM = Number.isFinite(maxKmParam) && maxKmParam > 0 ? Math.min(maxKmParam, 10) : 1.5
    // const MAX_OSRM_CANDIDATES = 25
    const MAX_OSRM_CANDIDATES = 10

    if (!busId || latitude === 0 || longitude === 0) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("YOUR_SUPABASE") ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes("YOUR_SUPABASE")
    ) {
      return NextResponse.json(
        {
          error:
            "Supabase credentials not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.",
        },
        { status: 500 },
      )
    }

    const supabase = await getSupabaseServer()

    // Get all stops for this bus in the given direction
    const { data: routeStops, error: routeError } = await supabase
      .from("route_stops")
      .select("stop_id, stop_order")
      .eq("bus_id", busId)
      .eq("direction", direction)
      .order("stop_order", { ascending: true })

    if (routeError) throw routeError

    if (!routeStops || routeStops.length === 0) {
      return NextResponse.json({ error: "No stops found for this bus" }, { status: 404 })
    }

    // Get stop details
    const stopIds = routeStops.map((rs) => rs.stop_id)
    const { data: stops, error: stopsError } = await supabase
      .from("stops")
      .select("id, name, latitude, longitude")
      .in("id", stopIds)

    if (stopsError) throw stopsError

    if (!stops || stops.length === 0) {
      return NextResponse.json({ error: "No stop details found" }, { status: 404 })
    }

    // Haversine helper to prefilter candidates for OSRM (speed optimization)
    const toRad = (deg: number) => (deg * Math.PI) / 180
    const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371
      const dLat = toRad(lat2 - lat1)
      const dLon = toRad(lon2 - lon1)
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    }

    // Pre-rank stops by straight-line distance and keep a limited set for OSRM
    const stopsRanked = stops
      .map((s) => {
        const hv = haversineKm(latitude, longitude, s.latitude, s.longitude)
        return {
          ...s,
          haversineKm: hv,
          // Provide a default distance so both OSRM-calculated and fallback objects share the same shape
          distance: hv,
          stopOrder: routeStops.find((rs) => rs.stop_id === s.id)?.stop_order || 0,
        }
      })
      .sort((a, b) => a.haversineKm - b.haversineKm)

    const candidateStops = stopsRanked.slice(0, Math.min(MAX_OSRM_CANDIDATES, stopsRanked.length))

    // Call OSRM Distance API with reduced candidates
    const origins = [{ lat: latitude, lng: longitude }]
    const destinations = candidateStops.map((stop) => ({ lat: stop.latitude, lng: stop.longitude }))

    // Build a robust base URL for internal calls
    const headers = new Headers(request.headers)
    const host = headers.get("x-forwarded-host") || headers.get("host") || "localhost:3000"
    const proto = headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https")
    const baseUrl = `${proto}://${host}`

    let stopsWithDistance = candidateStops.map((stop) => ({
      ...stop,
      // default to haversine as a safe fallback
      distance: stop.haversineKm,
      stopOrder: routeStops.find((rs) => rs.stop_id === stop.id)?.stop_order || 0,
    }))

    try {
      const distanceResponse = await fetch(`${baseUrl}/api/distance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origins, destinations }),
      })

      const distanceData = await distanceResponse.json()

      if (!distanceResponse.ok) {
        throw new Error(distanceData.error || "Failed to calculate distances")
      }

      // Extract distances and prefer OSRM values when available
      const distances = distanceData.rows[0]?.elements || []
      stopsWithDistance = candidateStops.map((stop, index) => {
        const element = distances[index]
        const distanceInKm = element?.distance?.value ? element.distance.value / 1000 : stop.haversineKm
        return {
          ...stop,
          distance: distanceInKm,
          stopOrder: routeStops.find((rs) => rs.stop_id === stop.id)?.stop_order || 0,
        }
      })
    } catch (e) {
      // Keep haversine-based distances if OSRM/internal fetch fails
      console.error("[v0] Falling back to haversine distances due to distance service error:", e)
    }

    // If nothing came back from OSRM (e.g., all Infinity), pick the nearest by haversine as a fallback
    const finiteStops = stopsWithDistance.filter((s) => Number.isFinite(s.distance))
    const closest = (finiteStops.length > 0 ? finiteStops : stopsRanked).sort((a, b) => a.distance - b.distance)[0]

    const withinThreshold = Number.isFinite(closest.distance) && closest.distance <= DISTANCE_THRESHOLD_KM


    
    const serializedClosest = {
      id: closest.id,
      name: closest.name,
      latitude: closest.latitude,
      longitude: closest.longitude,
      distance: closest.distance,
      stopOrder: closest.stopOrder,
      withinThreshold,
      thresholdKm: DISTANCE_THRESHOLD_KM,
    }

    // Always return 200 with the nearest stop; include withinThreshold flag so clients can decide
    return NextResponse.json(serializedClosest)
  } catch (error) {
    console.error("[v0] Error finding closest stop:", error)
    return NextResponse.json({ error: "Failed to find closest stop", details: String(error) }, { status: 500 })
  }
}



