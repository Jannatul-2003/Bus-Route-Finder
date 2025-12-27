"use client"

import { Observable } from "@/lib/observer"
import { searchService } from "@/lib/services/SearchService"
import { communityService } from "@/lib/services/CommunityService"
import type {
  Community,
  CommunityMember,
  CommunityPost,
  PostComment,
  CommunityNotification,
  UserFrequentRoute,
  CommunityWithDistance,
  PostWithAuthor,
  CommentWithAuthor,
  MemberWithUser,
  PostType,
  PostStatus,
  NotificationPreferences
} from "@/lib/types/community"

export interface CommunityState {
  // Communities
  communities: CommunityWithDistance[]
  selectedCommunity: Community | null
  userCommunities: Community[]
  
  // Search State
  searchState: {
    query: string
    radius: number
    isRadiusSet: boolean
    filteredCommunities: CommunityWithDistance[]
    isSearching: boolean
    searchError: string | null
    hasSearchBeenPerformed: boolean
  }
  
  // Members
  communityMembers: MemberWithUser[]
  
  // Membership State Management
  membershipState: {
    [communityId: string]: {
      isMember: boolean
      loading: boolean
      lastChecked: number
    }
  }
  
  // Posts
  posts: PostWithAuthor[]
  selectedPost: PostWithAuthor | null
  postFilters: {
    keyword: string
    postType: PostType | null
    status: PostStatus | 'all' | null
  }
  filteredPosts: PostWithAuthor[]
  
  // Post Navigation State (Requirements 1.1, 1.2, 1.3)
  postNavigation: {
    selectedPostId: string | null
    showPostDetail: boolean
    previousRoute: string | null
    navigationHistory: Array<{
      communityId: string
      communityName: string
      postId?: string
      postTitle?: string
      timestamp: number
      isSlugBased?: boolean
      communitySlug?: string
      postSlug?: string
    }>
  }
  
  // Comments
  comments: CommentWithAuthor[]
  
  // Notifications
  notifications: CommunityNotification[]
  unreadCount: number
  
  // Frequent Routes
  frequentRoutes: UserFrequentRoute[]
  
  // UI State
  loading: boolean
  error: string | null
}

const initialState: CommunityState = {
  communities: [],
  selectedCommunity: null,
  userCommunities: [],
  searchState: {
    query: '',
    radius: 5000,
    isRadiusSet: false,
    filteredCommunities: [],
    isSearching: false,
    searchError: null,
    hasSearchBeenPerformed: false
  },
  communityMembers: [],
  membershipState: {},
  posts: [],
  selectedPost: null,
  postFilters: {
    keyword: '',
    postType: null,
    status: 'active'
  },
  filteredPosts: [],
  postNavigation: {
    selectedPostId: null,
    showPostDetail: false,
    previousRoute: null,
    navigationHistory: []
  },
  comments: [],
  notifications: [],
  unreadCount: 0,
  frequentRoutes: [],
  loading: false,
  error: null
}

class CommunityStore extends Observable<CommunityState> {
  #state: CommunityState

  constructor() {
    super()
    this.#state = { ...initialState }
  }

  getState() {
    return this.#state
  }

  // ==================== COMMUNITIES ====================

  async fetchNearbyCommunities(latitude: number, longitude: number, radius: number = 5000): Promise<void> {
    this.#setState({ loading: true, error: null })

    try {
      const response = await fetch(
        `/api/communities?latitude=${latitude}&longitude=${longitude}&radius=${radius}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch nearby communities')
      }

      const communities = await response.json()
      this.#setState({ 
        communities, 
        loading: false,
        searchState: {
          ...this.#state.searchState,
          filteredCommunities: this.#filterCommunitiesByQuery(communities, this.#state.searchState.query),
          hasSearchBeenPerformed: true
        }
      })
    } catch (error) {
      this.#setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch communities'
      })
    }
  }

  async fetchCommunityById(communityId: string): Promise<void> {
    this.#setState({ loading: true, error: null })

    try {
      const response = await fetch(`/api/communities/${communityId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch community')
      }

      const community = await response.json()
      this.#setState({ selectedCommunity: community, loading: false })
    } catch (error) {
      this.#setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch community'
      })
    }
  }

  async createCommunity(data: {
    name: string
    description?: string
    center_latitude: number
    center_longitude: number
    radius_meters?: number
  }): Promise<Community | null> {
    this.#setState({ loading: true, error: null })

    try {
      const response = await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to create community')
      }

      const community = await response.json()
      this.#setState({ loading: false })
      return community
    } catch (error) {
      this.#setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to create community'
      })
      return null
    }
  }

  async updateCommunity(communityId: string, data: Partial<Community>): Promise<void> {
    this.#setState({ loading: true, error: null })

    try {
      const response = await fetch(`/api/communities/${communityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to update community')
      }

      const updatedCommunity = await response.json()
      this.#setState({ selectedCommunity: updatedCommunity, loading: false })
    } catch (error) {
      this.#setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to update community'
      })
    }
  }

  async deleteCommunity(communityId: string): Promise<void> {
    this.#setState({ loading: true, error: null })

    try {
      const response = await fetch(`/api/communities/${communityId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete community')
      }

      this.#setState({ selectedCommunity: null, loading: false })
    } catch (error) {
      this.#setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to delete community'
      })
    }
  }

  // ==================== SEARCH FUNCTIONALITY ====================

  /**
   * Set search query and filter communities in real-time
   * Requirements: 2.1, 2.2, 2.3 - Real-time filtering as user types
   * Note: This only updates the query, hasSearchBeenPerformed is set when actual search is performed
   */
  setSearchQuery(query: string): void {
    const filteredCommunities = this.#filterCommunitiesByQuery(this.#state.communities, query)
    
    this.#setState({
      searchState: {
        ...this.#state.searchState,
        query,
        filteredCommunities,
        // Don't set hasSearchBeenPerformed here - only when search is actually performed
      }
    })
  }

  /**
   * Set search radius and update radius set status
   * Requirements: 3.2, 3.3 - Conditional data fetching based on radius input
   */
  setSearchRadius(radius: number): void {
    this.#setState({
      searchState: {
        ...this.#state.searchState,
        radius,
        isRadiusSet: radius > 0
      }
    })
  }

  /**
   * Fetch communities only when radius is set
   * Requirements: 3.2, 3.3 - Don't fetch data until radius is provided
   */
  async fetchCommunitiesIfRadiusSet(latitude: number, longitude: number): Promise<void> {
    if (!this.#state.searchState.isRadiusSet) {
      return
    }

    await this.fetchNearbyCommunities(latitude, longitude, this.#state.searchState.radius)
  }

  /**
   * Get filtered communities for display
   * Requirements: 2.4 - Display all communities when search is empty
   */
  getFilteredCommunities(): CommunityWithDistance[] {
    return this.#state.searchState.query.trim() 
      ? this.#state.searchState.filteredCommunities 
      : this.#state.communities
  }

  /**
   * Clear search state
   */
  clearSearch(): void {
    this.#setState({
      searchState: {
        ...this.#state.searchState,
        query: '',
        filteredCommunities: this.#state.communities,
        searchError: null,
        hasSearchBeenPerformed: false
      }
    })
  }

  /**
   * Perform name-based search and set hasSearchBeenPerformed flag
   * Requirements: 1.3 - Only show empty results message after search is performed
   */
  async performNameSearch(): Promise<void> {
    if (!this.#state.searchState.query.trim()) {
      return
    }

    this.#setState({
      searchState: {
        ...this.#state.searchState,
        isSearching: true,
        searchError: null
      }
    })

    try {
      const response = await fetch(`/api/communities/search?name=${encodeURIComponent(this.#state.searchState.query)}`)
      if (response.ok) {
        const communities = await response.json()
        this.#setState({
          communities,
          searchState: {
            ...this.#state.searchState,
            filteredCommunities: communities,
            hasSearchBeenPerformed: true,
            isSearching: false
          }
        })
      } else {
        throw new Error('Failed to search communities')
      }
    } catch (error) {
      this.#setState({
        searchState: {
          ...this.#state.searchState,
          searchError: error instanceof Error ? error.message : 'Search failed',
          hasSearchBeenPerformed: true,
          isSearching: false
        }
      })
    }
  }

  /**
   * Private helper to filter communities by search query
   */
  #filterCommunitiesByQuery(communities: CommunityWithDistance[], query: string): CommunityWithDistance[] {
    return searchService.searchCommunitiesByName(query, communities)
  }

  // ==================== COMMUNITY MEMBERS ====================

  /**
   * Get membership status for a community with caching
   * Requirements: 6.1, 6.4, 6.5 - Proper membership state management
   */
  async getMembershipStatus(communityId: string, userId: string): Promise<boolean> {
    const now = Date.now()
    const cached = this.#state.membershipState[communityId]
    
    // Use cached result if it's less than 30 seconds old
    if (cached && (now - cached.lastChecked) < 30000) {
      return cached.isMember
    }

    // Set loading state
    this.#setState({
      membershipState: {
        ...this.#state.membershipState,
        [communityId]: {
          isMember: cached?.isMember || false,
          loading: true,
          lastChecked: now
        }
      }
    })

    try {
      const response = await fetch(`/api/communities/${communityId}/members`)
      if (!response.ok) {
        throw new Error('Failed to fetch membership status')
      }

      const members = await response.json()
      const isMember = members.some((member: any) => member.user_id === userId)

      // Update membership state
      this.#setState({
        membershipState: {
          ...this.#state.membershipState,
          [communityId]: {
            isMember,
            loading: false,
            lastChecked: now
          }
        }
      })

      return isMember
    } catch (error) {
      // Update with error state
      this.#setState({
        membershipState: {
          ...this.#state.membershipState,
          [communityId]: {
            isMember: cached?.isMember || false,
            loading: false,
            lastChecked: now
          }
        }
      })
      return cached?.isMember || false
    }
  }

  /**
   * Get cached membership status without making API call
   */
  getCachedMembershipStatus(communityId: string): { isMember: boolean; loading: boolean } | null {
    const cached = this.#state.membershipState[communityId]
    return cached ? { isMember: cached.isMember, loading: cached.loading } : null
  }

  /**
   * Update membership status in cache
   */
  private updateMembershipStatus(communityId: string, isMember: boolean): void {
    this.#setState({
      membershipState: {
        ...this.#state.membershipState,
        [communityId]: {
          isMember,
          loading: false,
          lastChecked: Date.now()
        }
      }
    })
  }

  async joinCommunity(
    communityId: string,
    notificationPreferences?: NotificationPreferences
  ): Promise<void> {
    // Set loading state for this specific community
    this.#setState({
      loading: true,
      error: null,
      membershipState: {
        ...this.#state.membershipState,
        [communityId]: {
          isMember: this.#state.membershipState[communityId]?.isMember || false,
          loading: true,
          lastChecked: Date.now()
        }
      }
    })

    try {
      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_preferences: notificationPreferences })
      })

      if (!response.ok) {
        throw new Error('Failed to join community')
      }

      // Update membership status immediately
      this.updateMembershipStatus(communityId, true)

      // Refresh community data to update member count
      await this.fetchCommunityById(communityId)
      
      // Refresh user communities list
      this.#setState({ loading: false })
    } catch (error) {
      // Reset loading state on error, preserve original membership state
      const originalMembershipState = this.#state.membershipState[communityId]?.isMember || false
      this.#setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to join community',
        membershipState: {
          ...this.#state.membershipState,
          [communityId]: {
            isMember: originalMembershipState,
            loading: false,
            lastChecked: Date.now()
          }
        }
      })
    }
  }

  async leaveCommunity(communityId: string): Promise<void> {
    // Set loading state for this specific community
    this.#setState({
      loading: true,
      error: null,
      membershipState: {
        ...this.#state.membershipState,
        [communityId]: {
          isMember: this.#state.membershipState[communityId]?.isMember || true,
          loading: true,
          lastChecked: Date.now()
        }
      }
    })

    try {
      const response = await fetch(`/api/communities/${communityId}/leave`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to leave community')
      }

      // Update membership status immediately
      this.updateMembershipStatus(communityId, false)

      // Refresh community data to update member count
      await this.fetchCommunityById(communityId)
      
      // Note: Posts are preserved as per requirements 6.4
      this.#setState({ loading: false })
    } catch (error) {
      // Reset loading state on error, preserve original membership state
      const originalMembershipState = this.#state.membershipState[communityId]?.isMember || true
      this.#setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to leave community',
        membershipState: {
          ...this.#state.membershipState,
          [communityId]: {
            isMember: originalMembershipState,
            loading: false,
            lastChecked: Date.now()
          }
        }
      })
    }
  }

  async fetchCommunityMembers(communityId: string): Promise<void> {
    this.#setState({ loading: true, error: null })

    try {
      const response = await fetch(`/api/communities/${communityId}/members`)

      if (!response.ok) {
        throw new Error('Failed to fetch community members')
      }

      const members = await response.json()
      this.#setState({ communityMembers: members, loading: false })
    } catch (error) {
      this.#setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch members'
      })
    }
  }

  async fetchUserCommunities(userId: string): Promise<void> {
    this.#setState({ loading: true, error: null })

    try {
      const response = await fetch(`/api/users/${userId}/communities`)

      if (!response.ok) {
        throw new Error('Failed to fetch user communities')
      }

      const communities = await response.json()
      
      // Update membership status for all user communities
      const membershipUpdates: { [key: string]: any } = {}
      communities.forEach((community: Community) => {
        membershipUpdates[community.id] = {
          isMember: true, // User is definitely a member of these communities
          loading: false,
          lastChecked: Date.now()
        }
      })

      this.#setState({ 
        userCommunities: communities, 
        loading: false,
        membershipState: {
          ...this.#state.membershipState,
          ...membershipUpdates
        }
      })
    } catch (error) {
      this.#setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user communities'
      })
    }
  }

  // ==================== COMMUNITY POSTS ====================

  async fetchCommunityPosts(
    communityId: string,
    options?: {
      postType?: PostType
      status?: PostStatus
      limit?: number
      offset?: number
    }
  ): Promise<void> {
    this.#setState({ loading: true, error: null })

    try {
      const params = new URLSearchParams()
      if (options?.postType) params.append('post_type', options.postType)
      if (options?.status) params.append('status', options.status)
      if (options?.limit) params.append('limit', options.limit.toString())
      if (options?.offset) params.append('offset', options.offset.toString())

      const response = await fetch(
        `/api/communities/${communityId}/posts?${params.toString()}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }

      const posts = await response.json()
      const filteredPosts = this.#filterPosts(posts, this.#state.postFilters)
      this.#setState({ posts, filteredPosts, loading: false })
    } catch (error) {
      this.#setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch posts'
      })
    }
  }

  async fetchPostById(postId: string): Promise<void> {
    this.#setState({ loading: true, error: null })

    try {
      const response = await fetch(`/api/posts/${postId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch post')
      }

      const post = await response.json()
      this.#setState({ selectedPost: post, loading: false })
    } catch (error) {
      this.#setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch post'
      })
    }
  }

  /**
   * Validate membership before post creation
   * Requirements: 6.2, 6.3 - Handle membership validation for post creation
   */
  async validateMembershipForPostCreation(communityId: string, userId: string): Promise<{
    canCreate: boolean
    reason?: string
  }> {
    try {
      // Check current membership status
      const isMember = await this.getMembershipStatus(communityId, userId)
      
      if (!isMember) {
        return {
          canCreate: false,
          reason: 'You must be a member of this community to create posts'
        }
      }

      return { canCreate: true }
    } catch (error) {
      return {
        canCreate: false,
        reason: 'Unable to verify membership status'
      }
    }
  }

  async createPost(communityId: string, data: {
    post_type: PostType
    title: string
    content: string
    item_category?: string
    item_description?: string
    photo_url?: string
    location_latitude?: number
    location_longitude?: number
    bus_id?: string
  }, userId?: string): Promise<PostWithAuthor | null> {
    this.#setState({ loading: true, error: null })

    try {
      // Get current user from auth if userId not provided
      let currentUserId = userId
      if (!currentUserId) {
        throw new Error('User ID is required to create a post')
      }

      // Validate membership if userId is provided
      const validation = await this.validateMembershipForPostCreation(communityId, currentUserId)
      if (!validation.canCreate) {
        throw new Error(validation.reason || 'Cannot create post')
      }

      // Include author_id in the request body
      const requestBody = {
        ...data,
        author_id: currentUserId
      }

      const response = await fetch(`/api/communities/${communityId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create post')
      }

      const post = await response.json()
      
      // Add to posts list
      this.#setState({
        posts: [post, ...this.#state.posts],
        loading: false
      })
      
      return post
    } catch (error) {
      this.#setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to create post'
      })
      return null
    }
  }

  async updatePost(postId: string, data: Partial<PostWithAuthor>): Promise<void> {
    this.#setState({ loading: true, error: null })

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to update post')
      }

      const updatedPost = await response.json()
      
      // Update in posts list
      this.#setState({
        posts: this.#state.posts.map(p => p.id === postId ? updatedPost : p),
        selectedPost: this.#state.selectedPost?.id === postId ? updatedPost : this.#state.selectedPost,
        loading: false
      })
    } catch (error) {
      this.#setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to update post'
      })
    }
  }

  async deletePost(postId: string): Promise<void> {
    this.#setState({ loading: true, error: null })

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete post')
      }

      // Remove from posts list
      this.#setState({
        posts: this.#state.posts.filter(p => p.id !== postId),
        selectedPost: this.#state.selectedPost?.id === postId ? null : this.#state.selectedPost,
        loading: false
      })
    } catch (error) {
      this.#setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to delete post'
      })
    }
  }

  setPostFilters(filters: { 
    keyword?: string
    postType?: PostType | null
    status?: PostStatus | 'all' | null 
  }): void {
    const newFilters = {
      keyword: filters.keyword !== undefined ? filters.keyword : this.#state.postFilters.keyword,
      postType: filters.postType !== undefined ? filters.postType : this.#state.postFilters.postType,
      status: filters.status !== undefined ? filters.status : this.#state.postFilters.status
    }

    const filteredPosts = this.#filterPosts(this.#state.posts, newFilters)

    this.#setState({
      postFilters: newFilters,
      filteredPosts
    })
  }

  /**
   * Set post keyword search query and filter posts in real-time
   * Requirements: 2.1 (extended to posts) - Real-time filtering as user types
   */
  setPostSearchKeyword(keyword: string): void {
    const newFilters = {
      ...this.#state.postFilters,
      keyword
    }

    const filteredPosts = this.#filterPosts(this.#state.posts, newFilters)

    this.#setState({
      postFilters: newFilters,
      filteredPosts
    })
  }

  /**
   * Get filtered posts for display
   * Returns filtered posts based on current filters, with proper handling of "active" default and "all" status
   */
  getFilteredPosts(): PostWithAuthor[] {
    // Always apply filtering to ensure proper status filtering behavior
    return this.#state.filteredPosts
  }

  /**
   * Clear post search and filters
   */
  clearPostSearch(): void {
    const defaultFilters = {
      keyword: '',
      postType: null,
      status: 'active' as const
    }
    const filteredPosts = this.#filterPosts(this.#state.posts, defaultFilters)
    
    this.#setState({
      postFilters: defaultFilters,
      filteredPosts
    })
  }

  /**
   * Private helper to filter posts using SearchService
   */
  #filterPosts(posts: PostWithAuthor[], filters: {
    keyword: string
    postType: PostType | null
    status: PostStatus | 'all' | null
  }): PostWithAuthor[] {
    return searchService.filterPosts(posts, filters)
  }

  // ==================== POST COMMENTS ====================

  async fetchPostComments(postId: string): Promise<void> {
    this.#setState({ loading: true, error: null })

    try {
      const response = await fetch(`/api/posts/${postId}/comments`)

      if (!response.ok) {
        throw new Error('Failed to fetch comments')
      }

      const comments = await response.json()
      this.#setState({ comments, loading: false })
    } catch (error) {
      this.#setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch comments'
      })
    }
  }

  async createComment(postId: string, data: {
    content: string
    is_resolution?: boolean
    contact_info?: string
  }): Promise<void> {
    // Validate input before making API call
    if (!data.content || data.content.trim().length === 0) {
      this.#setState({ 
        error: 'Comment content cannot be empty',
        loading: false 
      })
      return
    }

    if (data.content.length > 2000) {
      this.#setState({ 
        error: 'Comment content cannot exceed 2000 characters',
        loading: false 
      })
      return
    }

    this.#setState({ loading: true, error: null })

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Failed to create comment (${response.status})`
        throw new Error(errorMessage)
      }

      const comment = await response.json()
      
      // Update post comment count
      const updatedSelectedPost = this.#state.selectedPost ? {
        ...this.#state.selectedPost,
        comment_count: this.#state.selectedPost.comment_count + 1
      } : null

      this.#setState({
        selectedPost: updatedSelectedPost,
        loading: false
      })

      // Refetch comments to get the newly created comment with author information
      await this.fetchPostComments(postId)
    } catch (error) {
      this.#setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to create comment'
      })
    }
  }

  async updateComment(commentId: string, data: Partial<PostComment>): Promise<void> {
    this.#setState({ loading: true, error: null })

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to update comment')
      }

      const updatedComment = await response.json()
      
      // Update in comments list
      this.#setState({
        comments: this.#state.comments.map(c => c.id === commentId ? updatedComment : c),
        loading: false
      })
    } catch (error) {
      this.#setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to update comment'
      })
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    this.#setState({ loading: true, error: null })

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete comment')
      }

      // Remove from comments list
      this.#setState({
        comments: this.#state.comments.filter(c => c.id !== commentId),
        loading: false
      })
    } catch (error) {
      this.#setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to delete comment'
      })
    }
  }

  // ==================== NOTIFICATIONS ====================

  async fetchNotifications(userId: string, unreadOnly: boolean = false): Promise<void> {
    this.#setState({ loading: true, error: null })

    try {
      const params = new URLSearchParams()
      if (unreadOnly) params.append('unread_only', 'true')

      const response = await fetch(`/api/users/${userId}/notifications?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const notifications = await response.json()
      const unreadCount = notifications.filter((n: CommunityNotification) => !n.read).length
      
      this.#setState({ notifications, unreadCount, loading: false })
    } catch (error) {
      this.#setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch notifications'
      })
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      // Update in notifications list
      this.#setState({
        notifications: this.#state.notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, this.#state.unreadCount - 1)
      })
    } catch (error) {
      this.#setState({
        error: error instanceof Error ? error.message : 'Failed to mark notification as read'
      })
    }
  }

  async markAllNotificationsAsRead(): Promise<void> {
    this.#setState({ loading: true, error: null })

    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read')
      }

      // Update all notifications
      this.#setState({
        notifications: this.#state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
        loading: false
      })
    } catch (error) {
      this.#setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to mark all notifications as read'
      })
    }
  }

  // ==================== FREQUENT ROUTES ====================

  async fetchFrequentRoutes(userId: string): Promise<void> {
    this.#setState({ loading: true, error: null })

    try {
      const response = await fetch(`/api/users/${userId}/frequent-routes`)

      if (!response.ok) {
        throw new Error('Failed to fetch frequent routes')
      }

      const routes = await response.json()
      this.#setState({ frequentRoutes: routes, loading: false })
    } catch (error) {
      this.#setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch frequent routes'
      })
    }
  }

  async addFrequentRoute(data: {
    bus_id: string
    onboarding_stop_id: string
    offboarding_stop_id: string
  }): Promise<void> {
    this.#setState({ loading: true, error: null })

    try {
      const response = await fetch('/api/frequent-routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to add frequent route')
      }

      const route = await response.json()
      
      // Update or add to frequent routes list
      const existingIndex = this.#state.frequentRoutes.findIndex(
        r => r.bus_id === data.bus_id &&
             r.onboarding_stop_id === data.onboarding_stop_id &&
             r.offboarding_stop_id === data.offboarding_stop_id
      )

      if (existingIndex >= 0) {
        this.#setState({
          frequentRoutes: this.#state.frequentRoutes.map((r, i) =>
            i === existingIndex ? route : r
          ),
          loading: false
        })
      } else {
        this.#setState({
          frequentRoutes: [...this.#state.frequentRoutes, route],
          loading: false
        })
      }
    } catch (error) {
      this.#setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to add frequent route'
      })
    }
  }

  async deleteFrequentRoute(routeId: string): Promise<void> {
    this.#setState({ loading: true, error: null })

    try {
      const response = await fetch(`/api/frequent-routes/${routeId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete frequent route')
      }

      // Remove from frequent routes list
      this.#setState({
        frequentRoutes: this.#state.frequentRoutes.filter(r => r.id !== routeId),
        loading: false
      })
    } catch (error) {
      this.#setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to delete frequent route'
      })
    }
  }

  // ==================== POST NAVIGATION ====================

  /**
   * Navigate to post detail view with proper state management
   * Requirements: 1.1, 1.2, 1.3 - Enhanced post navigation with slug-based routing
   */
  navigateToPost(
    communityId: string, 
    postId: string, 
    options?: {
      communityName?: string
      postTitle?: string
      previousRoute?: string
      isSlugBased?: boolean
      communitySlug?: string
      postSlug?: string
    }
  ): void {
    const navigationEntry = {
      communityId,
      communityName: options?.communityName || this.#state.selectedCommunity?.name || 'Unknown Community',
      postId,
      postTitle: options?.postTitle || 'Post',
      timestamp: Date.now(),
      // Enhanced with slug information
      isSlugBased: options?.isSlugBased || false,
      communitySlug: options?.communitySlug,
      postSlug: options?.postSlug
    }

    // Update navigation history (keep last 10 entries, remove duplicates)
    const existingHistory = this.#state.postNavigation.navigationHistory.filter(
      entry => entry.postId !== postId // Remove any existing entry for this post
    )
    const updatedHistory = [
      navigationEntry,
      ...existingHistory.slice(0, 9)
    ]

    // Determine the correct previous route - always use slug-based URLs (Requirements 4.2, 4.3)
    let previousRoute = options?.previousRoute
    if (!previousRoute) {
      if (options?.isSlugBased && options?.communitySlug) {
        previousRoute = `/community/c/${options.communitySlug}`
      } else if (this.#state.selectedCommunity) {
        // Generate slug-based URL from community name
        const communitySlug = this.#generateCommunitySlug(this.#state.selectedCommunity.name)
        previousRoute = `/community/c/${communitySlug}`
      } else {
        // Fallback to community list
        previousRoute = '/community'
      }
    }

    this.#setState({
      postNavigation: {
        selectedPostId: postId,
        showPostDetail: true,
        previousRoute,
        navigationHistory: updatedHistory
      }
    })
  }

  /**
   * Navigate back from post detail view
   * Requirements: 4.2, 4.3 - Always return slug-based URLs for back navigation
   */
  navigateBackFromPost(): string {
    const previousRoute = this.#state.postNavigation.previousRoute
    
    this.#setState({
      postNavigation: {
        ...this.#state.postNavigation,
        selectedPostId: null,
        showPostDetail: false
      }
    })

    // If we have a previous route and it's already slug-based, use it
    if (previousRoute && previousRoute.includes('/community/c/')) {
      return previousRoute
    }

    // If we have a selected community, generate slug-based URL
    if (this.#state.selectedCommunity) {
      const communitySlug = this.#generateCommunitySlug(this.#state.selectedCommunity.name)
      return `/community/c/${communitySlug}`
    }

    // Fallback to community list
    return '/community'
  }

  /**
   * Get navigation breadcrumbs for current post
   * Requirements: 4.2, 4.3 - Always use slug-based URLs for breadcrumbs
   */
  getPostNavigationBreadcrumbs(): Array<{
    label: string
    href: string
    isActive: boolean
  }> {
    const breadcrumbs = []
    const currentNavigation = this.#state.postNavigation

    // Add community breadcrumb - always use slug-based URLs
    if (this.#state.selectedCommunity) {
      // Check if we have slug information from navigation history
      const latestNavEntry = currentNavigation.navigationHistory[0]
      let communityHref: string
      
      if (latestNavEntry?.isSlugBased && latestNavEntry.communitySlug) {
        // Use slug-based URL if available
        communityHref = `/community/c/${latestNavEntry.communitySlug}`
      } else {
        // Generate slug from community name - always use slug-based URLs
        const communitySlug = this.#generateCommunitySlug(this.#state.selectedCommunity.name)
        communityHref = `/community/c/${communitySlug}`
      }
      
      breadcrumbs.push({
        label: this.#state.selectedCommunity.name,
        href: communityHref,
        isActive: false
      })
    }

    // Add post breadcrumb if viewing post detail
    if (currentNavigation.showPostDetail && this.#state.selectedPost) {
      breadcrumbs.push({
        label: this.#state.selectedPost.title,
        href: `#`, // Current page
        isActive: true
      })
    }

    return breadcrumbs
  }

  /**
   * Get recent navigation history for quick access
   * Requirements: 1.1, 1.2 - Enhanced user experience with slug-based navigation history
   */
  getRecentPostHistory(limit: number = 5): Array<{
    communityId: string
    communityName: string
    postId: string
    postTitle: string
    href: string
    timestamp: number
  }> {
    return this.#state.postNavigation.navigationHistory
      .filter(entry => entry.postId) // Only include post entries
      .slice(0, limit)
      .map(entry => {
        // Always generate slug-based URLs (Requirements 4.2, 4.3)
        let href: string
        if (entry.isSlugBased && entry.communitySlug && entry.postSlug) {
          href = `/community/c/${entry.communitySlug}/post/p/${entry.postSlug}`
        } else {
          // Generate slug-based URL from available data
          const communitySlug = entry.communitySlug || this.#generateCommunitySlug(entry.communityName)
          const postSlug = entry.postSlug || this.#generatePostSlug(entry.postTitle || 'untitled-post')
          href = `/community/c/${communitySlug}/post/p/${postSlug}`
        }
        
        return {
          ...entry,
          postId: entry.postId!,
          postTitle: entry.postTitle!,
          href
        }
      })
  }

  /**
   * Clear navigation history
   */
  clearNavigationHistory(): void {
    this.#setState({
      postNavigation: {
        ...this.#state.postNavigation,
        navigationHistory: []
      }
    })
  }

  // ==================== UTILITY ====================

  /**
   * Generate slug from community name
   * Requirements: 4.2, 4.3 - Consistent slug generation for URLs
   */
  #generateCommunitySlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
  }

  /**
   * Generate slug from post title
   * Requirements: 4.2, 4.3 - Consistent slug generation for URLs
   */
  #generatePostSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
  }

  clearError(): void {
    this.#setState({ error: null })
  }

  reset(): void {
    this.#state = { ...initialState }
    this.notify(this.#state)
  }

  #setState(partial: Partial<CommunityState>): void {
    this.#state = { ...this.#state, ...partial }
    this.notify(this.#state)
  }

  // Public setState method for external updates
  setState(partial: Partial<CommunityState>): void {
    this.#setState(partial)
  }
}

// Export singleton instance
export const communityStore = new CommunityStore()
