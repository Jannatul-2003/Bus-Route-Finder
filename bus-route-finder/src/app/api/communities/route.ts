import { getSupabaseServer } from "@/lib/supabase/server"
import { CommunityService } from "@/lib/services/CommunityService"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer()
    const communityService = new CommunityService(supabase)
    
    const searchParams = request.nextUrl.searchParams
    const latitude = searchParams.get("latitude")
    const longitude = searchParams.get("longitude")
    const radius = searchParams.get("radius")

    // If coordinates provided, get nearby communities
    if (latitude && longitude) {
      const lat = parseFloat(latitude)
      const lng = parseFloat(longitude)
      const searchRadius = radius ? parseInt(radius) : 5000

      if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json(
          { error: "Invalid latitude or longitude" },
          { status: 400 }
        )
      }

      const communities = await communityService.getNearbyCommunities(
        lat,
        lng,
        searchRadius
      )
      return NextResponse.json(communities)
    }

    // Otherwise, get all communities
    const { data, error } = await supabase
      .from("communities")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error fetching communities:", error)
    return NextResponse.json(
      { error: "Failed to fetch communities" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer()
    const communityService = new CommunityService(supabase)
    
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.center_latitude || !body.center_longitude) {
      return NextResponse.json(
        { error: "Missing required fields: name, center_latitude, center_longitude" },
        { status: 400 }
      )
    }

    const community = await communityService.createCommunity({
      name: body.name,
      description: body.description,
      center_latitude: body.center_latitude,
      center_longitude: body.center_longitude,
      radius_meters: body.radius_meters
    })

    return NextResponse.json(community, { status: 201 })
  } catch (error) {
    console.error("Error creating community:", error)
    return NextResponse.json(
      { error: "Failed to create community" },
      { status: 500 }
    )
  }
}
