import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { handleLegacyUrlRedirect } from '@/lib/utils/legacyRedirect'

/**
 * Hook to handle legacy URL redirection in components
 * This provides a client-side fallback for any legacy URLs that might not be caught by middleware
 */
export function useLegacyRedirect() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        const wasRedirected = await handleLegacyUrlRedirect(pathname, router)
        if (wasRedirected) {
          console.log('Redirected legacy URL:', pathname)
        }
      } catch (error) {
        console.error('Error handling legacy URL redirect:', error)
      }
    }

    checkAndRedirect()
  }, [pathname, router])

  return {
    // Utility function that components can call manually if needed
    redirectLegacyUrl: (url: string) => handleLegacyUrlRedirect(url, router)
  }
}

/**
 * Hook specifically for community pages to handle legacy community ID URLs
 */
export function useCommunityLegacyRedirect(communityId?: string) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // If we have a community ID in the URL path and it looks like a UUID, redirect
    if (communityId && pathname.includes(communityId)) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (uuidRegex.test(communityId)) {
        handleLegacyUrlRedirect(pathname, router).catch(error => {
          console.error('Error redirecting legacy community URL:', error)
        })
      }
    }
  }, [communityId, pathname, router])
}

/**
 * Hook specifically for post pages to handle legacy post ID URLs
 */
export function usePostLegacyRedirect(communityId?: string, postId?: string) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // If we have both IDs in the URL path and they look like UUIDs, redirect
    if (communityId && postId && pathname.includes(communityId) && pathname.includes(postId)) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (uuidRegex.test(communityId) && uuidRegex.test(postId)) {
        handleLegacyUrlRedirect(pathname, router).catch(error => {
          console.error('Error redirecting legacy post URL:', error)
        })
      }
    }
  }, [communityId, postId, pathname, router])
}