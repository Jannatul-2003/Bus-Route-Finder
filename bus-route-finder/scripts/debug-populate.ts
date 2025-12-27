#!/usr/bin/env tsx

/**
 * Debug version of populate-distances script with detailed logging
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { DistanceCalculator } from '../src/lib/strategies/DistanceCalculator'
import { OSRMStrategy } from '../src/lib/strategies/OSRMStrategy'

// Load environment variables from .env.local
config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const OSRM_PUBLIC_API = 'https://router.project-osrm.org'

interface RouteSegment {
  id: string
  bus_id: string
  stop_id: string
  stop_order: number
  direction: 'outbound' | 'inbound'
  distance_to_next: number | null
  stops: {
    latitude: number
    longitude: number
    name: string
  }
}

async function debugPopulate() {
  console.log('🐛 Debug populate distances script...')
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing environment variables')
    return
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const osrmStrategy = new OSRMStrategy(OSRM_PUBLIC_API)
  const distanceCalculator = new DistanceCalculator(osrmStrategy, osrmStrategy)

  try {
    // Get segments that have a next segment (not the last stop in route)
    console.log('📊 Fetching route segments with their complete routes...')
    
    // First, get a few bus routes that have missing distances
    const { data: routesWithMissing, error: routesError } = await supabase
      .from('route_stops')
      .select('bus_id, direction')
      .is('distance_to_next', null)
      .limit(3)

    if (routesError) {
      throw new Error(`Failed to fetch routes: ${routesError.message}`)
    }

    if (!routesWithMissing || routesWithMissing.length === 0) {
      console.log('✅ No routes with missing distances found.')
      return
    }

    console.log(`📈 Found ${routesWithMissing.length} routes with missing distances`)

    // Now get ALL segments for these routes
    const allSegments: RouteSegment[] = []
    
    for (const route of routesWithMissing) {
      const { data: routeSegments, error: segmentsError } = await supabase
        .from('route_stops')
        .select(`
          id,
          bus_id,
          stop_id,
          stop_order,
          direction,
          distance_to_next,
          stops!inner(latitude, longitude, name)
        `)
        .eq('bus_id', route.bus_id)
        .eq('direction', route.direction)
        .order('stop_order')

      if (segmentsError) {
        console.error(`Failed to fetch segments for route ${route.bus_id}-${route.direction}:`, segmentsError)
        continue
      }

      if (routeSegments) {
        allSegments.push(...(routeSegments as RouteSegment[]))
      }
    }

    const segments = allSegments

    if (!segments || segments.length === 0) {
      console.log('✅ No missing distances found.')
      return
    }

    console.log(`📈 Found ${segments.length} segments to debug`)

    // Get bus names for better logging
    const { data: buses } = await supabase
      .from('buses')
      .select('id, name')

    const busMap = new Map<string, string>()
    buses?.forEach(bus => busMap.set(bus.id, bus.name))

    // Group by route for processing
    const segmentsByRoute = new Map<string, RouteSegment[]>()
    segments.forEach(segment => {
      const routeKey = `${segment.bus_id}-${segment.direction}`
      if (!segmentsByRoute.has(routeKey)) {
        segmentsByRoute.set(routeKey, [])
      }
      segmentsByRoute.get(routeKey)!.push(segment as RouteSegment)
    })

    console.log(`🗺️  Processing ${segmentsByRoute.size} routes`)

    let totalProcessed = 0
    let totalUpdated = 0
    let totalErrors = 0

    // Process each route
    for (const [routeKey, routeSegments] of segmentsByRoute) {
      const [busId, direction] = routeKey.split('-')
      const busName = busMap.get(busId) || busId
      
      console.log(`\n🚌 Processing: ${busName} (${direction})`)
      console.log(`   ${routeSegments.length} segments to process`)

      // Sort segments by stop_order
      routeSegments.sort((a, b) => a.stop_order - b.stop_order)

      const updates: Array<{ id: string; distance: number }> = []

      // Process each segment
      for (const segment of routeSegments) {
        totalProcessed++
        console.log(`\n   📍 Processing segment ${segment.stop_order}: ${segment.stops.name}`)
        console.log(`      Coordinates: [${segment.stops.latitude}, ${segment.stops.longitude}]`)
        console.log(`      Current distance_to_next: ${segment.distance_to_next}`)

        // Skip if already has distance
        if (segment.distance_to_next !== null) {
          console.log(`      ⏭️  Skipping (already has distance: ${segment.distance_to_next})`)
          continue
        }

        // Find next segment
        const nextSegment = routeSegments.find(s => s.stop_order === segment.stop_order + 1)
        
        if (!nextSegment) {
          console.log(`      ⏭️  Skipping (last stop in route)`)
          continue
        }

        console.log(`      Next stop: ${nextSegment.stops.name} [${nextSegment.stops.latitude}, ${nextSegment.stops.longitude}]`)

        try {
          // Calculate distance
          console.log(`      🔄 Calculating distance...`)
          const distances = await distanceCalculator.calculateDistances(
            [{ lat: segment.stops.latitude, lng: segment.stops.longitude }],
            [{ lat: nextSegment.stops.latitude, lng: nextSegment.stops.longitude }]
          )

          const calculatedDistance = distances[0][0].distance
          const method = distances[0][0].method

          console.log(`      ✅ Result: ${calculatedDistance.toFixed(3)} km (${method})`)

          // Check if it's OSRM
          if (method !== 'OSRM') {
            console.warn(`      ⚠️  Skipping: Got ${method} instead of OSRM`)
            totalErrors++
            continue
          }

          updates.push({
            id: segment.id,
            distance: calculatedDistance
          })

          console.log(`      ✅ Added to update queue`)

        } catch (error) {
          totalErrors++
          console.error(`      ❌ Calculation failed:`, error instanceof Error ? error.message : String(error))
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Update database
      if (updates.length > 0) {
        console.log(`\n   💾 Updating ${updates.length} segments in database...`)
        
        try {
          const { error: updateError } = await supabase
            .from('route_stops')
            .upsert(
              updates.map(update => ({
                id: update.id,
                distance_to_next: update.distance
              })),
              { onConflict: 'id' }
            )

          if (updateError) {
            throw updateError
          }

          totalUpdated += updates.length
          console.log(`   ✅ Successfully updated ${updates.length} segments`)

        } catch (error) {
          totalErrors += updates.length
          console.error(`   ❌ Database update failed:`)
          console.error(`      Error message:`, error instanceof Error ? error.message : String(error))
          console.error(`      Full error:`, error)
          console.error(`      Attempted to update ${updates.length} segments`)
          
          // Show first few updates for debugging
          console.error(`      Sample updates:`, updates.slice(0, 3).map(u => ({ 
            id: u.id, 
            distance: u.distance.toFixed(3) 
          })))
        }
      } else {
        console.log(`   ⚠️  No valid updates for this route`)
      }
    }

    // Summary
    console.log('\n📊 Debug Summary:')
    console.log(`   Total segments processed: ${totalProcessed}`)
    console.log(`   Successfully updated: ${totalUpdated}`)
    console.log(`   Errors: ${totalErrors}`)

  } catch (error) {
    console.error('\n❌ Debug script failed:', error instanceof Error ? error.message : String(error))
  }
}

debugPopulate().catch(console.error)