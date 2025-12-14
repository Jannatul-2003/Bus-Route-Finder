import { getSupabaseServer } from "@/lib/supabase/server"
import { CommunityService } from "@/lib/services/CommunityService"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postSlug: string }> }
) {
  try {
    const { slug, postSlug } = await params
    const supabase = await getSupabaseServer()
    const communityService = new CommunityService(supabase)

    // Validate slug formats (alphanumeric, hyphens, underscores, reasonable length)
    const slugRegex = /^[a-zA-Z0-9_-]{1,100}$/
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: "Invalid community slug format. Slug must contain only letters, numbers, hyphens, and underscores, and be 1-100 characters long." },
        { status: 400 }
      )
    }
    if (!slugRegex.test(postSlug)) {
      return NextResponse.json(
        { error: "Invalid post slug format. Slug must contain only letters, numbers, hyphens, and underscores, and be 1-100 characters long." },
        { status: 400 }
      )
    }

    // First, get the community by slug to get the community ID
    const community = await communityService.getCommunityBySlug(slug)
    if (!community) {
      return NextResponse.json(
        { error: "Community not found. Please check the community slug and try again." },
        { status: 404 }
      )
    }

    // Then get the post by slug within the community context
    const post = await communityService.getPostBySlug(community.id, postSlug)
    if (!post) {
      return NextResponse.json(
        { error: "Post not found. Please check the post slug and try again." },
        { status: 404 }
      )
    }

    // Increment view count
    await communityService.incrementPostViewCount(post.id)

    return NextResponse.json(post)
  } catch (error) {
    console.error("Error fetching post by slug:", error)
    return NextResponse.json(
      { error: "Failed to fetch post. Please try again later." },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postSlug: string }> }
) {
  try {
    const { slug, postSlug } = await params
    const supabase = await getSupabaseServer()
    const communityService = new CommunityService(supabase)

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required. Please log in to update posts." },
        { status: 401 }
      )
    }

    // Validate slug formats (alphanumeric, hyphens, underscores, reasonable length)
    const slugRegex = /^[a-zA-Z0-9_-]{1,100}$/
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: "Invalid community slug format. Slug must contain only letters, numbers, hyphens, and underscores, and be 1-100 characters long." },
        { status: 400 }
      )
    }
    if (!slugRegex.test(postSlug)) {
      return NextResponse.json(
        { error: "Invalid post slug format. Slug must contain only letters, numbers, hyphens, and underscores, and be 1-100 characters long." },
        { status: 400 }
      )
    }

    // First, get the community by slug to get the community ID
    const community = await communityService.getCommunityBySlug(slug)
    if (!community) {
      return NextResponse.json(
        { error: "Community not found. Please check the community slug and try again." },
        { status: 404 }
      )
    }

    // Then get the post by slug within the community context
    const post = await communityService.getPostBySlug(community.id, postSlug)
    if (!post) {
      return NextResponse.json(
        { error: "Post not found. Please check the post slug and try again." },
        { status: 404 }
      )
    }

    // Check if user is authorized to update this post
    if (post.author_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only update your own posts." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const updatedPost = await communityService.updatePost(post.id, body)

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error("Error updating post by slug:", error)
    return NextResponse.json(
      { error: "Failed to update post. Please try again later." },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postSlug: string }> }
) {
  try {
    const { slug, postSlug } = await params
    const supabase = await getSupabaseServer()
    const communityService = new CommunityService(supabase)

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required. Please log in to delete posts." },
        { status: 401 }
      )
    }

    // Validate slug formats (alphanumeric, hyphens, underscores, reasonable length)
    const slugRegex = /^[a-zA-Z0-9_-]{1,100}$/
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: "Invalid community slug format. Slug must contain only letters, numbers, hyphens, and underscores, and be 1-100 characters long." },
        { status: 400 }
      )
    }
    if (!slugRegex.test(postSlug)) {
      return NextResponse.json(
        { error: "Invalid post slug format. Slug must contain only letters, numbers, hyphens, and underscores, and be 1-100 characters long." },
        { status: 400 }
      )
    }

    // First, get the community by slug to get the community ID
    const community = await communityService.getCommunityBySlug(slug)
    if (!community) {
      return NextResponse.json(
        { error: "Community not found. Please check the community slug and try again." },
        { status: 404 }
      )
    }

    // Then get the post by slug within the community context
    const post = await communityService.getPostBySlug(community.id, postSlug)
    if (!post) {
      return NextResponse.json(
        { error: "Post not found. Please check the post slug and try again." },
        { status: 404 }
      )
    }

    // Check if user is authorized to delete this post
    if (post.author_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own posts." },
        { status: 403 }
      )
    }

    await communityService.deletePost(post.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting post by slug:", error)
    return NextResponse.json(
      { error: "Failed to delete post. Please try again later." },
      { status: 500 }
    )
  }
}