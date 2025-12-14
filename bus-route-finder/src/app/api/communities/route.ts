import { getSupabaseServer } from "@/lib/supabase/server"
import { CommunityService } from "@/lib/services/CommunityService"
import { roleAuthService } from "@/lib/services/RoleAuthorizationService"
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
    
    // Get current user and check authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Fetch user profile to get contributor status
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("is_contributor")
      .eq("id", user.id)
      .single()

    const authUser = {
      ...user,
      is_contributor: profile?.is_contributor || false
    }

    // Check if user can create communities
    const authResult = await roleAuthService.validateApiAccess(authUser, 'create_community')
    
    if (!authResult.allowed) {
      return NextResponse.json(
        { error: authResult.reason || "Insufficient permissions to create community" },
        { status: 403 }
      )
    }
    
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
      radius_meters: body.radius_meters,
      creator_id: user.id
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
