import { getSupabaseServer } from "@/lib/supabase/server"
import { CommunityService } from "@/lib/services/CommunityService"
import type { PostType, PostStatus } from "@/lib/types/community"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServer()
    const communityService = new CommunityService(supabase)

    const searchParams = request.nextUrl.searchParams
    const postType = searchParams.get("post_type") as PostType | null
    const status = searchParams.get("status") as PostStatus | null
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    const posts = await communityService.getPostsByCommunity(id, {
      postType: postType || undefined,
      status: status || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error("Error fetching community posts:", error)
    return NextResponse.json(
      { error: "Failed to fetch community posts" },
      { status: 500 }
    )
  }
}

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

    // Validate required fields
    if (!body.post_type || !body.title || !body.content) {
      return NextResponse.json(
        { error: "Missing required fields: post_type, title, content" },
        { status: 400 }
      )
    }

    const post = await communityService.createPost({
      community_id: id,
      author_id: user.id,
      post_type: body.post_type,
      title: body.title,
      content: body.content,
      item_category: body.item_category,
      item_description: body.item_description,
      photo_url: body.photo_url,
      location_latitude: body.location_latitude,
      location_longitude: body.location_longitude,
      bus_id: body.bus_id
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    )
  }
}
