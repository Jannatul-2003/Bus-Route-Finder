import { NextRequest, NextResponse } from 'next/server'
import { communityService } from '@/lib/services/CommunityService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')

    if (!name) {
      return NextResponse.json(
        { error: 'Bus name is required' },
        { status: 400 }
      )
    }

    const busId = await communityService.getBusIdByName(name)
    
    if (!busId) {
      return NextResponse.json(
        { error: 'Bus not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      id: busId,
      name: name
    })
  } catch (error) {
    console.error('Error searching for bus:', error)
    return NextResponse.json(
      { error: 'Failed to search for bus' },
      { status: 500 }
    )
  }
}