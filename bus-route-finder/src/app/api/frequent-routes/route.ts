import { getSupabaseServer } from "@/lib/supabase/server"
import { CommunityService } from "@/lib/services/CommunityService"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
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

    // Validate required fields
    if (!body.bus_id || !body.onboarding_stop_id || !body.offboarding_stop_id) {
      return NextResponse.json(
        { error: "Missing required fields: bus_id, onboarding_stop_id, offboarding_stop_id" },
        { status: 400 }
      )
    }

    const route = await communityService.addFrequentRoute({
      user_id: user.id,
      bus_id: body.bus_id,
      onboarding_stop_id: body.onboarding_stop_id,
      offboarding_stop_id: body.offboarding_stop_id
    })

    return NextResponse.json(route, { status: 201 })
  } catch (error) {
    console.error("Error adding frequent route:", error)
    return NextResponse.json(
      { error: "Failed to add frequent route" },
      { status: 500 }
    )
  }
}
