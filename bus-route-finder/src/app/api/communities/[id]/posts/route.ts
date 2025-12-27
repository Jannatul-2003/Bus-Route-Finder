import { NextRequest, NextResponse } from 'next/server'
import { CommunityService } from '@/lib/services/CommunityService'
import { getSupabaseServer } from '@/lib/supabase/server'
import { PostType, PostStatus } from '@/lib/types/community'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params
    const { searchParams } = new URL(request.url)
    
    // Get server-side Supabase client with auth context
    const supabase = await getSupabaseServer()
    const communityService = new CommunityService(supabase)
    
    // Validate community ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(communityId)) {
      return NextResponse.json(
        { error: 'Invalid community ID format' },
        { status: 400 }
      )
    }

    // Verify community exists
    const community = await communityService.getCommunityById(communityId)
    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
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

    // Fetch posts using the service
    const posts = await communityService.getPostsByCommunity(communityId, {
      postType: postType || undefined,
      status: status || undefined,
      limit: validatedLimit,
      offset: validatedOffset
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching community posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch community posts' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params
    const body = await request.json()

    // Get server-side Supabase client with auth context
    const supabase = await getSupabaseServer()
    const communityService = new CommunityService(supabase)

    // Validate community ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(communityId)) {
      return NextResponse.json(
        { error: 'Invalid community ID format' },
        { status: 400 }
      )
    }

    // Verify community exists
    const community = await communityService.getCommunityById(communityId)
    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    // Handle bus name to bus ID mapping if bus_name is provided
    let busId = body.bus_id
    if (body.bus_name && !busId) {
      busId = await communityService.getBusIdByName(body.bus_name)
      if (!busId) {
        return NextResponse.json(
          { error: `Bus with name '${body.bus_name}' not found` },
          { status: 400 }
        )
      }
    }

    // Validate required fields
    if (!body.author_id || !body.post_type || !body.title || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields: author_id, post_type, title, content' },
        { status: 400 }
      )
    }

    // Generate slug if not provided
    let slug = body.slug
    if (!slug) {
      slug = await communityService.generateUniquePostSlug(communityId, body.title)
    }

    // Create post using the service
    const post = await communityService.createPost({
      community_id: communityId,
      author_id: body.author_id,
      post_type: body.post_type,
      title: body.title,
      content: body.content,
      slug: slug,
      item_category: body.item_category,
      item_description: body.item_description,
      photo_url: body.photo_url,
      location_latitude: body.location_latitude,
      location_longitude: body.location_longitude,
      bus_id: busId
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating community post:', error)
    return NextResponse.json(
      { error: 'Failed to create community post' },
      { status: 500 }
    )
  }
}