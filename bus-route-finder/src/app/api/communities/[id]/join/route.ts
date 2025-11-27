import { getSupabaseServer } from "@/lib/supabase/server"
import { CommunityService } from "@/lib/services/CommunityService"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServer()
    const communityService = new CommunityService(supabase)

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()

    const member = await communityService.joinCommunity(
      id,
      user.id,
      body.notification_preferences
    )

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error("Error joining community:", error)
    return NextResponse.json(
      { error: "Failed to join community" },
      { status: 500 }
    )
  }
}
