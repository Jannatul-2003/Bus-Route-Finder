import type { SupabaseClient } from '@supabase/supabase-js'
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
  NotificationPreferences,
  NotificationType,
  ItemCategory
} from '../types/community'

/**
 * Service for managing the Area-Based Community System
 * 
 * This service handles all database operations for communities, posts,
 * comments, notifications, and user frequent routes.
 */
export class CommunityService {
  constructor(private supabaseClient: SupabaseClient) {}

  // ==================== COMMUNITIES ====================

  /**
   * Create a new community and automatically add creator as member
   */
  async createCommunity(data: {
    name: string
    description?: string
    center_latitude: number
    center_longitude: number
    radius_meters?: number
    creator_id?: string
  }): Promise<Community> {
    const { data: community, error } = await this.supabaseClient
      .from('communities')
      .insert({
        name: data.name,
        description: data.description || null,
        center_latitude: data.center_latitude,
        center_longitude: data.center_longitude,
        radius_meters: data.radius_meters || 1000
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create community: ${error.message}`)
    }

    // Automatically add creator as member if creator_id is provided
    if (data.creator_id) {
      try {
        await this.joinCommunity(community.id, data.creator_id, {
          new_posts: true,
          lost_items: true,
          delays: true,
          emergencies: true
        })
      } catch (membershipError) {
        // If membership creation fails, we should still return the community
        // but log the error for debugging
        console.error('Failed to add creator as member:', membershipError)
      }
    }

    return community
  }

  /**
   * Update an existing community
   */
  async updateCommunity(
    communityId: string,
    data: Partial<Pick<Community, 'name' | 'description' | 'center_latitude' | 'center_longitude' | 'radius_meters'>>
  ): Promise<Community> {
    const { data: community, error } = await this.supabaseClient
      .from('communities')
      .update(data)
      .eq('id', communityId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update community: ${error.message}`)
    }

    return community
  }

  /**
   * Delete a community
   */
  async deleteCommunity(communityId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('communities')
      .delete()
      .eq('id', communityId)

    if (error) {
      throw new Error(`Failed to delete community: ${error.message}`)
    }
  }

  /**
   * Get a community by ID
   */
  async getCommunityById(communityId: string): Promise<Community | null> {
    const { data, error } = await this.supabaseClient
      .from('communities')
      .select('*')
      .eq('id', communityId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to fetch community: ${error.message}`)
    }

    return data
  }

  /**
   * Get nearby communities using radius and coordinates
   * Uses PostGIS for efficient geographic queries
   */
  async getNearbyCommunities(
    latitude: number,
    longitude: number,
    searchRadiusMeters: number = 5000
  ): Promise<CommunityWithDistance[]> {
    // Use PostGIS ST_DWithin for efficient geographic search
    const { data, error } = await this.supabaseClient
      .rpc('get_nearby_communities', {
        user_lat: latitude,
        user_lng: longitude,
        search_radius: searchRadiusMeters
      })

    if (error) {
      // Fallback to manual calculation if RPC doesn't exist
      console.warn('RPC get_nearby_communities not found, using fallback method')
      return this.getNearbyCommunities_Fallback(latitude, longitude, searchRadiusMeters)
    }

    return data || []
  }

  /**
   * Fallback method for getting nearby communities without RPC
   */
  private async getNearbyCommunities_Fallback(
    latitude: number,
    longitude: number,
    searchRadiusMeters: number
  ): Promise<CommunityWithDistance[]> {
    const { data: communities, error } = await this.supabaseClient
      .from('communities')
      .select('*')

    if (error) {
      throw new Error(`Failed to fetch communities: ${error.message}`)
    }

    if (!communities) return []

    // Calculate distance for each community and filter
    const communitiesWithDistance = communities
      .map(community => {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          community.center_latitude,
          community.center_longitude
        )
        return {
          ...community,
          distance
        }
      })
      .filter(c => c.distance <= searchRadiusMeters)
      .sort((a, b) => a.distance - b.distance)

    return communitiesWithDistance
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in meters
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  // ==================== COMMUNITY MEMBERS ====================

  /**
   * Join a community
   */
  async joinCommunity(
    communityId: string,
    userId: string,
    notificationPreferences?: NotificationPreferences
  ): Promise<CommunityMember> {
    const { data: member, error } = await this.supabaseClient
      .from('community_members')
      .insert({
        community_id: communityId,
        user_id: userId,
        notification_preferences: notificationPreferences || {
          new_posts: true,
          lost_items: true,
          delays: true,
          emergencies: true
        }
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to join community: ${error.message}`)
    }

    return member
  }

  /**
   * Leave a community
   */
  async leaveCommunity(communityId: string, userId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to leave community: ${error.message}`)
    }
  }

  /**
   * Get members of a community
   */
  async getMembersByCommunity(communityId: string): Promise<MemberWithUser[]> {
    const { data, error } = await this.supabaseClient
      .rpc('get_members_with_users', {
        p_community_id: communityId
      })

    if (error) {
      throw new Error(`Failed to fetch community members: ${error.message}`)
    }

    return (data || []).map((member: any) => ({
      ...member,
      user: {
        id: member.user_id,
        email: member.user_email
      }
    }))
  }

  /**
   * Get communities a user is a member of
   */
  async getCommunitiesByUser(userId: string): Promise<Community[]> {
    // First get the community IDs the user is a member of
    const { data: memberData, error: memberError } = await this.supabaseClient
      .from('community_members')
      .select('community_id')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false })

    if (memberError) {
      throw new Error(`Failed to fetch user communities: ${memberError.message}`)
    }

    if (!memberData || memberData.length === 0) {
      return []
    }

    // Then get the community details
    const communityIds = memberData.map(m => m.community_id)
    const { data: communities, error: communityError } = await this.supabaseClient
      .from('communities')
      .select('*')
      .in('id', communityIds)

    if (communityError) {
      throw new Error(`Failed to fetch community details: ${communityError.message}`)
    }

    return communities || []
  }

  /**
   * Update member notification preferences
   */
  async updateMemberPreferences(
    communityId: string,
    userId: string,
    preferences: NotificationPreferences
  ): Promise<CommunityMember> {
    const { data, error } = await this.supabaseClient
      .from('community_members')
      .update({ notification_preferences: preferences })
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update member preferences: ${error.message}`)
    }

    return data
  }

  // ==================== COMMUNITY POSTS ====================

  /**
   * Create a new community post
   */
  async createPost(data: {
    community_id: string
    author_id: string
    post_type: PostType
    title: string
    content: string
    item_category?: ItemCategory
    item_description?: string
    photo_url?: string
    location_latitude?: number
    location_longitude?: number
    bus_id?: string
    slug?: string
  }): Promise<CommunityPost> {
    const { data: post, error } = await this.supabaseClient
      .from('community_posts')
      .insert({
        community_id: data.community_id,
        author_id: data.author_id,
        post_type: data.post_type,
        title: data.title,
        content: data.content,
        slug: data.slug || null, // Let database trigger generate if not provided
        item_category: data.item_category || null,
        item_description: data.item_description || null,
        photo_url: data.photo_url || null,
        location_latitude: data.location_latitude || null,
        location_longitude: data.location_longitude || null,
        bus_id: data.bus_id || null
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create post: ${error.message}`)
    }

    return post
  }

  /**
   * Update a post
   */
  async updatePost(
    postId: string,
    data: Partial<Pick<CommunityPost, 'title' | 'content' | 'status' | 'photo_url'>>
  ): Promise<CommunityPost> {
    const updateData: any = { ...data }
    
    // If status is being set to resolved, set resolved_at
    if (data.status === 'resolved') {
      updateData.resolved_at = new Date().toISOString()
    }

    const { data: post, error } = await this.supabaseClient
      .from('community_posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update post: ${error.message}`)
    }

    return post
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('community_posts')
      .delete()
      .eq('id', postId)

    if (error) {
      throw new Error(`Failed to delete post: ${error.message}`)
    }
  }

  /**
   * Get posts by community
   */
  async getPostsByCommunity(
    communityId: string,
    options?: {
      postType?: PostType
      status?: PostStatus
      limit?: number
      offset?: number
    }
  ): Promise<PostWithAuthor[]> {
    const { data, error } = await this.supabaseClient
      .rpc('get_posts_with_authors', {
        p_community_id: communityId,
        p_post_type: options?.postType || null,
        p_status: options?.status || null,
        p_limit: options?.limit || null,
        p_offset: options?.offset || 0
      })

    if (error) {
      throw new Error(`Failed to fetch community posts: ${error.message}`)
    }

    // Get bus information for posts that have bus_id
    const postsWithBusInfo = await Promise.all(
      (data || []).map(async (post: any) => {
        let bus = null
        if (post.bus_id) {
          const busName = await this.getBusNameById(post.bus_id)
          bus = {
            id: post.bus_id,
            name: busName
          }
        }

        return {
          ...post,
          author: {
            id: post.author_id,
            email: post.author_email
          },
          bus
        }
      })
    )

    return postsWithBusInfo
  }

  /**
   * Get posts by user
   */
  async getPostsByUser(userId: string): Promise<PostWithAuthor[]> {
    const { data, error } = await this.supabaseClient
      .rpc('get_posts_by_user_with_author', {
        p_user_id: userId
      })

    if (error) {
      throw new Error(`Failed to fetch user posts: ${error.message}`)
    }

    // Get bus information for posts that have bus_id
    const postsWithBusInfo = await Promise.all(
      (data || []).map(async (post: any) => {
        let bus = null
        if (post.bus_id) {
          const busName = await this.getBusNameById(post.bus_id)
          bus = {
            id: post.bus_id,
            name: busName
          }
        }

        return {
          ...post,
          author: {
            id: post.author_id,
            email: post.author_email
          },
          bus
        }
      })
    )

    return postsWithBusInfo
  }

  /**
   * Get posts by bus
   */
  async getPostsByBus(busId: string): Promise<PostWithAuthor[]> {
    const { data, error } = await this.supabaseClient
      .rpc('get_posts_by_bus_with_author', {
        p_bus_id: busId
      })

    if (error) {
      throw new Error(`Failed to fetch bus posts: ${error.message}`)
    }

    // Get bus information
    const busName = await this.getBusNameById(busId)

    return (data || []).map((post: any) => ({
      ...post,
      author: {
        id: post.author_id,
        email: post.author_email
      },
      bus: {
        id: busId,
        name: busName
      }
    }))
  }

  /**
   * Get a single post by ID
   */
  async getPostById(postId: string): Promise<PostWithAuthor | null> {
    const { data, error } = await this.supabaseClient
      .rpc('get_post_with_author', {
        p_post_id: postId
      })

    if (error) {
      throw new Error(`Failed to fetch post: ${error.message}`)
    }

    if (!data || data.length === 0) return null

    const post = data[0]
    let bus = null
    if (post.bus_id) {
      const busName = await this.getBusNameById(post.bus_id)
      bus = {
        id: post.bus_id,
        name: busName
      }
    }

    return {
      ...post,
      author: {
        id: post.author_id,
        email: post.author_email
      },
      bus
    }
  }

  /**
   * Get a single post by slug within a community
   */
  async getPostBySlug(communityId: string, postSlug: string): Promise<PostWithAuthor | null> {
    const { data, error } = await this.supabaseClient
      .rpc('get_post_by_slug_with_author', {
        p_community_id: communityId,
        p_slug: postSlug
      })

    if (error) {
      throw new Error(`Failed to fetch post by slug: ${error.message}`)
    }

    if (!data || data.length === 0) return null

    const post = data[0]
    let bus = null
    if (post.bus_id) {
      const busName = await this.getBusNameById(post.bus_id)
      bus = {
        id: post.bus_id,
        name: busName
      }
    }

    return {
      ...post,
      author: {
        id: post.author_id,
        email: post.author_email
      },
      bus
    }
  }

  /**
   * Check if a slug is unique within a community
   */
  async isSlugUniqueInCommunity(
    communityId: string, 
    slug: string, 
    excludePostId?: string
  ): Promise<boolean> {
    let query = this.supabaseClient
      .from('community_posts')
      .select('id')
      .eq('community_id', communityId)
      .eq('slug', slug)

    if (excludePostId) {
      query = query.neq('id', excludePostId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to check slug uniqueness: ${error.message}`)
    }

    return !data || data.length === 0
  }

  /**
   * Generate a unique slug for a post within a community
   */
  async generateUniquePostSlug(
    communityId: string, 
    title: string, 
    excludePostId?: string
  ): Promise<string> {
    // Import the slug generation function
    const { generatePostSlug } = await import('@/lib/utils/slugs')
    
    const baseSlug = generatePostSlug(title)
    let finalSlug = baseSlug
    let counter = 0

    // Keep trying until we find a unique slug
    while (!(await this.isSlugUniqueInCommunity(communityId, finalSlug, excludePostId))) {
      counter++
      finalSlug = `${baseSlug}-${counter}`
    }

    return finalSlug
  }

  /**
   * Increment post view count
   */
  async incrementPostViewCount(postId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .rpc('increment_post_view_count', { post_id: postId })

    if (error) {
      // Fallback to manual increment - fetch current count and increment
      const { data: post } = await this.supabaseClient
        .from('community_posts')
        .select('view_count')
        .eq('id', postId)
        .single()

      if (post) {
        const { error: updateError } = await this.supabaseClient
          .from('community_posts')
          .update({ view_count: post.view_count + 1 })
          .eq('id', postId)

        if (updateError) {
          console.error('Failed to increment view count:', updateError.message)
        }
      }
    }
  }

  // ==================== POST COMMENTS ====================

  /**
   * Create a comment on a post
   */
  async createComment(data: {
    post_id: string
    author_id: string
    content: string
    is_resolution?: boolean
    contact_info?: string
  }): Promise<PostComment> {
    const { data: comment, error } = await this.supabaseClient
      .from('post_comments')
      .insert({
        post_id: data.post_id,
        author_id: data.author_id,
        content: data.content,
        is_resolution: data.is_resolution || false,
        contact_info: data.contact_info || null
      })
      .select()
      .single()

    if (error) {
      // Provide more specific error information
      console.error('Database error creating comment:', error)
      throw new Error(`Failed to create comment: ${error.message}`)
    }

    return comment
  }

  /**
   * Update a comment
   */
  async updateComment(
    commentId: string,
    data: Partial<Pick<PostComment, 'content' | 'is_resolution'>>
  ): Promise<PostComment> {
    const { data: comments, error } = await this.supabaseClient
      .from('post_comments')
      .update(data)
      .eq('id', commentId)
      .select()

    if (error) {
      throw new Error(`Failed to update comment: ${error.message}`)
    }

    if (!comments || comments.length === 0) {
      throw new Error('Comment not found or no changes made')
    }

    return comments[0]
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('post_comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      throw new Error(`Failed to delete comment: ${error.message}`)
    }
  }

  /**
   * Get comments for a post
   */
  async getCommentsByPost(postId: string): Promise<CommentWithAuthor[]> {
    const { data, error } = await this.supabaseClient
      .rpc('get_comments_with_authors', {
        p_post_id: postId
      })

    if (error) {
      throw new Error(`Failed to fetch comments: ${error.message}`)
    }

    return (data || []).map((comment: any) => ({
      ...comment,
      author: {
        id: comment.author_id,
        email: comment.author_email
      }
    }))
  }

  // ==================== NOTIFICATIONS ====================

  /**
   * Create a notification
   */
  async createNotification(data: {
    user_id: string
    community_id?: string
    post_id?: string
    notification_type: NotificationType
    title: string
    message: string
  }): Promise<CommunityNotification> {
    const { data: notification, error } = await this.supabaseClient
      .from('community_notifications')
      .insert({
        user_id: data.user_id,
        community_id: data.community_id || null,
        post_id: data.post_id || null,
        notification_type: data.notification_type,
        title: data.title,
        message: data.message
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`)
    }

    return notification
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId: string): Promise<CommunityNotification[]> {
    const { data, error } = await this.supabaseClient
      .from('community_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get all notifications for a user
   */
  async getNotificationsByUser(
    userId: string,
    limit: number = 50
  ): Promise<CommunityNotification[]> {
    const { data, error } = await this.supabaseClient
      .from('community_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`)
    }

    return data || []
  }

  /**
   * Mark a notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('community_notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`)
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('community_notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`)
    }
  }

  // ==================== FREQUENT ROUTES ====================

  /**
   * Add or update a frequent route
   */
  async addFrequentRoute(data: {
    user_id: string
    bus_id: string
    onboarding_stop_id: string
    offboarding_stop_id: string
  }): Promise<UserFrequentRoute> {
    // Try to find existing route
    const { data: existing } = await this.supabaseClient
      .from('user_frequent_routes')
      .select('*')
      .eq('user_id', data.user_id)
      .eq('bus_id', data.bus_id)
      .eq('onboarding_stop_id', data.onboarding_stop_id)
      .eq('offboarding_stop_id', data.offboarding_stop_id)
      .single()

    if (existing) {
      // Update usage count
      const { data: updated, error } = await this.supabaseClient
        .from('user_frequent_routes')
        .update({
          usage_count: existing.usage_count + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update frequent route: ${error.message}`)
      }

      return updated
    } else {
      // Create new route
      const { data: created, error } = await this.supabaseClient
        .from('user_frequent_routes')
        .insert(data)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to add frequent route: ${error.message}`)
      }

      return created
    }
  }

  /**
   * Delete a frequent route
   */
  async deleteFrequentRoute(routeId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('user_frequent_routes')
      .delete()
      .eq('id', routeId)

    if (error) {
      throw new Error(`Failed to delete frequent route: ${error.message}`)
    }
  }

  /**
   * Get user's frequent routes
   */
  async getUserFrequentRoutes(userId: string): Promise<UserFrequentRoute[]> {
    const { data, error } = await this.supabaseClient
      .from('user_frequent_routes')
      .select('*')
      .eq('user_id', userId)
      .order('usage_count', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch frequent routes: ${error.message}`)
    }

    return data || []
  }

  // ==================== BUS UTILITIES ====================

  /**
   * Get bus ID by name
   */
  async getBusIdByName(busName: string): Promise<string | null> {
    const { data, error } = await this.supabaseClient
      .from('buses')
      .select('id')
      .eq('name', busName)
      .eq('status', 'active')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Bus not found
      }
      throw new Error(`Failed to fetch bus: ${error.message}`)
    }

    return data?.id || null
  }

  /**
   * Get bus name by ID
   */
  async getBusNameById(busId: string): Promise<string | null> {
    const { data, error } = await this.supabaseClient
      .from('buses')
      .select('name')
      .eq('id', busId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Bus not found
      }
      throw new Error(`Failed to fetch bus: ${error.message}`)
    }

    return data?.name || null
  }

  /**
   * Generate a URL-safe slug from community name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
  }

  /**
   * Get community by slug (URL-safe identifier)
   */
  async getCommunityBySlug(slug: string): Promise<Community | null> {
    // First try to find by exact slug match if we have a slug column
    // For now, we'll search by name pattern matching
    const { data: communities, error } = await this.supabaseClient
      .from('communities')
      .select('*')

    if (error) {
      throw new Error(`Failed to fetch communities: ${error.message}`)
    }

    if (!communities) return null

    // Find community where generated slug matches the provided slug
    const community = communities.find(c => this.generateSlug(c.name) === slug)
    return community || null
  }

  /**
   * Get community slug from name
   */
  getCommunitySlug(community: Community): string {
    return this.generateSlug(community.name)
  }

  /**
   * Search communities by name (case-insensitive)
   */
  async searchCommunitiesByName(name: string): Promise<Community[]> {
    const { data: communities, error } = await this.supabaseClient
      .from('communities')
      .select('*')
      .ilike('name', `%${name}%`)
      .order('name')

    if (error) {
      throw new Error(`Failed to search communities: ${error.message}`)
    }

    return communities || []
  }
}

// Create and export a singleton instance
import { getSupabaseClient } from '@/lib/supabase/client'

export const communityService = new CommunityService(getSupabaseClient())