"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { communityStore } from "@/lib/stores/communityStore"
import { CommunityCard } from "@/components/community/CommunityCard"
import { CommunitySearchInput } from "@/components/CommunitySearchInput"
import { Button } from "@/components/ui/button"
import { useAuth, type AuthUser } from "@/hooks/useAuth"
import { roleAuthService } from "@/lib/services/RoleAuthorizationService"

export default function CommunityPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [state, setState] = React.useState(communityStore.getState())
  const [userLocation, setUserLocation] = React.useState<{ lat: number; lng: number } | null>(null)
  
  // Check if user can create communities (only contributors)
  const canCreateCommunity = roleAuthService.canCreateCommunity(user as AuthUser).allowed

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
          // Don't fetch automatically - wait for radius to be set
        },
        (error) => {
          console.error("Error getting location:", error)
        }
      )
    }
  }, [])

  // Only auto-fetch when location is first obtained, not on radius changes
  React.useEffect(() => {
    // Only fetch if we have location and radius is set, but don't refetch on radius changes
    // This effect should only run when userLocation changes (first time location is obtained)
    if (userLocation && state.searchState.isRadiusSet) {
      communityStore.fetchNearbyCommunities(
        userLocation.lat, 
        userLocation.lng, 
        state.searchState.radius
      )
    }
  }, [userLocation]) // Removed state.searchState.isRadiusSet and state.searchState.radius from dependencies

  // Handle search by name only (without location/radius)
  const handleSearchByName = async () => {
    await communityStore.performNameSearch()
  }

  const handleSearchQueryChange = (query: string) => {
    communityStore.setSearchQuery(query)
  }

  const handleRadiusChange = (radius: number) => {
    communityStore.setSearchRadius(radius)
  }

  const handleRadiusSearch = (radius: number) => {
    if (userLocation && radius > 0) {
      // Update the store with the validated radius
      communityStore.setSearchRadius(radius)
      communityStore.fetchNearbyCommunities(
        userLocation.lat, 
        userLocation.lng, 
        radius
      )
    }
  }

  const handleNameSearch = () => {
    if (state.searchState.query.trim()) {
      handleSearchByName()
    }
  }

  const handleRefresh = () => {
    if (state.searchState.query.trim()) {
      handleNameSearch()
    } else if (userLocation && state.searchState.isRadiusSet) {
      handleRadiusSearch(state.searchState.radius)
    }
  }

  const handleJoin = async (communityId: string) => {
    await communityStore.joinCommunity(communityId)
    // No need to refresh - membership state is managed in store
  }

  const handleLeave = async (communityId: string) => {
    await communityStore.leaveCommunity(communityId)
    // No need to refresh - membership state is managed in store
  }

  const handleView = (communityId: string) => {
    // Find the community to get its name for slug generation
    const community = displayCommunities.find(c => c.id === communityId)
    if (community) {
      const slug = community.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      router.push(`/community/c/${slug}`)
    }
  }

  // Get communities to display based on search state
  const displayCommunities = communityStore.getFilteredCommunities()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Modern Header with Enhanced Typography */}
        <div className="mb-12 text-center lg:text-left">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent leading-tight">
                Communities
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Connect with fellow commuters in your area. Join discussions, share experiences, and build stronger transit communities.
              </p>
            </div>
            
            {/* Role-based Create Community button - enhanced design */}
            {canCreateCommunity && (
              <div className="flex justify-center lg:justify-end">
                <Button 
                  onClick={() => router.push("/community/create")} 
                  size="lg"
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <svg className="size-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Create Community
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Search Controls with Modern Card Design */}
        <div className="mb-8">
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="max-w-4xl mx-auto">
              <CommunitySearchInput
                searchQuery={state.searchState.query}
                searchRadius={state.searchState.radius}
                isRadiusSet={state.searchState.isRadiusSet}
                onSearchChange={handleSearchQueryChange}
                onRadiusChange={handleRadiusChange}
                onRadiusSearch={handleRadiusSearch}
                onNameSearch={handleNameSearch}
                disabled={state.loading}
              />
            </div>
          </div>
        </div>



        {/* Enhanced Status Messages with Modern Design */}
        <div className="space-y-4 mb-8">
          {/* Location Status */}
          {!userLocation && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200/50 text-blue-800 px-6 py-4 rounded-xl shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                <span className="font-medium">Getting your location to find nearby communities...</span>
              </div>
            </div>
          )}

          {/* Error message */}
          {state.error && (
            <div className="bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200/50 text-red-800 px-6 py-4 rounded-xl shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <svg className="size-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="font-medium">{state.error}</span>
              </div>
            </div>
          )}

          {/* Search Status */}
          {!state.searchState.isRadiusSet && !state.searchState.query.trim() && userLocation && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200/50 text-blue-800 px-6 py-4 rounded-xl shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <svg className="size-5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Search by community name or set a radius to find communities near you</span>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Communities Display */}
        {state.loading ? (
          <div className="text-center py-20">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
              <p className="text-lg text-muted-foreground font-medium">Discovering communities...</p>
            </div>
          </div>
        ) : !state.searchState.hasSearchBeenPerformed ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                <svg className="size-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Ready to explore?</h3>
                <p className="text-muted-foreground">Search by community name or set a radius to discover communities in your area</p>
              </div>
            </div>
          </div>
        ) : displayCommunities.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center">
                <svg className="size-12 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">
                  {state.searchState.query.trim() 
                    ? `No communities found matching "${state.searchState.query}"` 
                    : "No communities found nearby"}
                </h3>
                <p className="text-muted-foreground">
                  {state.searchState.query.trim() 
                    ? "Try adjusting your search terms or expanding your search radius"
                    : "Be the first to create a community in this area"}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {state.searchState.query.trim() && (
                    <Button 
                      onClick={() => communityStore.clearSearch()} 
                      variant="outline"
                      size="lg"
                    >
                      Clear Search
                    </Button>
                  )}
                  {canCreateCommunity && (
                    <Button 
                      onClick={() => router.push("/community/create")}
                      size="lg"
                      className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                    >
                      Create Community
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Enhanced Search Results Info */}
            {state.searchState.query.trim() && (
              <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <svg className="size-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <span className="font-medium">
                      Found {displayCommunities.length} communities matching "{state.searchState.query}"
                    </span>
                  </div>
                  <Button 
                    onClick={() => communityStore.clearSearch()} 
                    variant="ghost" 
                    size="sm"
                    className="self-start sm:self-center"
                  >
                    Clear search
                  </Button>
                </div>
              </div>
            )}
            
            {/* Enhanced Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayCommunities.map((community, index) => (
                <div
                  key={community.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CommunityCard
                    community={community}
                    onJoin={handleJoin}
                    onLeave={handleLeave}
                    onView={handleView}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
