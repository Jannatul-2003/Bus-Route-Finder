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

    const members = await communityService.getMembersByCommunity(id)

    return NextResponse.json(members)
  } catch (error) {
    console.error("Error fetching community members:", error)
    return NextResponse.json(
      { error: "Failed to fetch community members" },
      { status: 500 }
    )
  }
}
