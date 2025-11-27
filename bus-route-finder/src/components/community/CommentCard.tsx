import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { CommentWithAuthor } from "@/lib/types/community"

interface CommentCardProps {
  comment: CommentWithAuthor
  onEdit?: (commentId: string) => void
  onDelete?: (commentId: string) => void
  isAuthor?: boolean
  className?: string
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

export function CommentCard({
  comment,
  onEdit,
  onDelete,
  isAuthor = false,
  className
}: CommentCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-lg border bg-card p-3 shadow-sm",
        comment.is_resolution && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="size-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {comment.author?.email || 'Anonymous'}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(comment.created_at)}
            </p>
          </div>
        </div>

        {comment.is_resolution && (
          <Badge variant="default" className="bg-green-600">
            Solution
          </Badge>
        )}
      </div>

      {/* Content */}
      <p className="text-sm text-foreground mb-2 whitespace-pre-wrap">
        {comment.content}
      </p>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          {comment.helpful_count} helpful
        </span>

        {/* Author actions */}
        {isAuthor && (onEdit || onDelete) && (
          <div className="flex gap-2">
            {onEdit && (
              <Button
                onClick={() => onEdit(comment.id)}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                onClick={() => onDelete(comment.id)}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
