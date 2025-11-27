"use client"

import { Observable } from "@/lib/observer"
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
  
  // Members
  communityMembers: MemberWithUser[]
  
  // Posts
  posts: PostWithAuthor[]
  selectedPost: PostWithAuthor | null
  postFilters: {
    postType: PostType | null
    status: PostStatus | null
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
  communityMembers: [],
  posts: [],
  selectedPost: null,
  postFilters: {
    postType: null,
    status: 'active'
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
      this.#setState({ communities, loading: false })
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

  // ==================== COMMUNITY MEMBERS ====================

  async joinCommunity(
    communityId: string,
    notificationPreferences?: NotificationPreferences
  ): Promise<void> {
    this.#setState({ loading: true, error: null })

    try {
      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_preferences: notificationPreferences })
      })

      if (!response.ok) {
        throw new Error('Failed to join community')
      }

      // Refresh community data to update member count
      await this.fetchCommunityById(communityId)
      this.#setState({ loading: false })
    } catch (error) {
      this.#setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to join community'
      })
    }
  }

  async leaveCommunity(communityId: string): Promise<void> {
    this.#setState({ loading: true, error: null })

    try {
      const response = await fetch(`/api/communities/${communityId}/leave`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to leave community')
      }

      // Refresh community data to update member count
      await this.fetchCommunityById(communityId)
      this.#setState({ loading: false })
    } catch (error) {
      this.#setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to leave community'
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
      this.#setState({ userCommunities: communities, loading: false })
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
      this.#setState({ posts, loading: false })
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
  }): Promise<PostWithAuthor | null> {
    this.#setState({ loading: true, error: null })

    try {
      const response = await fetch(`/api/communities/${communityId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to create post')
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

  setPostFilters(filters: { postType?: PostType | null; status?: PostStatus | null }): void {
    this.#setState({
      postFilters: {
        postType: filters.postType !== undefined ? filters.postType : this.#state.postFilters.postType,
        status: filters.status !== undefined ? filters.status : this.#state.postFilters.status
      }
    })
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
    this.#setState({ loading: true, error: null })

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to create comment')
      }

      const comment = await response.json()
      
      // Add to comments list
      this.#setState({
        comments: [...this.#state.comments, comment],
        loading: false
      })
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

  // ==================== UTILITY ====================

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
}

// Export singleton instance
export const communityStore = new CommunityStore()
