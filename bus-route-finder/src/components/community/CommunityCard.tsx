import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ConditionalActionButtons } from "./ConditionalActionButtons"
import { useAuth, type AuthUser } from "@/hooks/useAuth"
import { roleAuthService, type UserRole } from "@/lib/services/RoleAuthorizationService"
import { communityStore } from "@/lib/stores/communityStore"
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

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
}

export function CommunityCard({
  community,
  isMember = false,
  onJoin,
  onLeave,
  onView,
  className
}: CommunityCardProps) {
  const { user } = useAuth()
  const [storeState, setStoreState] = React.useState(communityStore.getState())
  
  // Get user role for role-based rendering
  const userRole: UserRole = roleAuthService.getUserRole(user as AuthUser)

  // Subscribe to store updates for membership state
  React.useEffect(() => {
    const observer = {
      update: (newState: typeof storeState) => setStoreState(newState)
    }
    communityStore.subscribe(observer)
    return () => communityStore.unsubscribe(observer)
  }, [])

  // Get membership status from store
  const membershipFromStore = storeState.membershipState[community.id]
  const isUserMember = membershipFromStore?.isMember ?? isMember
  const membershipLoading = membershipFromStore?.loading ?? false

  const handleJoin = () => {
    if (onJoin) {
      onJoin(community.id)
    }
  }

  const handleLeave = () => {
    if (onLeave) {
      onLeave(community.id)
    }
  }

  const handleView = () => {
    if (onView) {
      onView(community.id)
    }
  }

  const communitySlug = generateSlug(community.name)

  return (
    <div
      className={cn(
        "group relative rounded-2xl border bg-gradient-to-br from-card via-card to-card/50 p-6 shadow-lg transition-all duration-300",
        "hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40 hover:-translate-y-1",
        "backdrop-blur-sm border-border/50",
        className
      )}
    >
      {/* Enhanced Header with Better Typography */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0 space-y-2">
          <h3 className="font-bold text-xl leading-tight text-foreground group-hover:text-primary transition-colors duration-300">
            {community.name}
          </h3>
          {community.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {community.description}
            </p>
          )}
        </div>
        
        {/* Enhanced membership status for authenticated users */}
        {user && (
          <div className="flex flex-col gap-1">
            {membershipLoading ? (
              <Badge variant="outline" className="shrink-0 animate-pulse">
                <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent mr-1"></div>
                Checking...
              </Badge>
            ) : isUserMember ? (
              <Badge variant="default" className="shrink-0 bg-gradient-to-r from-primary to-secondary text-white shadow-sm">
                <svg className="size-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Member
              </Badge>
            ) : (
              <Badge variant="outline" className="shrink-0 text-muted-foreground border-border/50">
                Not Member
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Stats with Modern Icons and Layout */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 transition-colors duration-300 group-hover:bg-primary/5">
          <div className="p-1 rounded-md bg-primary/10">
            <svg
              className="size-4 text-primary"
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
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">{community.member_count}</span>
            <span className="text-xs text-muted-foreground">members</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 transition-colors duration-300 group-hover:bg-secondary/5">
          <div className="p-1 rounded-md bg-secondary/10">
            <svg
              className="size-4 text-secondary"
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
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">{community.post_count}</span>
            <span className="text-xs text-muted-foreground">posts</span>
          </div>
        </div>
      </div>

      {/* Enhanced Distance Display */}
      {community.distance !== undefined && (
        <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-gradient-to-r from-accent/20 to-accent/10 border border-accent/20">
          <div className="p-1 rounded-md bg-accent/20">
            <svg
              className="size-4 text-accent-foreground"
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
          </div>
          <span className="text-sm font-medium text-accent-foreground">{formatDistance(community.distance)}</span>
        </div>
      )}

      {/* Enhanced Role-based Actions */}
      <ConditionalActionButtons
        communityId={community.id}
        communityName={community.name}
        isMember={isUserMember}
        onJoin={handleJoin}
        onLeave={handleLeave}
        onView={handleView}
        className="flex gap-2 pt-4 border-t border-border/50"
      />
    </div>
  )
}
