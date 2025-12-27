import { NextRequest, NextResponse } from 'next/server'
import { communityService } from '@/lib/services/CommunityService'

/**
 * API endpoint to resolve community identifiers
 * Supports both slug-to-ID and ID-to-slug resolution
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const id = searchParams.get('id')

    if (!slug && !id) {
      return NextResponse.json(
        { error: 'Either slug or id parameter is required' },
        { status: 400 }
      )
    }

    if (slug && id) {
      return NextResponse.json(
        { error: 'Only one parameter (slug or id) should be provided' },
        { status: 400 }
      )
    }

    if (slug) {
      // Resolve slug to community with ID
      const slugRegex = /^[a-zA-Z0-9_-]{1,100}$/
      if (!slugRegex.test(slug)) {
        return NextResponse.json(
          { error: 'Invalid slug format. Slug must contain only letters, numbers, hyphens, and underscores, and be 1-100 characters long.' },
          { status: 400 }
        )
      }

      const community = await communityService.getCommunityBySlug(slug)
      if (!community) {
        return NextResponse.json(
          { error: 'Community not found for the provided slug' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        id: community.id,
        slug: communityService.getCommunitySlug(community),
        name: community.name
      })
    }

    if (id) {
      // Resolve ID to community with slug
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(id)) {
        return NextResponse.json(
          { error: 'Invalid ID format. Expected UUID format.' },
          { status: 400 }
        )
      }

      const community = await communityService.getCommunityById(id)
      if (!community) {
        return NextResponse.json(
          { error: 'Community not found for the provided ID' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        id: community.id,
        slug: communityService.getCommunitySlug(community),
        name: community.name
      })
    }

  } catch (error) {
    console.error('Error resolving community identifier:', error)
    return NextResponse.json(
      { error: 'Failed to resolve community identifier. Please try again later.' },
      { status: 500 }
    )
  }
}