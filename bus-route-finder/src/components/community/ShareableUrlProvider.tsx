import * as React from "react"
import { generateShareableCommunityUrl, generateShareablePostUrl } from "@/lib/utils/legacyRedirect"

interface ShareableUrlContextType {
  getCommunityShareUrl: (communityIdOrSlug: string) => Promise<string>
  getPostShareUrl: (communityIdOrSlug: string, postIdOrSlug: string) => Promise<string>
  copyToClipboard: (url: string) => Promise<boolean>
}

const ShareableUrlContext = React.createContext<ShareableUrlContextType | null>(null)

interface ShareableUrlProviderProps {
  children: React.ReactNode
  baseUrl?: string
}

export function ShareableUrlProvider({ children, baseUrl }: ShareableUrlProviderProps) {
  const getCommunityShareUrl = React.useCallback(async (communityIdOrSlug: string) => {
    return await generateShareableCommunityUrl(communityIdOrSlug, baseUrl)
  }, [baseUrl])

  const getPostShareUrl = React.useCallback(async (
    communityIdOrSlug: string, 
    postIdOrSlug: string
  ) => {
    return await generateShareablePostUrl(communityIdOrSlug, postIdOrSlug, baseUrl)
  }, [baseUrl])

  const copyToClipboard = React.useCallback(async (url: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url)
        return true
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea')
        textArea.value = url
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        const success = document.execCommand('copy')
        textArea.remove()
        return success
      }
    } catch (error) {
      console.error('Failed to copy URL to clipboard:', error)
      return false
    }
  }, [])

  const contextValue = React.useMemo(() => ({
    getCommunityShareUrl,
    getPostShareUrl,
    copyToClipboard
  }), [getCommunityShareUrl, getPostShareUrl, copyToClipboard])

  return (
    <ShareableUrlContext.Provider value={contextValue}>
      {children}
    </ShareableUrlContext.Provider>
  )
}

export function useShareableUrl() {
  const context = React.useContext(ShareableUrlContext)
  if (!context) {
    throw new Error('useShareableUrl must be used within a ShareableUrlProvider')
  }
  return context
}

/**
 * Hook for generating shareable URLs with automatic slug resolution
 */
export function useShareableUrls() {
  const { getCommunityShareUrl, getPostShareUrl, copyToClipboard } = useShareableUrl()
  
  const [isLoading, setIsLoading] = React.useState(false)
  const [lastCopiedUrl, setLastCopiedUrl] = React.useState<string | null>(null)

  const shareCommunity = React.useCallback(async (
    communityIdOrSlug: string,
    options?: { copy?: boolean }
  ) => {
    setIsLoading(true)
    try {
      const url = await getCommunityShareUrl(communityIdOrSlug)
      
      if (options?.copy) {
        const success = await copyToClipboard(url)
        if (success) {
          setLastCopiedUrl(url)
          // Clear the copied URL after 3 seconds
          setTimeout(() => setLastCopiedUrl(null), 3000)
        }
        return { url, copied: success }
      }
      
      return { url, copied: false }
    } finally {
      setIsLoading(false)
    }
  }, [getCommunityShareUrl, copyToClipboard])

  const sharePost = React.useCallback(async (
    communityIdOrSlug: string,
    postIdOrSlug: string,
    options?: { copy?: boolean }
  ) => {
    setIsLoading(true)
    try {
      const url = await getPostShareUrl(communityIdOrSlug, postIdOrSlug)
      
      if (options?.copy) {
        const success = await copyToClipboard(url)
        if (success) {
          setLastCopiedUrl(url)
          // Clear the copied URL after 3 seconds
          setTimeout(() => setLastCopiedUrl(null), 3000)
        }
        return { url, copied: success }
      }
      
      return { url, copied: false }
    } finally {
      setIsLoading(false)
    }
  }, [getPostShareUrl, copyToClipboard])

  return {
    shareCommunity,
    sharePost,
    copyToClipboard,
    isLoading,
    lastCopiedUrl
  }
}