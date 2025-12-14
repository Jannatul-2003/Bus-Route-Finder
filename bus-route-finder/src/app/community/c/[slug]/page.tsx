"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { communityStore } from "@/lib/stores/communityStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostCard } from "@/components/community/PostCard"
import { PostSearchInput } from "@/components/community/PostSearchInput"
import { useAuth, type AuthUser } from "@/hooks/useAuth"
import { roleAuthService, type UserRole } from "@/lib/services/RoleAuthorizationService"

export default function CommunitySlugPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const slug = params.slug as string
  
  const [state, setState] = React.useState(communityStore.getState())
  const [community, setCommunity] = React.useState<any>(null)
  const [members, setMembers] = React.useState<any[]>([])
  const [posts, setPosts] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isMember, setIsMember] = React.useState(false)
  const [membershipLoading, setMembershipLoading] = React.useState(false)
  
  // Post search and filtering state
  const [postKeyword, setPostKeyword] = React.useState('')
  const [debouncedKeyword, setDebouncedKeyword] = React.useState('')
  
  // Get user role for role-based rendering
  const userRole: UserRole = roleAuthService.getUserRole(user as AuthUser)

  React.useEffect(() => {
    const observer = {
      update: (newState: typeof state) => setState(newState)
    }
    communityStore.subscribe(observer)
    return () => communityStore.unsubscribe(observer)
  }, [])

  // Debounced search effect for smooth user experience
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(postKeyword)
    }, 300) // 300ms debounce delay

    return () => clearTimeout(timer)
  }, [postKeyword])

  // Update store filters when debounced keyword changes
  React.useEffect(() => {
    communityStore.setPostSearchKeyword(debouncedKeyword)
  }, [debouncedKeyword])

  React.useEffect(() => {
    const loadCommunityData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load community by slug
        const response = await fetch(`/api/communities/by-slug/${slug}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('Community not found')
          } else {
            throw new Error('Failed to fetch community')
          }
          return
        }

        const communityData = await response.json()
        setCommunity(communityData)

        // Set in store for other components
        communityStore.setState({ selectedCommunity: communityData })

        // Check membership status if user is logged in
        if (user && communityData.id) {
          setMembershipLoading(true)
          try {
            const isMemberStatus = await communityStore.getMembershipStatus(communityData.id, user.id)
            setIsMember(isMemberStatus)
          } catch (error) {
            console.error('Error checking membership:', error)
          } finally {
            setMembershipLoading(false)
          }
        }

        // Load members and posts in parallel
        await Promise.all([
          communityStore.fetchCommunityMembers(communityData.id),
          // Fetch all posts initially to allow proper filtering
          communityStore.fetchCommunityPosts(communityData.id)
        ])

        const updatedState = communityStore.getState()
        setMembers(updatedState.communityMembers)
        setPosts(updatedState.posts)
        
        // Initialize post filters to show active posts by default
        communityStore.setPostFilters({ status: 'active' })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load community data")
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      loadCommunityData()
    }
  }, [slug, user])

  const handleJoin = async () => {
    if (!community) return
    try {
      await communityStore.joinCommunity(community.id)
      setIsMember(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join community")
    }
  }

  const handleLeave = async () => {
    if (!community) return
    try {
      await communityStore.leaveCommunity(community.id)
      setIsMember(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to leave community")
    }
  }

  const handleCreatePost = async () => {
    if (!community) return
    
    // Validate membership before allowing post creation
    if (user) {
      const validation = await communityStore.validateMembershipForPostCreation(community.id, user.id)
      if (!validation.canCreate) {
        setError(validation.reason || 'Cannot create post')
        return
      }
    }
    
    // Navigate to slug-based post creation page
    router.push(`/community/c/${slug}/create-post`)
  }

  // Determine which actions are allowed based on user role and membership
  const canJoin = roleAuthService.canJoinCommunity(user as AuthUser).allowed && !isMember
  const canLeave = user && isMember
  const canCreatePost = user && isMember

  // Get filtered posts from store
  const filteredPosts = communityStore.getFilteredPosts()
  const postFilters = state.postFilters

  // Post search handlers
  const handlePostKeywordChange = (keyword: string) => {
    setPostKeyword(keyword)
  }

  const handlePostTypeChange = (postType: any) => {
    communityStore.setPostFilters({ postType })
  }

  const handlePostStatusChange = async (status: any) => {
    // Update filters - this will trigger client-side filtering
    communityStore.setPostFilters({ status })
  }

  const handleClearPostFilters = () => {
    setPostKeyword('')
    setDebouncedKeyword('')
    communityStore.clearPostSearch()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading community...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Community not found</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Enhanced Header with Modern Design */}
        <div className="mb-12">
          {/* Navigation and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="self-start bg-background/80 backdrop-blur-sm hover:bg-accent/80 transition-all duration-300"
            >
              <svg className="size-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
            
            {/* Enhanced Role-based action buttons */}
            <div className="flex flex-wrap gap-3">
              {/* Join button - for non-members only */}
              {canJoin && (
                <Button 
                  onClick={handleJoin} 
                  size="lg"
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <svg className="size-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Join Community
                </Button>
              )}
              
              {/* Leave button - for members only */}
              {canLeave && (
                <Button 
                  onClick={handleLeave} 
                  variant="outline"
                  size="lg"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-300"
                >
                  <svg className="size-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Leave Community
                </Button>
              )}
              
              {/* Create Post button - for members only */}
              {canCreatePost && (
                <Button 
                  onClick={handleCreatePost} 
                  size="lg"
                  className="bg-secondary hover:bg-secondary/90 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <svg className="size-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Create Post
                </Button>
              )}
            </div>
          </div>
          
          {/* Community Info Card */}
          <div className="bg-gradient-to-r from-card via-card to-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-lg">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent leading-tight">
                {community.name}
              </h1>
              {community.description && (
                <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                  {community.description}
                </p>
              )}
              
              {/* Enhanced Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="p-2 rounded-md bg-primary/10">
                    <svg className="size-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">{community.member_count || 0}</div>
                    <div className="text-xs text-muted-foreground">members</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/5 border border-secondary/10">
                  <div className="p-2 rounded-md bg-secondary/10">
                    <svg className="size-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">{community.post_count || 0}</div>
                    <div className="text-xs text-muted-foreground">posts</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 border border-accent/10">
                  <div className="p-2 rounded-md bg-accent/10">
                    <svg className="size-5 text-accent-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">{community.radius_meters || 1000}m</div>
                    <div className="text-xs text-muted-foreground">radius</div>
                  </div>
                </div>

                {/* Enhanced membership status for authenticated users */}
                {user && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                    {membershipLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                        <div>
                          <div className="text-sm font-medium text-foreground">Checking...</div>
                          <div className="text-xs text-muted-foreground">membership</div>
                        </div>
                      </>
                    ) : isMember ? (
                      <>
                        <div className="p-2 rounded-md bg-green-100">
                          <svg className="size-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-green-600">Member</div>
                          <div className="text-xs text-muted-foreground">active</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-2 rounded-md bg-muted">
                          <svg className="size-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Visitor</div>
                          <div className="text-xs text-muted-foreground">not member</div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Content Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 backdrop-blur-sm p-1 rounded-xl border border-border/50">
            <TabsTrigger 
              value="posts"
              className="data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-300 rounded-lg"
            >
              <svg className="size-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Posts ({filteredPosts.length}{filteredPosts.length !== posts.length ? `/${posts.length}` : ''})
            </TabsTrigger>
            <TabsTrigger 
              value="members"
              className="data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-300 rounded-lg"
            >
              <svg className="size-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Members ({members.length})
            </TabsTrigger>
          </TabsList>
        
        <TabsContent value="posts" className="space-y-4">
          {/* Post Search and Filtering */}
          <PostSearchInput
            keyword={postKeyword}
            postType={postFilters.postType}
            status={postFilters.status}
            onKeywordChange={handlePostKeywordChange}
            onPostTypeChange={handlePostTypeChange}
            onStatusChange={handlePostStatusChange}
            onClearFilters={handleClearPostFilters}
            placeholder="Search posts by title or content..."
          />

          {/* Posts Display */}
          {posts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No posts yet</p>
                {canCreatePost && (
                  <Button onClick={handleCreatePost} className="mt-4">
                    Create the first post
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  {postKeyword.trim() || postFilters.postType || (postFilters.status && postFilters.status !== 'active' && postFilters.status !== null)
                    ? "No posts match your search criteria"
                    : "No posts yet"
                  }
                </p>
                {!postKeyword.trim() && !postFilters.postType && (!postFilters.status || postFilters.status === 'active') && canCreatePost && (
                  <Button onClick={handleCreatePost} className="mt-4">
                    Create the first post
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Show filtered posts count */}
              {(postKeyword.trim() || postFilters.postType || (postFilters.status && postFilters.status !== 'active' && postFilters.status !== null)) && (
                <div className="text-sm text-muted-foreground">
                  Showing {filteredPosts.length} of {posts.length} posts
                </div>
              )}
              
              {/* Vertical stack layout for posts */}
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  communityId={community.id}
                  communitySlug={slug}
                  isAuthor={user?.id === post.author_id}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="members" className="space-y-4">
          {members.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No members yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <Card key={member.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{member.user?.email || 'Unknown User'}</p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                      <Badge variant="outline">
                        {new Date(member.joined_at).toLocaleDateString()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}