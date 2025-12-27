import { getSupabaseServer } from "@/lib/supabase/server"
import { CommunityService } from "@/lib/services/CommunityService"
import { roleAuthService } from "@/lib/services/RoleAuthorizationService"
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

    // Check if user can leave communities
    const authResult = await roleAuthService.validateApiAccess(authUser, 'leave_community', id)
    
    if (!authResult.allowed) {
      return NextResponse.json(
        { error: authResult.reason || "Insufficient permissions to leave community" },
        { status: 403 }
      )
    }

    await communityService.leaveCommunity(id, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error leaving community:", error)
    return NextResponse.json(
      { error: "Failed to leave community" },
      { status: 500 }
    )
  }
}
