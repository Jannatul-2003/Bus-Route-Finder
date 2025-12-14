import { NextRequest, NextResponse } from 'next/server'
import { CommunityService } from '@/lib/services/CommunityService'
import { getSupabaseServer } from '@/lib/supabase/server'
import { PostType, PostStatus } from '@/lib/types/community'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    
    // Get server-side Supabase client with auth context
    const supabase = await getSupabaseServer()
    const communityService = new CommunityService(supabase)
    
    // Validate slug format (alphanumeric, hyphens, underscores, reasonable length)
    const slugRegex = /^[a-zA-Z0-9_-]{1,100}$/
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: 'Invalid community slug format. Slug must contain only letters, numbers, hyphens, and underscores, and be 1-100 characters long.' },
        { status: 400 }
      )
    }

    // Get community by slug first
    const community = await communityService.getCommunityBySlug(slug)
    if (!community) {
      return NextResponse.json(
        { error: 'Community not found. Please check the community slug and try again.' },
        { status: 404 }
      )
    }
    
    // Parse query parameters
    const postType = searchParams.get('post_type') as PostType | null
    const status = searchParams.get('status') as PostStatus | null
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined

    // Validate limit and offset
    const validatedLimit = limit && limit > 0 && limit <= 100 ? limit : 20
    const validatedOffset = offset && offset >= 0 ? offset : 0

    // Fetch posts using the service with the community ID
    const posts = await communityService.getPostsByCommunity(community.id, {
      postType: postType || undefined,
      status: status || undefined,
      limit: validatedLimit,
      offset: validatedOffset
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching community posts by slug:', error)
    return NextResponse.json(
      { error: 'Failed to fetch community posts. Please try again later.' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()

    // Get server-side Supabase client with auth context
    const supabase = await getSupabaseServer()
    const communityService = new CommunityService(supabase)

    // Validate slug format (alphanumeric, hyphens, underscores, reasonable length)
    const slugRegex = /^[a-zA-Z0-9_-]{1,100}$/
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: 'Invalid community slug format. Slug must contain only letters, numbers, hyphens, and underscores, and be 1-100 characters long.' },
        { status: 400 }
      )
    }

    // Get community by slug first
    const community = await communityService.getCommunityBySlug(slug)
    if (!community) {
      return NextResponse.json(
        { error: 'Community not found. Please check the community slug and try again.' },
        { status: 404 }
      )
    }

    // Handle bus name to bus ID mapping if bus_name is provided
    let busId = body.bus_id
    if (body.bus_name && !busId) {
      busId = await communityService.getBusIdByName(body.bus_name)
      if (!busId) {
        return NextResponse.json(
          { error: `Bus with name '${body.bus_name}' not found. Please check the bus name and try again.` },
          { status: 400 }
        )
      }
    }

    // Validate required fields
    if (!body.author_id || !body.post_type || !body.title || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields: author_id, post_type, title, content. Please provide all required information.' },
        { status: 400 }
      )
    }

    // Generate slug if not provided
    let postSlug = body.slug
    if (!postSlug) {
      postSlug = await communityService.generateUniquePostSlug(community.id, body.title)
    }

    // Create post using the service with the community ID
    const post = await communityService.createPost({
      community_id: community.id,
      author_id: body.author_id,
      post_type: body.post_type,
      title: body.title,
      content: body.content,
      slug: postSlug,
      item_category: body.item_category,
      item_description: body.item_description,
      photo_url: body.photo_url,
      location_latitude: body.location_latitude,
      location_longitude: body.location_longitude,
      bus_id: busId
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating community post by slug:', error)
    return NextResponse.json(
      { error: 'Failed to create community post. Please try again later.' },
      { status: 500 }
    )
  }
}