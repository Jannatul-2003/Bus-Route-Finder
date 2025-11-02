import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { origins, destinations } = await request.json()

    if (!origins || !destinations) {
      return NextResponse.json({ error: "Missing origins or destinations" }, { status: 400 })
    }

    // OSRM expects coordinates in format: longitude,latitude;longitude,latitude;...
    const coordinates = [
      ...origins.map((o: { lat: number; lng: number }) => `${o.lng},${o.lat}`),
      ...destinations.map((d: { lat: number; lng: number }) => `${d.lng},${d.lat}`),
    ].join(";")

    const osrmUrl = `https://router.project-osrm.org/table/v1/driving/${coordinates}?annotations=distance,duration`

    console.log("[v0] OSRM URL:", osrmUrl)
    const response = await fetch(osrmUrl, { signal: AbortSignal.timeout(30000) })

    if (!response.ok) {
      console.error("[v0] OSRM HTTP error:", response.status, response.statusText)
      return NextResponse.json({ error: `OSRM API error: ${response.status}` }, { status: 500 })
    }

    const data = await response.json()
    console.log("[v0] OSRM Response code:", data.code)

    if (data.code !== "Ok" && data.code !== "ok") {
      console.error("[v0] OSRM API error:", data)
      return NextResponse.json(
        { error: "Failed to calculate distances", details: data.message || data.code },
        { status: 500 },
      )
    }

    if (!data.distances || !Array.isArray(data.distances) || data.distances.length === 0) {
      console.error("[v0] Invalid OSRM response format - no distances:", data)
      return NextResponse.json({ error: "Invalid response format from distance service" }, { status: 500 })
    }

    // Transform OSRM response to match expected format
    // OSRM returns distances in meters and durations in seconds
    const distances = data.distances.map((row: number[]) =>
      row.map((distance: number) => ({
        distance: {
          text: `${(distance / 1000).toFixed(2)} km`,
          value: distance,
        },
        duration: {
          text: `${Math.round(distance / 1000 / 50)} mins`, // Rough estimate: 50 km/h average
          value: Math.round((distance / 1000 / 50) * 60),
        },
      })),
    )

    return NextResponse.json({
      rows: distances.map((row: any[]) => ({ elements: row })),
      status: "OK",
    })
  } catch (error) {
    console.error("[v0] Error calculating distance:", error)
    return NextResponse.json({ error: "Failed to calculate distance", details: String(error) }, { status: 500 })
  }
}
