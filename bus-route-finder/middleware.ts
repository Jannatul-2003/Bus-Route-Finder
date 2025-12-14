import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // UUID regex pattern for validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  // Handle legacy community ID-based URLs
  const communityIdMatch = pathname.match(/^\/community\/([0-9a-f-]{36})(?:\/(.*))?$/i)
  if (communityIdMatch) {
    const [, communityId, subPath] = communityIdMatch
    
    // Only redirect if it's actually a UUID (not a slug)
    if (uuidRegex.test(communityId)) {
      // Redirect to a special resolution endpoint that will handle the ID-to-slug conversion
      const redirectUrl = new URL(`/api/redirect/community/${communityId}`, request.url)
      if (subPath) {
        redirectUrl.searchParams.set('subPath', subPath)
      }
      redirectUrl.searchParams.set('originalUrl', pathname)
      
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Handle legacy post ID-based URLs within communities
  const postIdMatch = pathname.match(/^\/community\/([0-9a-f-]{36})\/post\/([0-9a-f-]{36})$/i)
  if (postIdMatch) {
    const [, communityId, postId] = postIdMatch
    
    // Only redirect if both are actually UUIDs
    if (uuidRegex.test(communityId) && uuidRegex.test(postId)) {
      // Redirect to a special resolution endpoint that will handle the ID-to-slug conversion
      const redirectUrl = new URL(`/api/redirect/post/${communityId}/${postId}`, request.url)
      redirectUrl.searchParams.set('originalUrl', pathname)
      
      return NextResponse.redirect(redirectUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match community routes (both ID and slug based, we'll filter in the middleware)
    '/community/:path*',
  ],
}