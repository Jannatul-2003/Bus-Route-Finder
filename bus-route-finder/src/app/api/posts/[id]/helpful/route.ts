import { getSupabaseServer } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    const supabase = await getSupabaseServer()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if user is a member of the community that owns this post
    const { data: postData, error: postError } = await supabase
      .from('community_posts')
      .select('community_id')
      .eq('id', postId)
      .single()

    if (postError || !postData) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      )
    }

    const { data: memberData, error: memberError } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', postData.community_id)
      .eq('user_id', user.id)
      .single()

    if (memberError || !memberData) {
      return NextResponse.json(
        { error: "You must be a member of this community to interact with posts" },
        { status: 403 }
      )
    }

    // Check if user already marked this post as helpful
    const { data: existingInteraction, error: checkError } = await supabase
      .from('post_helpful_interactions')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing interaction:', checkError)
      return NextResponse.json(
        { error: "Failed to check interaction status" },
        { status: 500 }
      )
    }

    let isHelpful = false

    if (existingInteraction) {
      // Remove helpful mark
      const { error: deleteError } = await supabase
        .from('post_helpful_interactions')
        .delete()
        .eq('id', existingInteraction.id)

      if (deleteError) {
        console.error('Error removing helpful interaction:', deleteError)
        return NextResponse.json(
          { error: "Failed to remove helpful mark" },
          { status: 500 }
        )
      }
      isHelpful = false
    } else {
      // Add helpful mark
      const { error: insertError } = await supabase
        .from('post_helpful_interactions')
        .insert({
          post_id: postId,
          user_id: user.id
        })

      if (insertError) {
        console.error('Error adding helpful interaction:', insertError)
        return NextResponse.json(
          { error: "Failed to add helpful mark" },
          { status: 500 }
        )
      }
      isHelpful = true
    }

    // Get updated helpful count
    const { data: updatedPost, error: countError } = await supabase
      .from('community_posts')
      .select('helpful_count')
      .eq('id', postId)
      .single()

    if (countError) {
      console.error('Error fetching updated count:', countError)
      return NextResponse.json(
        { error: "Failed to fetch updated count" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      isHelpful,
      helpfulCount: updatedPost.helpful_count
    })
  } catch (error) {
    console.error("Error toggling helpful status:", error)
    return NextResponse.json(
      { error: "Failed to toggle helpful status" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    const supabase = await getSupabaseServer()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if user marked this post as helpful
    const { data: interaction, error: checkError } = await supabase
      .from('post_helpful_interactions')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking helpful status:', checkError)
      return NextResponse.json(
        { error: "Failed to check helpful status" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      isHelpful: !!interaction
    })
  } catch (error) {
    console.error("Error fetching helpful status:", error)
    return NextResponse.json(
      { error: "Failed to fetch helpful status" },
      { status: 500 }
    )
  }
}