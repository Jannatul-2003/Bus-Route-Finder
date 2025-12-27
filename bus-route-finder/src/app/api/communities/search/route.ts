import { NextRequest, NextResponse } from 'next/server'
import { communityService } from '@/lib/services/CommunityService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    const latitude = searchParams.get('latitude')
    const longitude = searchParams.get('longitude')
    const radius = searchParams.get('radius')

    if (!name && (!latitude || !longitude)) {
      return NextResponse.json(
        { error: 'Either name or location (latitude, longitude) is required' },
        { status: 400 }
      )
    }

    let communities: any[] = []

    if (name) {
      // Search by name
      communities = await communityService.searchCommunitiesByName(name)
    } else if (latitude && longitude) {
      // Search by location
      const lat = parseFloat(latitude)
      const lng = parseFloat(longitude)
      const searchRadius = radius ? parseInt(radius) : 5000

      if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json(
          { error: 'Invalid latitude or longitude' },
          { status: 400 }
        )
      }

      communities = await communityService.getNearbyCommunities(lat, lng, searchRadius)
    }

    return NextResponse.json(communities)
  } catch (error) {
    console.error('Error searching communities:', error)
    return NextResponse.json(
      { error: 'Failed to search communities' },
      { status: 500 }
    )
  }
}