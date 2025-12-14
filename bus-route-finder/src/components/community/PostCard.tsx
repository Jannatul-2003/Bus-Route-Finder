import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { usePostNavigation } from "@/hooks/usePostNavigation"
import { communityStore } from "@/lib/stores/communityStore"
import { generatePostSlug } from "@/lib/utils/slugs"
import type { PostWithAuthor, PostType, PostStatus } from "@/lib/types/community"

interface PostCardProps {
  post: PostWithAuthor
  communityId?: string
  communitySlug?: string
  onView?: (postId: string) => void
  onEdit?: (postId: string) => void
  onDelete?: (postId: string) => void
  isAuthor?: boolean
  className?: string
}

function getPostTypeBadge(type: PostType) {
  const styles = {
    discussion: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    lost_item: "bg-red-500/10 text-red-700 border-red-500/20",
    found_item: "bg-green-500/10 text-green-700 border-green-500/20",
    delay_report: "bg-orange-500/10 text-orange-700 border-orange-500/20",
    emergency: "bg-red-600/10 text-red-800 border-red-600/20"
  }

  const labels = {
    discussion: "Discussion",
    lost_item: "Lost Item",
    found_item: "Found Item",
    delay_report: "Delay Report",
    emergency: "Emergency"
  }

  return { style: styles[type], label: labels[type] }
}

function getStatusBadge(status: PostStatus) {
  const styles = {
    active: "bg-green-500/10 text-green-700 border-green-500/20",
    resolved: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    closed: "bg-gray-500/10 text-gray-700 border-gray-500/20"
  }

  return styles[status]
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}

export function PostCard({
  post,
  communityId,
  communitySlug,
  onView,
  onEdit,
  onDelete,
  isAuthor = false,
  className
}: PostCardProps) {
  const { navigateToPost } = usePostNavigation()
  const typeBadge = getPostTypeBadge(post.post_type)
  const statusStyle = getStatusBadge(post.status)

  const handlePostClick = () => {
    if (onView) {
      onView(post.id)
    } else if (communitySlug && (post.slug || post.title)) {
      // Use slug-based navigation for enhanced SEO and user experience
      const postSlug = post.slug || generatePostSlug(post.title)
      const communityState = communityStore.getState()
      
      navigateToPost(communitySlug, postSlug, {
        communityName: communityState.selectedCommunity?.name,
        postTitle: post.title,
        previousRoute: `/community/c/${communitySlug}`,
        postId: post.id, // Keep ID for API calls
        communityId: communityId // Keep ID for API calls
      })
    } else if (communityId) {
      // For ID-based access, we need to redirect to slug-based URLs
      // This should be handled by a redirect mechanism or API resolution
      console.warn('ID-based navigation detected, should redirect to slug-based URL')
      // For now, we'll skip navigation and let the user know
      // In a real implementation, this would resolve the ID to a slug and redirect
    }
  }

  return (
    <div
      className={cn(
        "group relative rounded-2xl border bg-gradient-to-br from-card via-card to-card/50 p-6 shadow-lg transition-all duration-300",
        "hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40 hover:-translate-y-1 cursor-pointer",
        "backdrop-blur-sm border-border/50",
        className
      )}
      onClick={handlePostClick}
    >
      {/* Enhanced Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn("shadow-sm", typeBadge.style)}>
              {typeBadge.label}
            </Badge>
            <Badge variant="outline" className={cn("shadow-sm", statusStyle)}>
              {post.status}
            </Badge>
          </div>
          <h3 className="font-bold text-xl leading-tight text-foreground group-hover:text-primary transition-colors duration-300">
            {post.title}
          </h3>
        </div>
      </div>

      {/* Enhanced Content preview */}
      <p className="text-base text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
        {post.content}
      </p>

      {/* Enhanced Lost item details */}
      {(post.post_type === 'lost_item' || post.post_type === 'found_item') && post.item_category && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-gradient-to-r from-secondary/10 to-secondary/5 border border-secondary/20">
          <div className="p-1 rounded-md bg-secondary/20">
            <svg className="size-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="secondary" className="shadow-sm">{post.item_category}</Badge>
            {post.bus && (
              <span className="text-muted-foreground font-medium">on {post.bus.name}</span>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Photo preview */}
      {post.photo_url && (
        <div className="mb-4">
          <img
            src={post.photo_url}
            alt="Post attachment"
            className="w-full h-40 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-shadow duration-300"
          />
        </div>
      )}

      {/* Enhanced Stats and metadata */}
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 transition-colors group-hover:bg-primary/10">
            <svg className="size-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-sm font-medium text-foreground">{post.view_count}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 transition-colors group-hover:bg-secondary/10">
            <svg className="size-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <span className="text-sm font-medium text-foreground">{post.comment_count}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 transition-colors group-hover:bg-accent/10">
            <svg className="size-4 text-accent-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            <span className="text-sm font-medium text-foreground">{post.helpful_count}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{formatDate(post.created_at)}</span>
        </div>
      </div>

      {/* Author actions */}
      {isAuthor && (onEdit || onDelete) && (
        <div className="flex gap-2 mt-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <Button
              onClick={() => onEdit(post.id)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              onClick={() => onDelete(post.id)}
              variant="outline"
              size="sm"
              className="flex-1 text-red-600 hover:text-red-700"
            >
              Delete
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
