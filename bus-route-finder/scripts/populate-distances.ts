#!/usr/bin/env tsx

/**
 * Script to populate missing distance_to_next values in the route_stops table
 * using OSRM public API for accurate road-based distance calculations.
 * 
 * This will fix the inconsistent distance calculations between different bus routes.
 * 
 * Usage:
 *   npm run populate-distances
 *   or
 *   npx tsx scripts/populate-distances.ts
 */

import { createClient } from '@supabase/supabase-js'
import { DistanceCalculator } from '../src/lib/strategies/DistanceCalculator'
import { OSRMStrategy } from '../src/lib/strategies/OSRMStrategy'
import { config } from 'dotenv';
config({ path: '.env.local' });


// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const OSRM_PUBLIC_API = 'https://router.project-osrm.org' // Public OSRM API
const BATCH_SIZE = 10 // Smaller batches for public API to avoid rate limiting
const DELAY_BETWEEN_BATCHES = 2000 // 2 second delay between batches for public API
const DELAY_BETWEEN_REQUESTS = 500 // 500ms delay between individual requests

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

interface BusInfo {
  id: string
  name: string
}

async function main() {
  console.log('🚌 Starting distance population script using OSRM Public API...')
  
  // Validate environment variables
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing required environment variables:')
    console.error('   NEXT_PUBLIC_SUPABASE_URL')
    console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY')
    process.exit(1)
  }

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  // Initialize distance calculator with OSRM public API (no fallback)
  const osrmStrategy = new OSRMStrategy(OSRM_PUBLIC_API)
  const distanceCalculator = new DistanceCalculator(osrmStrategy, osrmStrategy) // Use OSRM for both primary and fallback

  try {
    // Check OSRM public API availability
    console.log('🔍 Checking OSRM Public API availability...')
    const isOSRMAvailable = await osrmStrategy.isAvailable()
    if (!isOSRMAvailable) {
      console.error('❌ OSRM Public API is not available.')
      console.error('   Please check your internet connection and try again.')
      console.error('   Public API URL:', OSRM_PUBLIC_API)
      process.exit(1)
    } else {
      console.log('✅ OSRM Public API is available and ready')
      console.log('🌐 Using public API:', OSRM_PUBLIC_API)
    }

    // Get all route segments with missing distances
    console.log('📊 Fetching route segments with missing distances...')
    const { data: segments, error: segmentsError } = await supabase
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
      .is('distance_to_next', null)
      .order('bus_id')
      .order('direction')
      .order('stop_order')

    if (segmentsError) {
      throw new Error(`Failed to fetch route segments: ${segmentsError.message}`)
    }

    if (!segments || segments.length === 0) {
      console.log('✅ No missing distances found. All route segments already have distance_to_next values.')
      return
    }

    console.log(`📈 Found ${segments.length} route segments with missing distances`)

    // Get bus information for better logging
    const { data: buses, error: busesError } = await supabase
      .from('buses')
      .select('id, name')

    if (busesError) {
      console.warn('⚠️  Could not fetch bus names:', busesError.message)
    }

    const busMap = new Map<string, string>()
    buses?.forEach(bus => busMap.set(bus.id, bus.name))

    // Group segments by bus and direction for better processing
    const segmentsByRoute = new Map<string, RouteSegment[]>()
    segments.forEach(segment => {
      const routeKey = `${segment.bus_id}-${segment.direction}`
      if (!segmentsByRoute.has(routeKey)) {
        segmentsByRoute.set(routeKey, [])
      }
      segmentsByRoute.get(routeKey)!.push(segment as unknown as RouteSegment)
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

      // Sort segments by stop_order to ensure correct sequence
      routeSegments.sort((a, b) => a.stop_order - b.stop_order)

      // Process segments in batches
      for (let i = 0; i < routeSegments.length; i += BATCH_SIZE) {
        const batch = routeSegments.slice(i, i + BATCH_SIZE)
        
        console.log(`   📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(routeSegments.length / BATCH_SIZE)} (${batch.length} segments)`)

        const updates: Array<{ id: string; distance: number }> = []

        // Calculate distances for this batch
        for (let j = 0; j < batch.length; j++) {
          const segment = batch[j]
          totalProcessed++

          // Find the next segment to calculate distance to
          const nextSegment = routeSegments.find(s => s.stop_order === segment.stop_order + 1)
          
          if (!nextSegment) {
            console.log(`   ⏭️  Skipping segment ${segment.stop_order} (last stop in route)`)
            continue
          }

          try {
            // Add delay between requests to respect public API rate limits
            if (j > 0) {
              await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS))
            }

            console.log(`   🔄 Calculating: ${segment.stops.name} → ${nextSegment.stops.name}`)
            console.log(`      Coordinates: [${segment.stops.latitude}, ${segment.stops.longitude}] → [${nextSegment.stops.latitude}, ${nextSegment.stops.longitude}]`)

            // Calculate distance using OSRM public API
            const distances = await distanceCalculator.calculateDistances(
              [{ lat: segment.stops.latitude, lng: segment.stops.longitude }],
              [{ lat: nextSegment.stops.latitude, lng: nextSegment.stops.longitude }]
            )

            const calculatedDistance = distances[0][0].distance
            const method = distances[0][0].method

            console.log(`      Result: ${calculatedDistance.toFixed(3)} km using ${method}`)

            // Only accept OSRM results (reject Haversine fallback)
            if (method !== 'OSRM') {
              console.warn(`   ⚠️  Skipping segment ${segment.stop_order}: Got ${method} instead of OSRM`)
              totalErrors++
              continue
            }

            updates.push({
              id: segment.id,
              distance: calculatedDistance
            })

            console.log(`   ✅ ${segment.stops.name} → ${nextSegment.stops.name}: ${calculatedDistance.toFixed(3)} km (OSRM)`)

          } catch (error) {
            totalErrors++
            console.error(`   ❌ Failed to calculate distance for segment ${segment.stop_order}:`)
            console.error(`      Error: ${error instanceof Error ? error.message : String(error)}`)
            console.error(`      From: ${segment.stops.name} [${segment.stops.latitude}, ${segment.stops.longitude}]`)
            console.error(`      To: ${nextSegment?.stops.name} [${nextSegment?.stops.latitude}, ${nextSegment?.stops.longitude}]`)
            
            // Add extra delay after errors to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS * 2))
          }
        }

        // Batch update the database
        if (updates.length > 0) {
          try {
            console.log(`   💾 Updating ${updates.length} segments in database...`)
            
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
            console.log(`   ✅ Successfully updated ${updates.length} segments in database`)

          } catch (error) {
            totalErrors += updates.length
            console.error(`   ❌ Failed to update batch in database:`)
            console.error(`      Error: ${error instanceof Error ? error.message : String(error)}`)
            console.error(`      Attempted to update ${updates.length} segments`)
            console.error(`      Update data:`, updates.map(u => ({ id: u.id, distance: u.distance.toFixed(3) })))
          }
        } else {
          console.log(`   ⚠️  No valid updates to save for this batch`)
        }

        // Delay between batches to respect public API rate limits
        if (i + BATCH_SIZE < routeSegments.length) {
          console.log(`   ⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch (respecting API rate limits)...`)
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
        }
      }
    }

    // Summary
    console.log('\n📊 Summary:')
    console.log(`   Total segments processed: ${totalProcessed}`)
    console.log(`   Successfully updated: ${totalUpdated}`)
    console.log(`   Errors: ${totalErrors}`)
    
    if (totalUpdated > 0) {
      console.log('\n✅ Distance population completed successfully using OSRM Public API!')
      console.log('   Your bus route distances are now accurate and consistent.')
      console.log('   All distances calculated using real road networks.')
    } else {
      console.log('\n⚠️  No distances were updated. Check for errors above.')
      console.log('   This might be due to API rate limiting or network issues.')
    }

  } catch (error) {
    console.error('\n❌ Script failed:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error)
    process.exit(1)
  })
}