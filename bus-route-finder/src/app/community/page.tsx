"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { communityStore } from "@/lib/stores/communityStore"
import { CommunityCard } from "@/components/community/CommunityCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function CommunityPage() {
  const router = useRouter()
  const [state, setState] = React.useState(communityStore.getState())
  const [userLocation, setUserLocation] = React.useState<{ lat: number; lng: number } | null>(null)
  const [searchRadius, setSearchRadius] = React.useState(5000)

  React.useEffect(() => {
    const observer = {
      update: (newState: typeof state) => setState(newState)
    }
    communityStore.subscribe(observer)
    return () => communityStore.unsubscribe(observer)
  }, [])

  React.useEffect(() => {
    // Get user location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setUserLocation(location)
          communityStore.fetchNearbyCommunities(location.lat, location.lng, searchRadius)
        },
        (error) => {
          console.error("Error getting location:", error)
        }
      )
    }
  }, [])

  const handleRefresh = () => {
    if (userLocation) {
      communityStore.fetchNearbyCommunities(userLocation.lat, userLocation.lng, searchRadius)
    }
  }

  const handleJoin = async (communityId: string) => {
    await communityStore.joinCommunity(communityId)
    handleRefresh()
  }

  const handleLeave = async (communityId: string) => {
    await communityStore.leaveCommunity(communityId)
    handleRefresh()
  }

  const handleView = (communityId: string) => {
    router.push(`/community/${communityId}`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Communities</h1>
        <p className="text-muted-foreground">
          Join local communities to connect with fellow commuters
        </p>
      </div>

      {/* Search controls */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            type="number"
            value={searchRadius}
            onChange={(e) => setSearchRadius(Number(e.target.value))}
            placeholder="Search radius (meters)"
            min={100}
            max={10000}
          />
        </div>
        <Button onClick={handleRefresh} disabled={!userLocation || state.loading}>
          {state.loading ? "Loading..." : "Refresh"}
        </Button>
        <Button onClick={() => router.push("/community/create")} variant="default">
          Create Community
        </Button>
      </div>

      {/* Error message */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {state.error}
        </div>
      )}

      {/* Communities grid */}
      {state.loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading communities...</p>
        </div>
      ) : state.communities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No communities found nearby</p>
          <Button onClick={() => router.push("/community/create")}>
            Create the first community
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.communities.map((community) => (
            <CommunityCard
              key={community.id}
              community={community}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onView={handleView}
            />
          ))}
        </div>
      )}
    </div>
  )
}
