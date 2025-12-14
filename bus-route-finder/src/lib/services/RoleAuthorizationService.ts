import type { User } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase/client"

export type UserRole = 'visitor' | 'member' | 'contributor'

export interface AuthUser extends User {
  is_contributor?: boolean
}

export interface RoleCheckResult {
  allowed: boolean
  role: UserRole
  reason?: string
}

/**
 * Centralized service for role-based authorization checks
 * Handles permission validation for different user types and actions
 */
export class RoleAuthorizationService {
  private static instance: RoleAuthorizationService
  private supabase = getSupabaseClient()

  private constructor() {}

  static getInstance(): RoleAuthorizationService {
    if (!RoleAuthorizationService.instance) {
      RoleAuthorizationService.instance = new RoleAuthorizationService()
    }
    return RoleAuthorizationService.instance
  }

  /**
   * Determine user role based on authentication status and contributor flag
   */
  getUserRole(user: AuthUser | null, communityId?: string): UserRole {
    if (!user) return 'visitor'
    if (user.is_contributor) return 'contributor'
    return 'member'
  }

  /**
   * Check if user can create communities
   * Only contributors can create communities
   */
  canCreateCommunity(user: AuthUser | null): RoleCheckResult {
    const role = this.getUserRole(user)
    
    if (role === 'visitor') {
      return {
        allowed: false,
        role,
        reason: 'Must be logged in to create communities'
      }
    }
    
    if (role === 'member') {
      return {
        allowed: false,
        role,
        reason: 'Must be a contributor to create communities'
      }
    }
    
    return {
      allowed: true,
      role
    }
  }

  /**
   * Check if user can join communities
   * Only authenticated users (members and contributors) can join
   */
  canJoinCommunity(user: AuthUser | null): RoleCheckResult {
    const role = this.getUserRole(user)
    
    if (role === 'visitor') {
      return {
        allowed: false,
        role,
        reason: 'Must be logged in to join communities'
      }
    }
    
    return {
      allowed: true,
      role
    }
  }

  /**
   * Check if user can leave communities
   * Only authenticated users who are members can leave
   */
  async canLeaveCommunity(user: AuthUser | null, communityId: string): Promise<RoleCheckResult> {
    const role = this.getUserRole(user)
    
    if (role === 'visitor') {
      return {
        allowed: false,
        role,
        reason: 'Must be logged in to leave communities'
      }
    }

    // Check if user is actually a member of the community
    const isMember = await this.isUserMemberOfCommunity(user!.id, communityId)
    if (!isMember) {
      return {
        allowed: false,
        role,
        reason: 'Must be a member to leave community'
      }
    }
    
    return {
      allowed: true,
      role
    }
  }

  /**
   * Check if user can create posts in a community
   * Only community members can create posts
   */
  async canCreatePost(user: AuthUser | null, communityId: string): Promise<RoleCheckResult> {
    const role = this.getUserRole(user)
    
    if (role === 'visitor') {
      return {
        allowed: false,
        role,
        reason: 'Must be logged in to create posts'
      }
    }

    // Check if user is a member of the community
    const isMember = await this.isUserMemberOfCommunity(user!.id, communityId)
    if (!isMember) {
      return {
        allowed: false,
        role,
        reason: 'Must be a community member to create posts'
      }
    }
    
    return {
      allowed: true,
      role
    }
  }

  /**
   * Check if user can view posts
   * All users (including visitors) can view posts
   */
  canViewPosts(user: AuthUser | null): RoleCheckResult {
    const role = this.getUserRole(user)
    
    return {
      allowed: true,
      role
    }
  }

  /**
   * Check if user can comment on posts
   * Only community members can comment
   */
  async canCommentOnPost(user: AuthUser | null, postId: string): Promise<RoleCheckResult> {
    const role = this.getUserRole(user)
    
    if (role === 'visitor') {
      return {
        allowed: false,
        role,
        reason: 'Must be logged in to comment on posts'
      }
    }

    // Get the community ID from the post
    const { data: post } = await this.supabase
      .from('community_posts')
      .select('community_id')
      .eq('id', postId)
      .single()

    if (!post) {
      return {
        allowed: false,
        role,
        reason: 'Post not found'
      }
    }

    // Check if user is a member of the community
    const isMember = await this.isUserMemberOfCommunity(user!.id, post.community_id)
    if (!isMember) {
      return {
        allowed: false,
        role,
        reason: 'Must be a community member to comment on posts'
      }
    }
    
    return {
      allowed: true,
      role
    }
  }

  /**
   * Helper method to check if user is a member of a community
   */
  private async isUserMemberOfCommunity(userId: string, communityId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('community_members')
      .select('id')
      .eq('user_id', userId)
      .eq('community_id', communityId)
      .single()

    return !error && !!data
  }

  /**
   * Get user's membership status in a community
   */
  async getUserMembershipStatus(userId: string, communityId: string): Promise<{
    isMember: boolean
    membershipData?: any
  }> {
    const { data, error } = await this.supabase
      .from('community_members')
      .select('*')
      .eq('user_id', userId)
      .eq('community_id', communityId)
      .single()

    return {
      isMember: !error && !!data,
      membershipData: data
    }
  }

  /**
   * Validate API request authorization
   * Used in API routes to enforce role-based access control
   */
  async validateApiAccess(
    user: AuthUser | null,
    action: 'create_community' | 'join_community' | 'leave_community' | 'create_post' | 'comment_post',
    resourceId?: string
  ): Promise<RoleCheckResult> {
    switch (action) {
      case 'create_community':
        return this.canCreateCommunity(user)
      
      case 'join_community':
        return this.canJoinCommunity(user)
      
      case 'leave_community':
        if (!resourceId) {
          return { allowed: false, role: this.getUserRole(user), reason: 'Community ID required' }
        }
        return this.canLeaveCommunity(user, resourceId)
      
      case 'create_post':
        if (!resourceId) {
          return { allowed: false, role: this.getUserRole(user), reason: 'Community ID required' }
        }
        return this.canCreatePost(user, resourceId)
      
      case 'comment_post':
        if (!resourceId) {
          return { allowed: false, role: this.getUserRole(user), reason: 'Post ID required' }
        }
        return this.canCommentOnPost(user, resourceId)
      
      default:
        return {
          allowed: false,
          role: this.getUserRole(user),
          reason: 'Unknown action'
        }
    }
  }
}

// Export singleton instance
export const roleAuthService = RoleAuthorizationService.getInstance()