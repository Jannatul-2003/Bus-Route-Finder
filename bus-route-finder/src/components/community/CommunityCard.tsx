import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { CommunityWithDistance } from "@/lib/types/community"

interface CommunityCardProps {
  community: CommunityWithDistance
  isMember?: boolean
  onJoin?: (communityId: string) => void
  onLeave?: (communityId: string) => void
  onView?: (communityId: string) => void
  className?: string
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m away`
  }
  return `${(meters / 1000).toFixed(1)}km away`
}

export function CommunityCard({
  community,
  isMember = false,
  onJoin,
  onLeave,
  onView,
  className
}: CommunityCardProps) {
  const handleAction = () => {
    if (isMember && onLeave) {
      onLeave(community.id)
    } else if (!isMember && onJoin) {
      onJoin(community.id)
    }
  }

  const handleView = () => {
    if (onView) {
      onView(community.id)
    }
  }

  return (
    <div
      className={cn(
        "group relative rounded-lg border bg-card p-4 shadow-sm transition-all duration-200",
        "hover:shadow-md hover:border-primary/30",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg leading-tight text-foreground mb-1">
            {community.name}
          </h3>
          {community.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {community.description}
            </p>
          )}
        </div>
        
        {isMember && (
          <Badge variant="default" className="shrink-0">
            Member
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-3 text-sm">
        <div className="flex items-center gap-1.5">
          <svg
            className="size-4 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span className="text-muted-foreground">{community.member_count} members</span>
        </div>

        <div className="flex items-center gap-1.5">
          <svg
            className="size-4 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          <span className="text-muted-foreground">{community.post_count} posts</span>
        </div>
      </div>

      {/* Distance */}
      {community.distance !== undefined && (
        <div className="flex items-center gap-1.5 mb-3 text-sm">
          <svg
            className="size-4 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-muted-foreground">{formatDistance(community.distance)}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t">
        <Button
          onClick={handleView}
          variant="outline"
          className="flex-1"
        >
          View
        </Button>
        <Button
          onClick={handleAction}
          variant={isMember ? "outline" : "default"}
          className="flex-1"
        >
          {isMember ? "Leave" : "Join"}
        </Button>
      </div>
    </div>
  )
}
