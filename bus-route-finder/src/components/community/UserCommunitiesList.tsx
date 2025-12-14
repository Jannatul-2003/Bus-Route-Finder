import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { communityStore } from "@/lib/stores/communityStore"
import { useAuth } from "@/hooks/useAuth"
import type { Community } from "@/lib/types/community"

interface UserCommunitiesListProps {
  className?: string
}

export function UserCommunitiesList({ className }: UserCommunitiesListProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [state, setState] = React.useState(communityStore.getState())
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const observer = {
      update: (newState: typeof state) => setState(newState)
    }
    communityStore.subscribe(observer)
    return () => communityStore.unsubscribe(observer)
  }, [])

  React.useEffect(() => {
    const loadUserCommunities = async () => {
      if (user) {
        setLoading(true)
        try {
          await communityStore.fetchUserCommunities(user.id)
        } catch (error) {
          console.error('Error loading user communities:', error)
        } finally {
          setLoading(false)
        }
      }
    }

    loadUserCommunities()
  }, [user])

  const handleViewCommunity = (communityId: string, communityName: string) => {
    // Generate slug from community name and use slug-based URL
    const communitySlug = communityName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
    router.push(`/community/c/${communitySlug}`)
  }

  const handleLeaveCommunity = async (communityId: string) => {
    try {
      await communityStore.leaveCommunity(communityId)
      // Refresh the user communities list
      if (user) {
        await communityStore.fetchUserCommunities(user.id)
      }
    } catch (error) {
      console.error('Error leaving community:', error)
    }
  }

  if (!user) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Please log in to view your communities</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Loading your communities...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (state.userCommunities.length === 0) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">You haven't joined any communities yet</p>
            <Button onClick={() => router.push('/community')}>
              Discover Communities
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.userCommunities.map((community: Community) => {
          const membershipStatus = state.membershipState[community.id]
          const isConfirmedMember = membershipStatus?.isMember ?? true // Default to true for user communities
          const membershipLoading = membershipStatus?.loading ?? false

          return (
            <Card key={community.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg leading-tight">
                      {community.name}
                    </CardTitle>
                    {community.description && (
                      <CardDescription className="line-clamp-2 mt-1">
                        {community.description}
                      </CardDescription>
                    )}
                  </div>
                  
                  {/* Membership Status Badge - Requirements: Add membership status display */}
                  {membershipLoading ? (
                    <Badge variant="outline" className="shrink-0">
                      Checking...
                    </Badge>
                  ) : isConfirmedMember ? (
                    <Badge variant="default" className="shrink-0">
                      Member
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="shrink-0">
                      Left
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Community Stats */}
                <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                  <span>{community.member_count || 0} members</span>
                  <span>{community.post_count || 0} posts</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleViewCommunity(community.id, community.name)}
                    variant="outline"
                    className="flex-1"
                  >
                    View
                  </Button>
                  
                  {isConfirmedMember && (
                    <Button
                      onClick={() => handleLeaveCommunity(community.id)}
                      variant="outline"
                      className="flex-1"
                      disabled={membershipLoading || state.loading}
                    >
                      {membershipLoading || state.loading ? "Loading..." : "Leave"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}