import { describe, it, expect } from 'vitest'
import { searchService } from '../SearchService'
import type { PostWithAuthor, PostType, PostStatus } from '../../types/community'

describe('SearchService - Post Search Functionality', () => {
  const mockPosts: PostWithAuthor[] = [
    {
      id: '1',
      community_id: 'comm1',
      author_id: 'user1',
      post_type: 'discussion',
      title: 'Bus Route Discussion',
      content: 'Let\'s discuss the new bus route changes',
      item_category: null,
      item_description: null,
      photo_url: null,
      location_latitude: null,
      location_longitude: null,
      bus_id: null,
      status: 'active',
      resolved_at: null,
      view_count: 10,
      comment_count: 5,
      helpful_count: 2,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      community_id: 'comm1',
      author_id: 'user2',
      post_type: 'lost_item',
      title: 'Lost Phone on Bus',
      content: 'I lost my phone on the morning bus. It\'s a black iPhone.',
      item_category: 'phone',
      item_description: 'Black iPhone 12',
      photo_url: null,
      location_latitude: null,
      location_longitude: null,
      bus_id: 'bus1',
      status: 'active',
      resolved_at: null,
      view_count: 15,
      comment_count: 3,
      helpful_count: 1,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    },
    {
      id: '3',
      community_id: 'comm1',
      author_id: 'user3',
      post_type: 'found_item',
      title: 'Found Wallet',
      content: 'Found a brown leather wallet near the bus stop',
      item_category: 'wallet',
      item_description: 'Brown leather wallet',
      photo_url: null,
      location_latitude: null,
      location_longitude: null,
      bus_id: null,
      status: 'resolved',
      resolved_at: '2024-01-03T12:00:00Z',
      view_count: 8,
      comment_count: 2,
      helpful_count: 3,
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T12:00:00Z'
    },
    {
      id: '4',
      community_id: 'comm1',
      author_id: 'user4',
      post_type: 'delay_report',
      title: 'Bus Delay Alert',
      content: 'Route 25 is experiencing significant delays due to traffic',
      item_category: null,
      item_description: null,
      photo_url: null,
      location_latitude: null,
      location_longitude: null,
      bus_id: 'bus25',
      status: 'active',
      resolved_at: null,
      view_count: 25,
      comment_count: 8,
      helpful_count: 5,
      created_at: '2024-01-04T00:00:00Z',
      updated_at: '2024-01-04T00:00:00Z'
    }
  ]

  describe('searchPostsByKeyword', () => {
    it('should return all posts when query is empty', () => {
      const result = searchService.searchPostsByKeyword('', mockPosts)
      expect(result).toEqual(mockPosts)
    })

    it('should return all posts when query is only whitespace', () => {
      const result = searchService.searchPostsByKeyword('   ', mockPosts)
      expect(result).toEqual(mockPosts)
    })

    it('should filter posts by title keyword (case-insensitive)', () => {
      const result = searchService.searchPostsByKeyword('bus', mockPosts)
      expect(result).toHaveLength(4) // All posts contain "bus" in title or content
      expect(result.map(p => p.id)).toEqual(['1', '2', '3', '4'])
    })

    it('should filter posts by title-only keyword', () => {
      const result = searchService.searchPostsByKeyword('discussion', mockPosts)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })

    it('should filter posts by content keyword (case-insensitive)', () => {
      const result = searchService.searchPostsByKeyword('phone', mockPosts)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('2')
    })

    it('should filter posts by keyword in both title and content', () => {
      const result = searchService.searchPostsByKeyword('route', mockPosts)
      expect(result).toHaveLength(2)
      expect(result.map(p => p.id)).toEqual(['1', '4'])
    })

    it('should return empty array when no posts match keyword', () => {
      const result = searchService.searchPostsByKeyword('nonexistent', mockPosts)
      expect(result).toHaveLength(0)
    })

    it('should handle partial word matches', () => {
      const result = searchService.searchPostsByKeyword('wal', mockPosts)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('3')
    })
  })

  describe('filterPostsByType', () => {
    it('should return all posts when postType is null', () => {
      const result = searchService.filterPostsByType(null, mockPosts)
      expect(result).toEqual(mockPosts)
    })

    it('should filter posts by discussion type', () => {
      const result = searchService.filterPostsByType('discussion', mockPosts)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })

    it('should filter posts by lost_item type', () => {
      const result = searchService.filterPostsByType('lost_item', mockPosts)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('2')
    })

    it('should filter posts by found_item type', () => {
      const result = searchService.filterPostsByType('found_item', mockPosts)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('3')
    })

    it('should filter posts by delay_report type', () => {
      const result = searchService.filterPostsByType('delay_report', mockPosts)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('4')
    })

    it('should return empty array when no posts match type', () => {
      const result = searchService.filterPostsByType('emergency', mockPosts)
      expect(result).toHaveLength(0)
    })
  })

  describe('filterPostsByStatus', () => {
    it('should return all posts when status is null', () => {
      const result = searchService.filterPostsByStatus(null, mockPosts)
      expect(result).toEqual(mockPosts)
    })

    it('should filter posts by active status', () => {
      const result = searchService.filterPostsByStatus('active', mockPosts)
      expect(result).toHaveLength(3)
      expect(result.map(p => p.id)).toEqual(['1', '2', '4'])
    })

    it('should filter posts by resolved status', () => {
      const result = searchService.filterPostsByStatus('resolved', mockPosts)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('3')
    })

    it('should return empty array when no posts match status', () => {
      const result = searchService.filterPostsByStatus('closed', mockPosts)
      expect(result).toHaveLength(0)
    })
  })

  describe('filterPosts - Combined Filtering', () => {
    it('should apply keyword filter only', () => {
      const result = searchService.filterPosts(mockPosts, { keyword: 'bus' })
      expect(result).toHaveLength(4) // All posts contain "bus" in title or content
      expect(result.map(p => p.id)).toEqual(['1', '2', '3', '4'])
    })

    it('should apply type filter only', () => {
      const result = searchService.filterPosts(mockPosts, { postType: 'lost_item' })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('2')
    })

    it('should apply status filter only', () => {
      const result = searchService.filterPosts(mockPosts, { status: 'resolved' })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('3')
    })

    it('should apply keyword and type filters together', () => {
      const result = searchService.filterPosts(mockPosts, { 
        keyword: 'bus', 
        postType: 'delay_report' 
      })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('4')
    })

    it('should apply keyword and status filters together', () => {
      const result = searchService.filterPosts(mockPosts, { 
        keyword: 'bus', 
        status: 'active' 
      })
      expect(result).toHaveLength(3)
      expect(result.map(p => p.id)).toEqual(['1', '2', '4'])
    })

    it('should apply type and status filters together', () => {
      const result = searchService.filterPosts(mockPosts, { 
        postType: 'found_item', 
        status: 'resolved' 
      })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('3')
    })

    it('should apply all filters together', () => {
      const result = searchService.filterPosts(mockPosts, { 
        keyword: 'wallet', 
        postType: 'found_item', 
        status: 'resolved' 
      })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('3')
    })

    it('should return empty array when combined filters match nothing', () => {
      const result = searchService.filterPosts(mockPosts, { 
        keyword: 'bus', 
        postType: 'found_item', 
        status: 'active' 
      })
      expect(result).toHaveLength(0)
    })

    it('should return all posts when no filters are applied', () => {
      const result = searchService.filterPosts(mockPosts, {})
      expect(result).toEqual(mockPosts)
    })
  })
})