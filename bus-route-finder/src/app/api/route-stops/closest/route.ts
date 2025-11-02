import { getSupabaseServer } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const busId = searchParams.get("bus_id")
    const latitude = Number.parseFloat(searchParams.get("latitude") || "0")
    const longitude = Number.parseFloat(searchParams.get("longitude") || "0")
    const direction = searchParams.get("direction") || "outbound"

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

    // Call OSRM Distance API
    const origins = [{ lat: latitude, lng: longitude }]
    const destinations = stops.map((stop) => ({ lat: stop.latitude, lng: stop.longitude }))

    const distanceResponse = await fetch(`${request.headers.get("origin") || "http://localhost:3000"}/api/distance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origins, destinations }),
    })

    const distanceData = await distanceResponse.json()

    if (!distanceResponse.ok) {
      throw new Error(distanceData.error || "Failed to calculate distances")
    }

    // Extract distances and find closest stop
    const distances = distanceData.rows[0]?.elements || []
    const stopsWithDistance = stops.map((stop, index) => {
      const element = distances[index]
      const distanceInKm = element?.distance?.value ? element.distance.value / 1000 : Number.POSITIVE_INFINITY
      return {
        ...stop,
        distance: distanceInKm,
        stopOrder: routeStops.find((rs) => rs.stop_id === stop.id)?.stop_order || 0,
      }
    })

    const DISTANCE_THRESHOLD_KM = 1
    const closestStops = stopsWithDistance.filter((stop) => stop.distance <= DISTANCE_THRESHOLD_KM)

    if (closestStops.length === 0) {
      return NextResponse.json({ error: `No stops found within ${DISTANCE_THRESHOLD_KM}km` }, { status: 404 })
    }

    const closest = closestStops.sort((a, b) => a.distance - b.distance)[0]

    const serializedClosest = {
      id: closest.id,
      name: closest.name,
      latitude: closest.latitude,
      longitude: closest.longitude,
      distance: closest.distance,
      stopOrder: closest.stopOrder,
    }

    return NextResponse.json(serializedClosest)
  } catch (error) {
    console.error("[v0] Error finding closest stop:", error)
    return NextResponse.json({ error: "Failed to find closest stop", details: String(error) }, { status: 500 })
  }
}
