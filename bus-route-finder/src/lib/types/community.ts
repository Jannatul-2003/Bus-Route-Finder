/**
 * Community System Database Types
 */

export interface Community {
  id: string
  name: string
  description: string | null
  center_latitude: number
  center_longitude: number
  radius_meters: number
  member_count: number
  post_count: number
  created_at: string
  updated_at: string
}

export interface CommunityMember {
  id: string
  community_id: string
  user_id: string
  role: 'member' | 'moderator' | 'admin'
  joined_at: string
  last_active_at: string
  notification_preferences: NotificationPreferences
}

export interface NotificationPreferences {
  new_posts: boolean
  lost_items: boolean
  delays: boolean
  emergencies: boolean
}

export type PostType = 'discussion' | 'lost_item' | 'found_item' | 'delay_report' | 'emergency'
export type PostStatus = 'active' | 'resolved' | 'closed'
export type ItemCategory = 'phone' | 'wallet' | 'bag' | 'keys' | 'documents' | 'other'

export interface CommunityPost {
  id: string
  community_id: string
  author_id: string
  post_type: PostType
  title: string
  content: string
  slug: string | null
  item_category: ItemCategory | null
  item_description: string | null
  photo_url: string | null
  location_latitude: number | null
  location_longitude: number | null
  bus_id: string | null
  status: PostStatus
  resolved_at: string | null
  view_count: number
  comment_count: number
  helpful_count: number
  created_at: string
  updated_at: string
}

export interface PostComment {
  id: string
  post_id: string
  author_id: string
  content: string
  is_resolution: boolean
  contact_info: string | null
  helpful_count: number
  created_at: string
  updated_at: string
}

export type NotificationType = 'new_post' | 'new_comment' | 'found_item' | 'delay_alert' | 'emergency'

export interface CommunityNotification {
  id: string
  user_id: string
  community_id: string | null
  post_id: string | null
  notification_type: NotificationType
  title: string
  message: string
  read: boolean
  created_at: string
}

export interface UserFrequentRoute {
  id: string
  user_id: string
  bus_id: string
  onboarding_stop_id: string
  offboarding_stop_id: string
  usage_count: number
  last_used_at: string
  created_at: string
}

// Extended types with joined data
export interface CommunityWithDistance extends Community {
  distance: number // distance in meters from reference point
}

export interface PostWithAuthor extends CommunityPost {
  author?: {
    id: string
    email?: string
  }
  bus?: {
    id: string
    name: string
  }
}

export interface CommentWithAuthor extends PostComment {
  author?: {
    id: string
    email?: string
  }
}

export interface MemberWithUser extends CommunityMember {
  user?: {
    id: string
    email?: string
  }
}
