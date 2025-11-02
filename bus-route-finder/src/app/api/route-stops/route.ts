import { getSupabaseServer } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer()
    const busId = request.nextUrl.searchParams.get("bus_id")

    let query = supabase.from("route_stops").select("*, stops(*)")

    if (busId) {
      query = query.eq("bus_id", busId)
    }

    const { data, error } = await query.order("stop_order", { ascending: true })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Error fetching route stops:", error)
    return NextResponse.json({ error: "Failed to fetch route stops" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer()
    const body = await request.json()

    const { data, error } = await supabase
      .from("route_stops")
      .insert([
        {
          bus_id: body.bus_id,
          stop_id: body.stop_id,
          stop_order: body.stop_order,
          direction: body.direction || "outbound",
        },
      ])
      .select()

    if (error) throw error

    return NextResponse.json(data?.[0], { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating route stop:", error)
    return NextResponse.json({ error: "Failed to create route stop" }, { status: 500 })
  }
}
