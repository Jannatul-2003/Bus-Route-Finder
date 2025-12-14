import { useRouter } from "next/navigation"
import { communityStore } from "@/lib/stores/communityStore"
import { generatePostSlug, validateSlug, generateCommunitySlug } from "@/lib/utils/slugs"

/**
 * Hook for managing post navigation state and routing
 * Requirements: 1.1, 1.2, 1.3, 1.5 - Enhanced post navigation with slug-based routing
 */
export function usePostNavigation() {
  const router = useRouter()

  const navigateToPost = (
    communitySlug: string,
    postSlug: string,
    options?: {
      communityName?: string
      postTitle?: string
      previousRoute?: string
      postId?: string
      communityId?: string
    }
  ) => {
    // Always use slug-based navigation (Requirements 1.1, 1.2)
    // Validate slugs to ensure proper format
    if (!validateSlug(communitySlug) || !validateSlug(postSlug)) {
      console.error('Invalid slug format provided to navigateToPost')
      return
    }
    
    // Update store state with slug-based navigation
    communityStore.navigateToPost(
      options?.communityId || communitySlug, 
      options?.postId || postSlug, 
      {
        ...options,
        isSlugBased: true,
        communitySlug,
        postSlug
      }
    )
    
    // Navigate to slug-based post detail page (Requirements 1.2)
    router.push(`/community/c/${communitySlug}/post/p/${postSlug}`)
  }

  const navigateBackFromPost = () => {
    // Ensure back navigation maintains slug-based URLs (Requirements 1.3)
    const backRoute = communityStore.navigateBackFromPost()
    router.push(backRoute)
  }

  const navigateToCommunity = (communitySlug: string) => {
    // Always use slug-based community navigation (Requirements 1.1, 1.5)
    if (!validateSlug(communitySlug)) {
      console.error('Invalid community slug provided to navigateToCommunity')
      return
    }
    router.push(`/community/c/${communitySlug}`)
  }

  const navigateToPostCreation = (communitySlug: string) => {
    // Always use slug-based post creation (Requirements 1.4, 1.5)
    if (!validateSlug(communitySlug)) {
      console.error('Invalid community slug provided to navigateToPostCreation')
      return
    }
    router.push(`/community/c/${communitySlug}/create-post`)
  }

  const generatePostUrl = (communitySlug: string, postSlug: string): string => {
    // Generate slug-based post URLs (Requirements 1.2, 1.5)
    if (!validateSlug(communitySlug) || !validateSlug(postSlug)) {
      console.error('Invalid slugs provided to generatePostUrl')
      return '#'
    }
    return `/community/c/${communitySlug}/post/p/${postSlug}`
  }

  const generateCreatePostUrl = (communitySlug: string): string => {
    // Generate slug-based post creation URLs (Requirements 1.4, 1.5)
    if (!validateSlug(communitySlug)) {
      console.error('Invalid community slug provided to generateCreatePostUrl')
      return '#'
    }
    return `/community/c/${communitySlug}/create-post`
  }

  const generatePostSlugFromTitle = (postTitle: string): string => {
    // Generate post slug from title with validation
    if (!postTitle || postTitle.trim().length === 0) {
      console.error('Empty or invalid post title provided to generatePostSlugFromTitle')
      return 'untitled-post'
    }
    return generatePostSlug(postTitle)
  }

  const generateCommunitySlugFromName = (communityName: string): string => {
    // Generate community slug from name with validation
    if (!communityName || communityName.trim().length === 0) {
      console.error('Empty or invalid community name provided to generateCommunitySlugFromName')
      return 'untitled-community'
    }
    return generateCommunitySlug(communityName)
  }

  const validateSlugFormat = (slug: string): boolean => {
    // Validate slug format
    return validateSlug(slug)
  }

  const redirectIdToSlug = async (communityId: string, postId?: string): Promise<void> => {
    // Redirect ID-based URLs to slug-based URLs (Requirements 4.4, 4.5)
    try {
      // This would typically involve API calls to resolve IDs to slugs
      // For now, we'll implement a basic redirect mechanism
      console.warn('ID-based URL detected, should redirect to slug-based URL')
      
      // In a real implementation, you would:
      // 1. Fetch community data by ID to get the slug
      // 2. If postId is provided, fetch post data to get the post slug
      // 3. Redirect to the appropriate slug-based URL
      
      // Placeholder implementation - redirect to community list if we can't resolve
      router.push('/community')
    } catch (error) {
      console.error('Failed to redirect ID-based URL to slug-based URL:', error)
      router.push('/community')
    }
  }

  const getBreadcrumbs = () => {
    return communityStore.getPostNavigationBreadcrumbs()
  }

  const getRecentHistory = (limit?: number) => {
    return communityStore.getRecentPostHistory(limit)
  }

  const clearHistory = () => {
    communityStore.clearNavigationHistory()
  }

  return {
    // Navigation functions - all use slug-based routing
    navigateToPost,
    navigateBackFromPost,
    navigateToCommunity,
    navigateToPostCreation,
    
    // URL generation functions - all generate slug-based URLs
    generatePostUrl,
    generateCreatePostUrl,
    
    // Slug generation and validation functions
    generatePostSlugFromTitle,
    generateCommunitySlugFromName,
    validateSlugFormat,
    
    // Legacy support
    redirectIdToSlug,
    
    // Navigation state functions
    getBreadcrumbs,
    getRecentHistory,
    clearHistory
  }
}