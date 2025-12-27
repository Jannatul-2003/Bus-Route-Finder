import { NextRequest, NextResponse } from 'next/server'
import { communityService } from '@/lib/services/CommunityService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const subPath = searchParams.get('subPath')
    const originalUrl = searchParams.get('originalUrl')
    
    // Validate that this is a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid community ID format' },
        { status: 400 }
      )
    }

    // Get community by ID to resolve to slug
    const community = await communityService.getCommunityById(id)
    
    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    // Generate slug from community name
    const slug = communityService.getCommunitySlug(community)
    
    // Build the new slug-based URL
    let newPath = `/community/c/${slug}`
    
    // Handle sub-paths (like create-post, etc.)
    if (subPath) {
      // Map legacy sub-paths to new slug-based paths
      if (subPath === 'create-post') {
        newPath += '/create-post'
      } else if (subPath.startsWith('post/')) {
        // This will be handled by the post redirect endpoint
        const postId = subPath.replace('post/', '')
        const postRedirectUrl = new URL(`/api/redirect/post/${id}/${postId}`, request.url)
        return NextResponse.redirect(postRedirectUrl)
      } else {
        // For other sub-paths, just append them
        newPath += `/${subPath}`
      }
    }
    
    // Redirect to the slug-based URL
    const redirectUrl = new URL(newPath, request.url)
    return NextResponse.redirect(redirectUrl, 301) // Permanent redirect
  } catch (error) {
    console.error('Error redirecting community:', error)
    return NextResponse.json(
      { error: 'Failed to redirect community' },
      { status: 500 }
    )
  }
}