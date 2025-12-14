import { NextRequest, NextResponse } from 'next/server'
import { communityService } from '@/lib/services/CommunityService'

/**
 * API endpoint to resolve post identifiers within community context
 * Supports both slug-to-ID and ID-to-slug resolution for posts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get('community_id')
    const communitySlug = searchParams.get('community_slug')
    const postSlug = searchParams.get('post_slug')
    const postId = searchParams.get('post_id')

    // Validate that we have community context
    if (!communityId && !communitySlug) {
      return NextResponse.json(
        { error: 'Either community_id or community_slug is required' },
        { status: 400 }
      )
    }

    // Validate that we have post identifier
    if (!postSlug && !postId) {
      return NextResponse.json(
        { error: 'Either post_slug or post_id is required' },
        { status: 400 }
      )
    }

    if (postSlug && postId) {
      return NextResponse.json(
        { error: 'Only one post identifier (post_slug or post_id) should be provided' },
        { status: 400 }
      )
    }

    // Resolve community first
    let community
    if (communitySlug) {
      const slugRegex = /^[a-zA-Z0-9_-]{1,100}$/
      if (!slugRegex.test(communitySlug)) {
        return NextResponse.json(
          { error: 'Invalid community slug format' },
          { status: 400 }
        )
      }
      community = await communityService.getCommunityBySlug(communitySlug)
    } else if (communityId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(communityId)) {
        return NextResponse.json(
          { error: 'Invalid community ID format' },
          { status: 400 }
        )
      }
      community = await communityService.getCommunityById(communityId)
    }

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    // Resolve post
    let post
    if (postSlug) {
      const slugRegex = /^[a-zA-Z0-9_-]{1,100}$/
      if (!slugRegex.test(postSlug)) {
        return NextResponse.json(
          { error: 'Invalid post slug format' },
          { status: 400 }
        )
      }
      post = await communityService.getPostBySlug(community.id, postSlug)
    } else if (postId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(postId)) {
        return NextResponse.json(
          { error: 'Invalid post ID format' },
          { status: 400 }
        )
      }
      post = await communityService.getPostById(postId)
      
      // Verify the post belongs to the specified community
      if (post && post.community_id !== community.id) {
        return NextResponse.json(
          { error: 'Post does not belong to the specified community' },
          { status: 404 }
        )
      }
    }

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      post: {
        id: post.id,
        slug: post.slug,
        title: post.title
      },
      community: {
        id: community.id,
        slug: communityService.getCommunitySlug(community),
        name: community.name
      }
    })

  } catch (error) {
    console.error('Error resolving post identifier:', error)
    return NextResponse.json(
      { error: 'Failed to resolve post identifier. Please try again later.' },
      { status: 500 }
    )
  }
}