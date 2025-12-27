import { NextRequest, NextResponse } from 'next/server'
import { communityService } from '@/lib/services/CommunityService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    // Validate slug format (alphanumeric, hyphens, underscores, minimum length)
    const slugRegex = /^[a-zA-Z0-9_-]{1,100}$/
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: 'Invalid community slug format. Slug must contain only letters, numbers, hyphens, and underscores, and be 1-100 characters long.' },
        { status: 400 }
      )
    }

    // Get community by slug
    const community = await communityService.getCommunityBySlug(slug)
    
    if (!community) {
      return NextResponse.json(
        { error: 'Community not found. Please check the community slug and try again.' },
        { status: 404 }
      )
    }

    // Add the slug to the response for consistency
    const communityWithSlug = {
      ...community,
      slug: communityService.getCommunitySlug(community)
    }

    return NextResponse.json(communityWithSlug)
  } catch (error) {
    console.error('Error fetching community by slug:', error)
    return NextResponse.json(
      { error: 'Failed to fetch community. Please try again later.' },
      { status: 500 }
    )
  }
}