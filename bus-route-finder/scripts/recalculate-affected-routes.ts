#!/usr/bin/env tsx

/**
 * Script to recalculate distances for routes affected by the Madhya Badda coordinate fix
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
const DELAY_BETWEEN_REQUESTS = 500

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

async function recalculateAffectedRoutes() {
  console.log('🔄 Recalculating routes affected by Madhya Badda coordinate fix...')
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing environment variables')
    return
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const osrmStrategy = new OSRMStrategy(OSRM_PUBLIC_API)
  const distanceCalculator = new DistanceCalculator(osrmStrategy, osrmStrategy)

  try {
    // Find all routes that include Madhya Badda
    console.log('🔍 Finding routes that include Madhya Badda...')
    const { data: madhyaBaddaRoutes, error: routesError } = await supabase
      .from('route_stops')
      .select(`
        bus_id,
        direction,
        buses!inner(name)
      `)
      .eq('stops.name', 'Madhya Badda')
      .eq('stops.name', 'Madhya Badda')

    if (routesError) {
      throw new Error(`Failed to find affected routes: ${routesError.message}`)
    }

    // Get unique bus routes
    const uniqueRoutes = new Map<string, { bus_id: string, direction: string, bus_name: string }>()
    
    // Find routes with Madhya Badda by querying differently
    const { data: madhyaBaddaStops, error: stopsError } = await supabase
      .from('stops')
      .select('id')
      .eq('name', 'Madhya Badda')
      .single()

    if (stopsError || !madhyaBaddaStops) {
      throw new Error('Could not find Madhya Badda stop')
    }

    const { data: affectedRoutes, error: affectedError } = await supabase
      .from('route_stops')
      .select(`
        bus_id,
        direction,
        buses!inner(name)
      `)
      .eq('stop_id', madhyaBaddaStops.id)

    if (affectedError) {
      throw new Error(`Failed to find affected routes: ${affectedError.message}`)
    }

    if (!affectedRoutes || affectedRoutes.length === 0) {
      console.log('❌ No affected routes found')
      return
    }

    // Create unique route map
    affectedRoutes.forEach(route => {
      const key = `${route.bus_id}-${route.direction}`
      if (!uniqueRoutes.has(key)) {
        uniqueRoutes.set(key, {
          bus_id: route.bus_id,
          direction: route.direction,
          bus_name: route.buses.name
        })
      }
    })

    console.log(`📊 Found ${uniqueRoutes.size} unique routes to recalculate:`)
    uniqueRoutes.forEach(route => {
      console.log(`   - ${route.bus_name} (${route.direction})`)
    })

    let totalUpdated = 0
    let totalErrors = 0

    // Process each affected route
    for (const [routeKey, route] of uniqueRoutes) {
      console.log(`\n🚌 Processing: ${route.bus_name} (${route.direction})`)

      // Get all segments for this route
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
        .eq('bus_id', route.bus_id)
        .eq('direction', route.direction)
        .order('stop_order')

      if (segmentsError) {
        console.error(`   ❌ Failed to get segments: ${segmentsError.message}`)
        continue
      }

      if (!segments || segments.length === 0) {
        console.log(`   ⚠️  No segments found`)
        continue
      }

      console.log(`   📍 Found ${segments.length} segments`)

      const updates: Array<{ id: string; distance: number }> = []

      // Process each segment that needs recalculation
      for (let i = 0; i < segments.length - 1; i++) {
        const segment = segments[i] as RouteSegment
        const nextSegment = segments[i + 1] as RouteSegment

        // Only recalculate segments involving Madhya Badda or segments with null values
        const shouldRecalculate = 
          segment.stops.name === 'Madhya Badda' || 
          nextSegment.stops.name === 'Madhya Badda' ||
          segment.distance_to_next === null

        if (!shouldRecalculate) {
          continue
        }

        console.log(`   🔄 Recalculating: ${segment.stops.name} → ${nextSegment.stops.name}`)

        try {
          // Add delay between requests
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS))

          // Calculate distance using OSRM
          const distances = await distanceCalculator.calculateDistances(
            [{ lat: segment.stops.latitude, lng: segment.stops.longitude }],
            [{ lat: nextSegment.stops.latitude, lng: nextSegment.stops.longitude }]
          )

          const calculatedDistance = distances[0][0].distance
          const method = distances[0][0].method

          if (method !== 'OSRM') {
            console.warn(`   ⚠️  Skipping: Got ${method} instead of OSRM`)
            totalErrors++
            continue
          }

          updates.push({
            id: segment.id,
            distance: calculatedDistance
          })

          console.log(`   ✅ ${segment.stops.name} → ${nextSegment.stops.name}: ${calculatedDistance.toFixed(3)} km`)

        } catch (error) {
          totalErrors++
          console.error(`   ❌ Failed to calculate:`, error instanceof Error ? error.message : String(error))
        }
      }

      // Update database
      if (updates.length > 0) {
        console.log(`   💾 Updating ${updates.length} segments...`)
        
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
          console.error(`   ❌ Database update failed:`, error instanceof Error ? error.message : String(error))
        }
      } else {
        console.log(`   ⚠️  No segments needed recalculation`)
      }
    }

    // Summary
    console.log('\n📊 Recalculation Summary:')
    console.log(`   Routes processed: ${uniqueRoutes.size}`)
    console.log(`   Segments updated: ${totalUpdated}`)
    console.log(`   Errors: ${totalErrors}`)

    if (totalUpdated > 0) {
      console.log('\n✅ Recalculation completed successfully!')
      console.log('   Routes affected by Madhya Badda coordinate fix have been updated.')
    }

  } catch (error) {
    console.error('❌ Recalculation failed:', error instanceof Error ? error.message : String(error))
  }
}

recalculateAffectedRoutes().catch(console.error)