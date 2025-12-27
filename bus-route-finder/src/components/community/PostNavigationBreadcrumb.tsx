import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { communityStore } from "@/lib/stores/communityStore"

interface PostNavigationBreadcrumbProps {
  communityId?: string
  communitySlug?: string
  postTitle?: string
  className?: string
}

export function PostNavigationBreadcrumb({
  communityId,
  communitySlug,
  postTitle,
  className
}: PostNavigationBreadcrumbProps) {
  const router = useRouter()
  const [state, setState] = React.useState(communityStore.getState())

  React.useEffect(() => {
    const observer = {
      update: (newState: typeof state) => setState(newState)
    }
    communityStore.subscribe(observer)
    return () => communityStore.unsubscribe(observer)
  }, [])

  // Generate breadcrumbs based on routing type
  const breadcrumbs = React.useMemo(() => {
    if (communitySlug) {
      // Slug-based breadcrumbs
      const crumbs = []
      
      // Add community breadcrumb
      if (state.selectedCommunity) {
        crumbs.push({
          label: state.selectedCommunity.name,
          href: `/community/c/${communitySlug}`,
          isActive: false
        })
      }
      
      // Add post breadcrumb if viewing post detail
      if (postTitle) {
        crumbs.push({
          label: postTitle,
          href: '#', // Current page
          isActive: true
        })
      }
      
      return crumbs
    } else if (communityId && state.selectedCommunity) {
      // Generate slug-based breadcrumbs from community data
      const communitySlug = state.selectedCommunity.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim()
      
      const crumbs = []
      
      // Add community breadcrumb
      crumbs.push({
        label: state.selectedCommunity.name,
        href: `/community/c/${communitySlug}`,
        isActive: false
      })
      
      // Add post breadcrumb if viewing post detail
      if (postTitle) {
        crumbs.push({
          label: postTitle,
          href: '#', // Current page
          isActive: true
        })
      }
      
      return crumbs
    } else {
      // Fallback to store breadcrumbs (should be slug-based)
      return communityStore.getPostNavigationBreadcrumbs()
    }
  }, [communitySlug, state.selectedCommunity, postTitle])
  
  const recentHistory = communityStore.getRecentPostHistory(3)

  const handleBackNavigation = () => {
    // Always use slug-based routing (Requirements 4.2, 4.3)
    if (communitySlug) {
      router.push(`/community/c/${communitySlug}`)
    } else if (communityId && state.selectedCommunity) {
      // Generate slug from community name
      const generatedSlug = state.selectedCommunity.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim()
      router.push(`/community/c/${generatedSlug}`)
    } else {
      // Use store's back navigation which now returns slug-based URLs
      const backRoute = communityStore.navigateBackFromPost()
      router.push(backRoute)
    }
  }

  return (
    <div className={className}>
      {/* Main navigation */}
      <div className="flex items-center gap-4 mb-4">
        <Button onClick={handleBackNavigation} variant="outline" size="sm">
          <svg className="size-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Button>

        {/* Breadcrumb trail */}
        <nav className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <svg className="size-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
              {crumb.isActive ? (
                <span className="text-muted-foreground font-medium">
                  {crumb.label.length > 40 ? `${crumb.label.substring(0, 40)}...` : crumb.label}
                </span>
              ) : (
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-medium text-primary hover:text-primary/80"
                  onClick={() => router.push(crumb.href)}
                >
                  {crumb.label}
                </Button>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Recent navigation history (if available) */}
      {recentHistory.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Recent:</span>
          <div className="flex items-center gap-2">
            {recentHistory.slice(0, 2).map((item, index) => (
              <React.Fragment key={`${item.postId}-${index}`}>
                {index > 0 && <span>•</span>}
                <Button
                  variant="link"
                  className="p-0 h-auto text-xs text-muted-foreground hover:text-primary"
                  onClick={() => router.push(item.href)}
                >
                  {item.postTitle.length > 20 ? `${item.postTitle.substring(0, 20)}...` : item.postTitle}
                </Button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}