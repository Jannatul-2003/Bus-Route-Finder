import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { PostWithAuthor, PostType, PostStatus } from "@/lib/types/community"

interface PostCardProps {
  post: PostWithAuthor
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
  onView,
  onEdit,
  onDelete,
  isAuthor = false,
  className
}: PostCardProps) {
  const typeBadge = getPostTypeBadge(post.post_type)
  const statusStyle = getStatusBadge(post.status)

  return (
    <div
      className={cn(
        "group relative rounded-lg border bg-card p-4 shadow-sm transition-all duration-200",
        "hover:shadow-md hover:border-primary/30 cursor-pointer",
        className
      )}
      onClick={() => onView?.(post.id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={typeBadge.style}>
              {typeBadge.label}
            </Badge>
            <Badge variant="outline" className={statusStyle}>
              {post.status}
            </Badge>
          </div>
          <h3 className="font-semibold text-base leading-tight text-foreground">
            {post.title}
          </h3>
        </div>
      </div>

      {/* Content preview */}
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
        {post.content}
      </p>

      {/* Lost item details */}
      {(post.post_type === 'lost_item' || post.post_type === 'found_item') && post.item_category && (
        <div className="flex items-center gap-2 mb-3 text-sm">
          <Badge variant="secondary">{post.item_category}</Badge>
          {post.bus && (
            <span className="text-muted-foreground">on {post.bus.name}</span>
          )}
        </div>
      )}

      {/* Photo preview */}
      {post.photo_url && (
        <div className="mb-3">
          <img
            src={post.photo_url}
            alt="Post attachment"
            className="w-full h-32 object-cover rounded-md"
          />
        </div>
      )}

      {/* Stats and metadata */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {post.view_count}
          </span>
          <span className="flex items-center gap-1">
            <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            {post.comment_count}
          </span>
          <span className="flex items-center gap-1">
            <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            {post.helpful_count}
          </span>
        </div>
        <span>{formatDate(post.created_at)}</span>
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
