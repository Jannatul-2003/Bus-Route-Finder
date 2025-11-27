"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { communityStore } from "@/lib/stores/communityStore"
import { CommentCard } from "@/components/community/CommentCard"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

export default function PostDetailPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.postId as string
  
  const [state, setState] = React.useState(communityStore.getState())
  const [commentContent, setCommentContent] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    const observer = {
      update: (newState: typeof state) => setState(newState)
    }
    communityStore.subscribe(observer)
    return () => communityStore.unsubscribe(observer)
  }, [])

  React.useEffect(() => {
    if (postId) {
      communityStore.fetchPostById(postId)
      communityStore.fetchPostComments(postId)
    }
  }, [postId])

  const handleSubmitComment = async () => {
    if (!commentContent.trim() || !postId) return

    setIsSubmitting(true)
    await communityStore.createComment(postId, {
      content: commentContent
    })
    setCommentContent("")
    setIsSubmitting(false)
  }

  const handleMarkResolved = async () => {
    if (!postId) return
    await communityStore.updatePost(postId, { status: 'resolved' })
  }

  if (!state.selectedPost) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Loading post...</p>
      </div>
    )
  }

  const post = state.selectedPost

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button onClick={() => router.back()} variant="outline">
          Back
        </Button>
        {post.status === 'active' && (
          <Button onClick={handleMarkResolved} variant="outline">
            Mark as Resolved
          </Button>
        )}
      </div>

      {/* Post content */}
      <div className="bg-card border rounded-lg p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline">{post.post_type.replace('_', ' ')}</Badge>
          <Badge variant="outline">{post.status}</Badge>
        </div>

        <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
        
        <p className="text-foreground whitespace-pre-wrap mb-4">{post.content}</p>

        {post.photo_url && (
          <img
            src={post.photo_url}
            alt="Post attachment"
            className="w-full max-h-96 object-contain rounded-lg mb-4"
          />
        )}

        {(post.post_type === 'lost_item' || post.post_type === 'found_item') && (
          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-2">Item Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {post.item_category && (
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <span className="ml-2 font-medium">{post.item_category}</span>
                </div>
              )}
              {post.bus && (
                <div>
                  <span className="text-muted-foreground">Bus:</span>
                  <span className="ml-2 font-medium">{post.bus.name}</span>
                </div>
              )}
            </div>
            {post.item_description && (
              <p className="mt-2 text-sm text-muted-foreground">{post.item_description}</p>
            )}
          </div>
        )}

        <div className="flex items-center gap-6 mt-4 pt-4 border-t text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {post.view_count} views
          </span>
          <span className="flex items-center gap-1">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            {post.comment_count} comments
          </span>
        </div>
      </div>

      {/* Comments section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Comments ({state.comments.length})</h2>

        {/* Comment form */}
        <div className="bg-card border rounded-lg p-4 mb-4">
          <Textarea
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
            className="mb-3"
          />
          <Button
            onClick={handleSubmitComment}
            disabled={!commentContent.trim() || isSubmitting}
          >
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        </div>

        {/* Comments list */}
        {state.comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          <div className="space-y-3">
            {state.comments.map((comment) => (
              <CommentCard key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
