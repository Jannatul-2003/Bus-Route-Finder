import * as React from "react"
import { Button } from "@/components/ui/button"
import { useAuth, type AuthUser } from "@/hooks/useAuth"
import { roleAuthService, type UserRole } from "@/lib/services/RoleAuthorizationService"
import { communityStore } from "@/lib/stores/communityStore"

interface ConditionalActionButtonsProps {
  communityId: string
  communityName?: string
  isMember?: boolean
  onJoin?: () => void
  onLeave?: () => void
  onCreatePost?: () => void
  onView?: () => void
  className?: string
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
}

export function ConditionalActionButtons({
  communityId,
  communityName,
  isMember = false,
  onJoin,
  onLeave,
  onCreatePost,
  onView,
  className
}: ConditionalActionButtonsProps) {
  const { user } = useAuth()
  const [storeState, setStoreState] = React.useState(communityStore.getState())

  // Get user role
  const userRole: UserRole = roleAuthService.getUserRole(user as AuthUser)

  // Subscribe to store updates
  React.useEffect(() => {
    const observer = {
      update: (newState: typeof storeState) => setStoreState(newState)
    }
    communityStore.subscribe(observer)
    return () => communityStore.unsubscribe(observer)
  }, [])

  // Get membership status from store with improved state management
  React.useEffect(() => {
    if (user && communityId) {
      // Check if we have cached membership status, if not fetch it
      const cached = communityStore.getCachedMembershipStatus(communityId)
      if (!cached) {
        communityStore.getMembershipStatus(communityId, user.id)
      }
    }
  }, [user, communityId])

  // Get current membership status from store or fallback to prop
  const membershipFromStore = storeState.membershipState[communityId]
  const isUserMember = membershipFromStore?.isMember ?? isMember
  const membershipLoading = membershipFromStore?.loading ?? false

  // Determine which actions are allowed based on user role and membership
  const canJoin = roleAuthService.canJoinCommunity(user as AuthUser).allowed && !isUserMember
  const canLeave = user && isUserMember
  const canCreatePost = user && isUserMember
  const canView = true // All users can view (Requirements 4.4, 5.1, 5.5)

  // Handle join with proper state management
  const handleJoin = async () => {
    if (onJoin) {
      await onJoin()
      // Membership state is updated in the store's joinCommunity method
    }
  }

  // Handle leave with proper state management
  const handleLeave = async () => {
    if (onLeave) {
      await onLeave()
      // Membership state is updated in the store's leaveCommunity method
    }
  }

  // Don't render anything for visitors except view button
  if (userRole === 'visitor') {
    return (
      <div className={className}>
        {onView && (
          <Button
            onClick={onView}
            variant="outline"
            className="flex-1"
          >
            View
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      {/* View button - always available with enhanced styling */}
      {onView && (
        <Button
          onClick={onView}
          variant="outline"
          className="flex-1 bg-background/50 hover:bg-accent/80 transition-all duration-300 border-border/50"
        >
          <svg className="size-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View
        </Button>
      )}

      {/* Join button - for non-members only with gradient styling */}
      {canJoin && onJoin && (
        <Button
          onClick={handleJoin}
          variant="default"
          className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md hover:shadow-lg transition-all duration-300"
          disabled={membershipLoading || storeState.loading}
        >
          {membershipLoading || storeState.loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1.5"></div>
              Loading...
            </>
          ) : (
            <>
              <svg className="size-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Join
            </>
          )}
        </Button>
      )}

      {/* Leave button - for members only with subtle styling */}
      {canLeave && onLeave && (
        <Button
          onClick={handleLeave}
          variant="outline"
          className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-300"
          disabled={membershipLoading || storeState.loading}
        >
          {membershipLoading || storeState.loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent mr-1.5"></div>
              Loading...
            </>
          ) : (
            <>
              <svg className="size-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Leave
            </>
          )}
        </Button>
      )}

      {/* Create Post button - for members only with accent styling */}
      {canCreatePost && onCreatePost && (
        <Button
          onClick={onCreatePost}
          variant="default"
          className="flex-1 bg-secondary hover:bg-secondary/90 shadow-md hover:shadow-lg transition-all duration-300"
        >
          <svg className="size-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create Post
        </Button>
      )}
    </div>
  )
}