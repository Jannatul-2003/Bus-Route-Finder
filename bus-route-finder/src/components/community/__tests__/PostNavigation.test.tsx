import { describe, it, expect, beforeEach } from 'vitest'
import { communityStore } from '@/lib/stores/communityStore'

describe('Post Navigation Integration', () => {
  beforeEach(() => {
    // Reset store state before each test
    communityStore.reset()
    
    // Set up mock community for slug generation
    communityStore.setState({
      selectedCommunity: {
        id: 'community-1',
        name: 'Community 1',
        description: 'Test community',
        member_count: 10,
        post_count: 5,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        center_latitude: 0,
        center_longitude: 0,
        radius_meters: 5000
      }
    })
  })

  describe('Navigation State Management', () => {
    it('should initialize with empty navigation state', () => {
      const state = communityStore.getState()
      
      expect(state.postNavigation.selectedPostId).toBeNull()
      expect(state.postNavigation.showPostDetail).toBe(false)
      expect(state.postNavigation.previousRoute).toBeNull()
      expect(state.postNavigation.navigationHistory).toEqual([])
    })

    it('should update navigation state when navigating to post', () => {
      const communityId = 'community-1'
      const postId = 'post-1'
      const options = {
        communityName: 'Test Community',
        postTitle: 'Test Post',
        previousRoute: '/community/community-1'
      }

      communityStore.navigateToPost(communityId, postId, options)
      const state = communityStore.getState()

      expect(state.postNavigation.selectedPostId).toBe(postId)
      expect(state.postNavigation.showPostDetail).toBe(true)
      expect(state.postNavigation.previousRoute).toBe('/community/community-1')
      expect(state.postNavigation.navigationHistory).toHaveLength(1)
      expect(state.postNavigation.navigationHistory[0]).toMatchObject({
        communityId,
        communityName: 'Test Community',
        postId,
        postTitle: 'Test Post'
      })
    })

    it('should clear selected post when navigating back', () => {
      // First navigate to a post
      communityStore.navigateToPost('community-1', 'post-1', {
        previousRoute: '/community/community-1'
      })

      // Then navigate back
      const backRoute = communityStore.navigateBackFromPost()
      const state = communityStore.getState()

      expect(backRoute).toBe('/community/c/community-1')
      expect(state.postNavigation.selectedPostId).toBeNull()
      expect(state.postNavigation.showPostDetail).toBe(false)
      // History should be preserved
      expect(state.postNavigation.navigationHistory).toHaveLength(1)
    })

    it('should maintain navigation history with multiple posts', () => {
      // Navigate to first post
      communityStore.navigateToPost('community-1', 'post-1', {
        communityName: 'Community 1',
        postTitle: 'Post 1'
      })

      // Navigate to second post
      communityStore.navigateToPost('community-2', 'post-2', {
        communityName: 'Community 2',
        postTitle: 'Post 2'
      })

      const state = communityStore.getState()
      expect(state.postNavigation.navigationHistory).toHaveLength(2)
      expect(state.postNavigation.navigationHistory[0].postId).toBe('post-2')
      expect(state.postNavigation.navigationHistory[1].postId).toBe('post-1')
    })

    it('should limit navigation history to 10 entries', () => {
      // Add 12 navigation entries
      for (let i = 1; i <= 12; i++) {
        communityStore.navigateToPost(`community-${i}`, `post-${i}`, {
          communityName: `Community ${i}`,
          postTitle: `Post ${i}`
        })
      }

      const state = communityStore.getState()
      expect(state.postNavigation.navigationHistory).toHaveLength(10)
      // Most recent should be first
      expect(state.postNavigation.navigationHistory[0].postId).toBe('post-12')
      expect(state.postNavigation.navigationHistory[9].postId).toBe('post-3')
    })

    it('should deduplicate navigation history entries', () => {
      // Navigate to post-1
      communityStore.navigateToPost('community-1', 'post-1', {
        communityName: 'Community 1',
        postTitle: 'Post 1'
      })
      
      // Navigate to post-2
      communityStore.navigateToPost('community-1', 'post-2', {
        communityName: 'Community 1',
        postTitle: 'Post 2'
      })
      
      // Navigate back to post-1 (should move it to front, not duplicate)
      communityStore.navigateToPost('community-1', 'post-1', {
        communityName: 'Community 1',
        postTitle: 'Post 1 Updated'
      })

      const state = communityStore.getState()
      expect(state.postNavigation.navigationHistory).toHaveLength(2)
      
      // post-1 should be first (most recent)
      expect(state.postNavigation.navigationHistory[0].postId).toBe('post-1')
      expect(state.postNavigation.navigationHistory[0].postTitle).toBe('Post 1 Updated')
      
      // post-2 should be second
      expect(state.postNavigation.navigationHistory[1].postId).toBe('post-2')
      
      // Should not have duplicate post-1 entries
      const post1Entries = state.postNavigation.navigationHistory.filter(entry => entry.postId === 'post-1')
      expect(post1Entries).toHaveLength(1)
    })
  })

  describe('Navigation Helpers', () => {
    it('should return empty breadcrumbs when no community selected', () => {
      // Reset community state for this test
      communityStore.setState({ selectedCommunity: null })
      
      const breadcrumbs = communityStore.getPostNavigationBreadcrumbs()
      expect(breadcrumbs).toEqual([])
    })

    it('should return recent post history', () => {
      // Add some navigation history
      communityStore.navigateToPost('community-1', 'post-1', {
        communityName: 'Community 1',
        postTitle: 'Post 1'
      })
      communityStore.navigateToPost('community-2', 'post-2', {
        communityName: 'Community 2',
        postTitle: 'Post 2'
      })

      const recentHistory = communityStore.getRecentPostHistory(5)
      expect(recentHistory).toHaveLength(2)
      expect(recentHistory[0]).toMatchObject({
        communityId: 'community-2',
        postId: 'post-2',
        postTitle: 'Post 2',
        href: '/community/c/community-2/post/p/post-2'
      })
    })

    it('should clear navigation history', () => {
      // Add some history
      communityStore.navigateToPost('community-1', 'post-1')
      expect(communityStore.getState().postNavigation.navigationHistory).toHaveLength(1)

      // Clear history
      communityStore.clearNavigationHistory()
      expect(communityStore.getState().postNavigation.navigationHistory).toEqual([])
    })
  })

  describe('Requirements Validation', () => {
    it('should support proper routing and state management (Requirements 5.1, 5.2, 5.3)', () => {
      const communityId = 'test-community'
      const postId = 'test-post'
      
      // Set up mock community for slug generation
      communityStore.setState({
        selectedCommunity: {
          id: communityId,
          name: 'Test Community',
          description: 'Test community',
          member_count: 10,
          post_count: 5,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          center_latitude: 0,
          center_longitude: 0,
          radius_meters: 5000
        }
      })
      
      // Test navigation to post detail view
      communityStore.navigateToPost(communityId, postId, {
        communityName: 'Test Community',
        postTitle: 'Test Post Title',
        previousRoute: `/community/${communityId}`
      })

      const state = communityStore.getState()
      
      // Verify state management
      expect(state.postNavigation.selectedPostId).toBe(postId)
      expect(state.postNavigation.showPostDetail).toBe(true)
      expect(state.postNavigation.previousRoute).toBe(`/community/${communityId}`)
      
      // Verify navigation history
      expect(state.postNavigation.navigationHistory[0]).toMatchObject({
        communityId,
        postId,
        communityName: 'Test Community',
        postTitle: 'Test Post Title'
      })

      // Test back navigation
      const backRoute = communityStore.navigateBackFromPost()
      expect(backRoute).toBe(`/community/c/test-community`)
      
      const updatedState = communityStore.getState()
      expect(updatedState.postNavigation.selectedPostId).toBeNull()
      expect(updatedState.postNavigation.showPostDetail).toBe(false)
    })
  })
})