import { getSupabaseServer } from "@/lib/supabase/server"
import { CommunityService } from "@/lib/services/CommunityService"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServer()
    const communityService = new CommunityService(supabase)

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid community ID format. Expected UUID format." },
        { status: 400 }
      )
    }

    const community = await communityService.getCommunityById(id)

    if (!community) {
      return NextResponse.json(
        { error: "Community not found. Please check the community ID and try again." },
        { status: 404 }
      )
    }

    // Add the slug to the response for consistency
    const communityWithSlug = {
      ...community,
      slug: communityService.getCommunitySlug(community)
    }

    return NextResponse.json(communityWithSlug)
  } catch (error) {
    console.error("Error fetching community:", error)
    return NextResponse.json(
      { error: "Failed to fetch community. Please try again later." },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServer()
    const communityService = new CommunityService(supabase)
    const body = await request.json()

    const community = await communityService.updateCommunity(id, body)

    return NextResponse.json(community)
  } catch (error) {
    console.error("Error updating community:", error)
    return NextResponse.json(
      { error: "Failed to update community" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServer()
    const communityService = new CommunityService(supabase)

    await communityService.deleteCommunity(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting community:", error)
    return NextResponse.json(
      { error: "Failed to delete community" },
      { status: 500 }
    )
  }
}
