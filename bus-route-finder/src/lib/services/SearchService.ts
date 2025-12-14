import type { Community, CommunityWithDistance, PostWithAuthor, PostType, PostStatus } from '../types/community'
import { debounce } from '../utils/debounce'

/**
 * Service for handling real-time search functionality
 * Requirements: 2.1, 2.2, 2.3, 2.4 - Real-time community search with debouncing
 * Requirements: 2.1 (extended to posts) - Real-time post search with keyword filtering
 */
export class SearchService {
  /**
   * Filter communities by name with case-insensitive matching
   * Requirement 2.1: Filter communities whose names start with the entered text
   */
  searchCommunitiesByName(query: string, communities: CommunityWithDistance[]): CommunityWithDistance[] {
    if (!query.trim()) {
      return communities
    }

    const normalizedQuery = query.toLowerCase().trim()
    
    return communities.filter(community => 
      community.name.toLowerCase().startsWith(normalizedQuery)
    )
  }

  /**
   * Create a debounced version of a search function
   * Requirement 2.5: Maintain smooth performance without noticeable delays
   */
  debounceSearch<T extends (...args: any[]) => any>(callback: T, delay: number = 300): (...args: Parameters<T>) => void {
    return debounce(callback, delay)
  }

  /**
   * Filter communities by geographic radius
   * Used in conjunction with name filtering for comprehensive search
   */
  filterByRadius(
    communities: Community[], 
    userLocation: { latitude: number; longitude: number }, 
    radius: number
  ): CommunityWithDistance[] {
    return communities
      .map(community => {
        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          community.center_latitude,
          community.center_longitude
        )
        return {
          ...community,
          distance
        }
      })
      .filter(c => c.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
  }

  /**
   * Filter posts by keyword search in title and content
   * Requirement 2.1 (extended to posts): Filter posts whose title or content contains the search keyword
   */
  searchPostsByKeyword(query: string, posts: PostWithAuthor[]): PostWithAuthor[] {
    if (!query.trim()) {
      return posts
    }

    const normalizedQuery = query.toLowerCase().trim()
    
    return posts.filter(post => 
      post.title.toLowerCase().includes(normalizedQuery) ||
      post.content.toLowerCase().includes(normalizedQuery)
    )
  }

  /**
   * Filter posts by type
   */
  filterPostsByType(postType: PostType | null, posts: PostWithAuthor[]): PostWithAuthor[] {
    if (!postType) {
      return posts
    }

    return posts.filter(post => post.post_type === postType)
  }

  /**
   * Filter posts by status
   * Handles 'all' status to show all posts, null/undefined to show all posts, and specific status values
   */
  filterPostsByStatus(status: PostStatus | 'all' | null, posts: PostWithAuthor[]): PostWithAuthor[] {
    // If status is null, undefined, or 'all', return all posts
    if (!status || status === 'all') {
      return posts
    }

    // Filter by specific status
    return posts.filter(post => post.status === status)
  }

  /**
   * Apply all post filters (keyword, type, status) in combination
   */
  filterPosts(
    posts: PostWithAuthor[],
    filters: {
      keyword?: string
      postType?: PostType | null
      status?: PostStatus | 'all' | null
    }
  ): PostWithAuthor[] {
    let filteredPosts = posts

    // Apply keyword filter
    if (filters.keyword) {
      filteredPosts = this.searchPostsByKeyword(filters.keyword, filteredPosts)
    }

    // Apply type filter
    if (filters.postType) {
      filteredPosts = this.filterPostsByType(filters.postType, filteredPosts)
    }

    // Always apply status filter (including 'active' default and 'all' handling)
    filteredPosts = this.filterPostsByStatus(filters.status || null, filteredPosts)

    return filteredPosts
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
}

// Export singleton instance
export const searchService = new SearchService()