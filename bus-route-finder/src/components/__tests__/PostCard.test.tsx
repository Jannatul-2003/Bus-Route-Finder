import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { PostCard } from '../community/PostCard'
import type { PostWithAuthor } from '@/lib/types/community'

// Mock the usePostNavigation hook
const mockNavigateToPost = vi.fn()
const mockGeneratePostSlugFromTitle = vi.fn().mockReturnValue('test-post-title')
vi.mock('@/hooks/usePostNavigation', () => ({
  usePostNavigation: () => ({
    navigateToPost: mockNavigateToPost,
    navigateBackFromPost: vi.fn(),
    navigateToCommunity: vi.fn(),
    navigateToPostCreation: vi.fn(),
    generatePostUrl: vi.fn(),
    generateCreatePostUrl: vi.fn(),
    generatePostSlugFromTitle: mockGeneratePostSlugFromTitle,
    generateCommunitySlugFromName: vi.fn(),
    validateSlugFormat: vi.fn().mockReturnValue(true),
    redirectIdToSlug: vi.fn(),
    getBreadcrumbs: vi.fn(),
    getRecentHistory: vi.fn(),
    clearHistory: vi.fn()
  })
}))

// Mock the communityStore
vi.mock('@/lib/stores/communityStore', () => ({
  communityStore: {
    getState: () => ({
      selectedCommunity: { name: 'Test Community' }
    })
  }
}))

describe('PostCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGeneratePostSlugFromTitle.mockReturnValue('test-post-title')
  })

  const mockPost: PostWithAuthor = {
    id: 'post-1',
    community_id: 'community-1',
    author_id: 'user-1',
    post_type: 'discussion',
    title: 'Test Post Title',
    content: 'This is a test post content',
    slug: 'test-post-title',
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
    helpful_count: 3,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    author: {
      id: 'user-1',
      email: 'test@example.com'
    }
  }

  it('should render post information correctly', () => {
    render(
      <PostCard
        post={mockPost}
        communityId="community-1"
        communitySlug="test-community"
      />
    )

    expect(screen.getByText('Test Post Title')).toBeTruthy()
    expect(screen.getByText('This is a test post content')).toBeTruthy()
    expect(screen.getByText('Discussion')).toBeTruthy()
    expect(screen.getByText('active')).toBeTruthy()
    expect(screen.getByText('10')).toBeTruthy() // view count
    expect(screen.getByText('5')).toBeTruthy() // comment count
    expect(screen.getByText('3')).toBeTruthy() // helpful count
  })

  it('should use slug-based navigation when communitySlug is provided', () => {
    render(
      <PostCard
        post={mockPost}
        communityId="community-1"
        communitySlug="test-community"
      />
    )

    const postCard = screen.getByText('Test Post Title').closest('div')
    fireEvent.click(postCard!)

    expect(mockNavigateToPost).toHaveBeenCalledWith(
      'test-community',
      'test-post-title',
      expect.objectContaining({
        communityName: 'Test Community',
        postTitle: 'Test Post Title',
        previousRoute: '/community/c/test-community',
        postId: 'post-1',
        communityId: 'community-1'
      })
    )
  })

  it('should not navigate when only communityId is provided (requires slug-based routing)', () => {
    render(
      <PostCard
        post={mockPost}
        communityId="community-1"
      />
    )

    const postCard = screen.getByText('Test Post Title').closest('div')
    fireEvent.click(postCard!)

    // Should not call navigateToPost since slug-based routing is required
    expect(mockNavigateToPost).not.toHaveBeenCalled()
  })

  it('should generate slug from title when post slug is not available', () => {
    const postWithoutSlug = { ...mockPost, slug: null }
    
    render(
      <PostCard
        post={postWithoutSlug}
        communityId="community-1"
        communitySlug="test-community"
      />
    )

    const postCard = screen.getByText('Test Post Title').closest('div')
    fireEvent.click(postCard!)

    expect(mockNavigateToPost).toHaveBeenCalledWith(
      'test-community',
      'test-post-title', // Generated from title
      expect.objectContaining({
        communityName: 'Test Community',
        postTitle: 'Test Post Title',
        previousRoute: '/community/c/test-community',
        postId: 'post-1',
        communityId: 'community-1'
      })
    )
  })

  it('should call onView callback when provided instead of navigation', () => {
    const mockOnView = vi.fn()
    
    render(
      <PostCard
        post={mockPost}
        communityId="community-1"
        communitySlug="test-community"
        onView={mockOnView}
      />
    )

    const postCard = screen.getByText('Test Post Title').closest('div')
    fireEvent.click(postCard!)

    expect(mockOnView).toHaveBeenCalledWith('post-1')
    expect(mockNavigateToPost).not.toHaveBeenCalled()
  })
})