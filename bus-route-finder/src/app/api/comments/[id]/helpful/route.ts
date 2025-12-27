import { getSupabaseServer } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params
    const supabase = await getSupabaseServer()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if comment exists
    const { data: commentData, error: commentError } = await supabase
      .from('post_comments')
      .select('id, helpful_count')
      .eq('id', commentId)
      .single()

    if (commentError || !commentData) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      )
    }

    // Simple increment (no user tracking for now since DB schema doesn't support it)
    const { data: updatedComment, error: updateError } = await supabase
      .from('post_comments')
      .update({ 
        helpful_count: commentData.helpful_count + 1 
      })
      .eq('id', commentId)
      .select('helpful_count')
      .single()

    if (updateError) {
      console.error('Error updating comment helpful count:', updateError)
      return NextResponse.json(
        { error: "Failed to update helpful count" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      helpfulCount: updatedComment.helpful_count
    })
  } catch (error) {
    console.error("Error in helpful comment API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}