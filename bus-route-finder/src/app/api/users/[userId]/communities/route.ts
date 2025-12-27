import { getSupabaseServer } from "@/lib/supabase/server"
import { CommunityService } from "@/lib/services/CommunityService"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const supabase = await getSupabaseServer()
    const communityService = new CommunityService(supabase)

    const communities = await communityService.getCommunitiesByUser(userId)

    return NextResponse.json(communities)
  } catch (error) {
    console.error("Error fetching user communities:", error)
    return NextResponse.json(
      { error: "Failed to fetch user communities" },
      { status: 500 }
    )
  }
}
