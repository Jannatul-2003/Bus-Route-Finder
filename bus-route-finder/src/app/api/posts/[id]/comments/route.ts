import { getSupabaseServer } from "@/lib/supabase/server"
import { CommunityService } from "@/lib/services/CommunityService"
import { roleAuthService } from "@/lib/services/RoleAuthorizationService"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServer()
    const communityService = new CommunityService(supabase)

    const comments = await communityService.getCommentsByPost(id)

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json(
      { error: "Failed to fetch comments" },
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

    // Check if user can comment on this post
    const authResult = await roleAuthService.validateApiAccess(authUser, 'comment_post', id)
    
    if (!authResult.allowed) {
      return NextResponse.json(
        { error: authResult.reason || "Insufficient permissions to comment on post" },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.content) {
      return NextResponse.json(
        { error: "Missing required field: content" },
        { status: 400 }
      )
    }

    // Validate content length (database constraint: 1-2000 characters)
    if (typeof body.content !== 'string' || body.content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content cannot be empty" },
        { status: 400 }
      )
    }

    if (body.content.length > 2000) {
      return NextResponse.json(
        { error: "Comment content cannot exceed 2000 characters" },
        { status: 400 }
      )
    }

    const comment = await communityService.createComment({
      post_id: id,
      author_id: user.id,
      content: body.content,
      is_resolution: body.is_resolution,
      contact_info: body.contact_info
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error("Error creating comment:", error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('violates foreign key constraint')) {
        return NextResponse.json(
          { error: "Post not found or invalid" },
          { status: 404 }
        )
      }
      if (error.message.includes('violates check constraint')) {
        return NextResponse.json(
          { error: "Comment content is invalid or too long" },
          { status: 400 }
        )
      }
      if (error.message.includes('permission denied')) {
        return NextResponse.json(
          { error: "You don't have permission to comment on this post" },
          { status: 403 }
        )
      }
    }
    
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    )
  }
}
