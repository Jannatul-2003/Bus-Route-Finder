import { NextRequest, NextResponse } from 'next/server'
import { communityService } from '@/lib/services/CommunityService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string; postId: string }> }
) {
  try {
    const { communityId, postId } = await params
    const { searchParams } = new URL(request.url)
    const originalUrl = searchParams.get('originalUrl')
    
    // Validate that these are UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(communityId) || !uuidRegex.test(postId)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      )
    }

    // Get community by ID to resolve to slug
    const community = await communityService.getCommunityById(communityId)
    
    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    // Get post by ID to resolve to slug
    const post = await communityService.getPostById(postId)
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Verify the post belongs to the community
    if (post.community_id !== communityId) {
      return NextResponse.json(
        { error: 'Post does not belong to the specified community' },
        { status: 400 }
      )
    }

    // Generate slugs
    const communitySlug = communityService.getCommunitySlug(community)
    const postSlug = post.slug
    
    if (!postSlug) {
      return NextResponse.json(
        { error: 'Post does not have a slug' },
        { status: 500 }
      )
    }
    
    // Build the new slug-based URL
    const newPath = `/community/c/${communitySlug}/post/p/${postSlug}`
    
    // Redirect to the slug-based URL
    const redirectUrl = new URL(newPath, request.url)
    return NextResponse.redirect(redirectUrl, 301) // Permanent redirect
  } catch (error) {
    console.error('Error redirecting post:', error)
    return NextResponse.json(
      { error: 'Failed to redirect post' },
      { status: 500 }
    )
  }
}