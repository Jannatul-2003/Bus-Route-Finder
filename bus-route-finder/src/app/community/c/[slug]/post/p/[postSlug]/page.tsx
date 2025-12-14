"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { communityStore } from "@/lib/stores/communityStore"
import { CommentCard } from "@/components/community/CommentCard"
import { PostNavigationBreadcrumb } from "@/components/community/PostNavigationBreadcrumb"
import { usePostNavigation } from "@/hooks/usePostNavigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"
import { HelpfulButton } from "@/components/community/HelpfulButton"

export default function SlugBasedPostDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const { navigateBackFromPost } = usePostNavigation()
  const postSlug = params.postSlug as string
  const communitySlug = params.slug as string
  
  const [state, setState] = React.useState(communityStore.getState())
  const [commentContent, setCommentContent] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    const observer = {
      update: (newState: typeof state) => setState(newState)
    }
    communityStore.subscribe(observer)
    return () => communityStore.unsubscribe(observer)
  }, [])

  React.useEffect(() => {
    // Ensure component is mounted before showing interactive elements
    setIsMounted(true)
  }, [])

  React.useEffect(() => {
    const fetchPostData = async () => {
      if (!postSlug || !communitySlug) return

      setIsLoading(true)
      setError(null)

      try {
        // First, resolve community by slug to get community ID
        const response = await fetch(`/api/communities/by-slug/${communitySlug}`)
        if (!response.ok) {
          throw new Error('Community not found')
        }
        const community = await response.json()

        // Then fetch the post by slug within the community context
        const postResponse = await fetch(`/api/communities/by-slug/${communitySlug}/posts/${postSlug}`)
        if (!postResponse.ok) {
          throw new Error('Post not found')
        }
        const post = await postResponse.json()

        // Use existing store methods to fetch and set the data
        await communityStore.fetchCommunityById(community.id)
        await communityStore.fetchPostById(post.id)
        
        // Fetch comments for the post
        if (post.id) {
          communityStore.fetchPostComments(post.id)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPostData()
  }, [postSlug, communitySlug])

  // Enhanced back navigation handler
  const handleBackNavigation = () => {
    navigateBackFromPost()
  }

  const handleSubmitComment = async () => {
    if (!commentContent.trim() || !state.selectedPost?.id) return

    setIsSubmitting(true)
    await communityStore.createComment(state.selectedPost.id, {
      content: commentContent
    })
    setCommentContent("")
    setIsSubmitting(false)
  }

  const handleMarkResolved = async () => {
    if (!state.selectedPost?.id) return
    await communityStore.updatePost(state.selectedPost.id, { status: 'resolved' })
  }

  const handleEditComment = async (commentId: string) => {
    const comment = state.comments.find(c => c.id === commentId)
    if (!comment) return
    
    const newContent = prompt('Edit your comment:', comment.content)
    if (newContent && newContent.trim() && newContent !== comment.content) {
      try {
        await communityStore.updateComment(commentId, { content: newContent.trim() })
        // Refetch comments to get updated data
        if (state.selectedPost?.id) {
          await communityStore.fetchPostComments(state.selectedPost.id)
        }
      } catch (error) {
        console.error('Failed to update comment:', error)
      }
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      try {
        await communityStore.deleteComment(commentId)
        // Refetch comments to get updated list
        if (state.selectedPost?.id) {
          await communityStore.fetchPostComments(state.selectedPost.id)
        }
      } catch (error) {
        console.error('Failed to delete comment:', error)
      }
    }
  }

  const handleHelpfulComment = async (commentId: string) => {
    try {
      // Simple increment without user tracking (since DB schema doesn't support it yet)
      const response = await fetch(`/api/comments/${commentId}/helpful`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        // Refetch comments to get updated helpful count
        if (state.selectedPost?.id) {
          await communityStore.fetchPostComments(state.selectedPost.id)
        }
      } else {
        throw new Error('Failed to mark comment as helpful')
      }
    } catch (error) {
      console.error('Failed to mark comment as helpful:', error)
      alert('Failed to mark comment as helpful. This feature may not be fully implemented yet.')
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Loading post...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!state.selectedPost) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Post not found</p>
      </div>
    )
  }

  const post = state.selectedPost

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Enhanced Navigation with Breadcrumbs */}
      <div className="flex items-center justify-between mb-6">
        <PostNavigationBreadcrumb 
          communitySlug={communitySlug}
          postTitle={post.title}
          className="flex-1"
        />
        {post.status === 'active' && user?.id === post.author_id && (
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
        
        {/* Enhanced post metadata display (Requirements 5.2, 5.4) */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="size-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-foreground">
                {post.author?.email || 'Unknown Author'}
              </p>
              <p className="text-xs">
                Posted {new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          {post.updated_at !== post.created_at && (
            <div className="text-xs">
              <span className="text-muted-foreground">Last updated:</span>
              <span className="ml-1">{new Date(post.updated_at).toLocaleDateString()} at {new Date(post.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>
        
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

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {post.view_count || 0} views
            </span>
            <span className="flex items-center gap-1">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              {post.comment_count || 0} comments
            </span>
          </div>
          <HelpfulButton 
            postId={post.id} 
            initialCount={post.helpful_count || 0} 
            variant="default"
          />
        </div>
      </div>

      {/* Enhanced Comments section - Universal visibility (Requirements 4.4, 5.1, 5.5) */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <svg className="size-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          Comments ({state.comments.length})
        </h2>

        {/* Enhanced Comment form - Active interface for authenticated users (Requirements 3.1, 3.4) */}
        <div className="bg-gradient-to-r from-card via-card to-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 mb-6 shadow-lg">
          {!isMounted ? (
            <div className="flex items-center justify-center py-8" suppressHydrationWarning>
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mr-2"></div>
              <span className="text-muted-foreground">Loading...</span>
            </div>
          ) : authLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mr-2"></div>
              <span className="text-muted-foreground">Loading...</span>
            </div>
          ) : (
            <Textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder={
                user 
                  ? "Write a comment..." 
                  : "Please log in to write a comment"
              }
              rows={3}
              className="mb-4 bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
              disabled={!user}
            />
          )}
          {isMounted && !authLoading && (
            <div className="flex items-center justify-between">
            {user ? (
              <Button
                onClick={handleSubmitComment}
                disabled={!commentContent.trim() || isSubmitting}
                className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-300"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Posting...
                  </>
                ) : (
                  <>
                    <svg className="size-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Post Comment
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => router.push('/auth/login')}
                variant="outline"
                className="border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/40 transition-all duration-300"
              >
                <svg className="size-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                </svg>
                Log in to comment
              </Button>
            )}
            {user && (
              <div className="text-xs text-muted-foreground">
                Commenting as {user.email}
              </div>
            )}
            </div>
          )}
        </div>

        {/* Enhanced Comments list */}
        {state.comments.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 rounded-xl border border-border/50">
            <div className="mb-4">
              <svg className="size-12 mx-auto text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <p className="text-muted-foreground text-lg font-medium mb-2">
              No comments yet
            </p>
            <p className="text-muted-foreground/70 text-sm">
              {user ? "Be the first to comment!" : "Log in to start the conversation"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {state.comments.map((comment) => (
              <CommentCard 
                key={comment.id} 
                comment={comment}
                isAuthor={user?.email === comment.author?.email}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
                onHelpful={handleHelpfulComment}
                className="bg-gradient-to-r from-card via-card to-card/50 backdrop-blur-sm border-border/50 shadow-md hover:shadow-lg transition-all duration-300"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}