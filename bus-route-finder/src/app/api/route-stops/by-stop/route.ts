// import { getSupabaseServer } from "@/lib/supabase/server"
// import { NextResponse } from "next/server"

// export async function GET(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url)
//     const stopId = searchParams.get("stop_id")
//     const direction = searchParams.get("direction") || "outbound"

//     if (!stopId) {
//       return NextResponse.json({ error: "stop_id parameter required" }, { status: 400 })
//     }

//     const supabase = await getSupabaseServer()

//     // Get route stops for this stop
//     const { data: routeStops, error: routeError } = await supabase
//       .from("route_stops")
//       .select("bus_id, stop_order")
//       .eq("stop_id", stopId)
//       .eq("direction", direction)

//     if (routeError) throw routeError

//     // Get bus details for these route stops
//     const busIds = [...new Set(routeStops?.map((rs) => rs.bus_id) || [])]

//     if (busIds.length === 0) {
//       return NextResponse.json([])
//     }

//     const { data: buses, error: busError } = await supabase
//       .from("buses")
//       .select("id, name, status")
//       .in("id", busIds)
//       .eq("status", "active")

//     if (busError) throw busError

//     return NextResponse.json(buses || [])
//   } catch (error) {
//     console.error("[v0] Error fetching buses by stop:", error)
//     return NextResponse.json({ error: "Failed to fetch buses" }, { status: 500 })
//   }
// }
import { getSupabaseServer } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stopId = searchParams.get("stop_id")
    const direction = searchParams.get("direction") || "outbound"

    if (!stopId) {
      return NextResponse.json({ error: "stop_id parameter required" }, { status: 400 })
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

    // Get route stops for this stop
    const { data: routeStops, error: routeError } = await supabase
      .from("route_stops")
      .select("bus_id, stop_order")
      .eq("stop_id", stopId)
      .eq("direction", direction)

    if (routeError) throw routeError

    // Get bus details for these route stops
    const busIds = [...new Set(routeStops?.map((rs) => rs.bus_id) || [])]

    if (busIds.length === 0) {
      return NextResponse.json([])
    }

    const { data: buses, error: busError } = await supabase
      .from("buses")
      .select("id, name, status")
      .in("id", busIds)
      .eq("status", "active")

    if (busError) throw busError

    return NextResponse.json(buses || [])
  } catch (error) {
    console.error("[v0] Error fetching buses by stop:", error)
    return NextResponse.json({ error: "Failed to fetch buses", details: String(error) }, { status: 500 })
  }
}
