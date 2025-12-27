#!/usr/bin/env tsx

/**
 * Script to fix the remaining segments with incorrect distances
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { OSRMStrategy } from '../src/lib/strategies/OSRMStrategy'

// Load environment variables from .env.local
config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const OSRM_PUBLIC_API = 'https://router.project-osrm.org'

async function fixRemainingSegments() {
  console.log('🔧 Fixing remaining segments with incorrect distances...')
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing environment variables')
    return
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const osrmStrategy = new OSRMStrategy(OSRM_PUBLIC_API)

  try {
    // Find segments with suspiciously high distances (> 10 km)
    console.log('🔍 Finding segments with suspiciously high distances...')
    const { data: suspiciousSegments, error: segmentsError } = await supabase
      .from('route_stops')
      .select(`
        id,
        bus_id,
        stop_order,
        direction,
        distance_to_next,
        stops!inner(name, latitude, longitude),
        buses!inner(name)
      `)
      .gt('distance_to_next', 10)
      .order('distance_to_next', { ascending: false })

    if (segmentsError) {
      throw new Error(`Failed to find suspicious segments: ${segmentsError.message}`)
    }

    if (!suspiciousSegments || suspiciousSegments.length === 0) {
      console.log('✅ No suspicious segments found')
      return
    }

    console.log(`📊 Found ${suspiciousSegments.length} segments with distance > 10 km:`)
    suspiciousSegments.forEach(segment => {
      console.log(`   - ${segment.buses.name}: ${segment.stops.name} (${segment.distance_to_next} km)`)
    })

    // Focus on the most problematic ones (> 15 km)
    const veryProblematic = suspiciousSegments.filter(s => s.distance_to_next > 15)
    
    console.log(`\n🎯 Fixing ${veryProblematic.length} segments with distance > 15 km...`)

    let totalFixed = 0

    for (const segment of veryProblematic) {
      console.log(`\n🔄 Processing: ${segment.buses.name} - ${segment.stops.name}`)
      console.log(`   Current distance: ${segment.distance_to_next} km`)

      // Find the next segment in the route
      const { data: nextSegments, error: nextError } = await supabase
        .from('route_stops')
        .select(`
          stops!inner(name, latitude, longitude)
        `)
        .eq('bus_id', segment.bus_id)
        .eq('direction', segment.direction)
        .eq('stop_order', segment.stop_order + 1)
        .single()

      if (nextError || !nextSegments) {
        console.log(`   ⚠️  Could not find next segment`)
        continue
      }

      console.log(`   Next stop: ${nextSegments.stops.name}`)

      try {
        // Calculate correct distance
        const distances = await osrmStrategy.calculateDistances(
          [{ lat: segment.stops.latitude, lng: segment.stops.longitude }],
          [{ lat: nextSegments.stops.latitude, lng: nextSegments.stops.longitude }]
        )

        const correctDistance = distances[0][0].distance
        const method = distances[0][0].method

        if (method !== 'OSRM') {
          console.log(`   ⚠️  Skipping: Got ${method} instead of OSRM`)
          continue
        }

        console.log(`   ✅ Correct distance: ${correctDistance.toFixed(3)} km`)

        // Update the database
        const { error: updateError } = await supabase
          .from('route_stops')
          .update({ distance_to_next: correctDistance })
          .eq('id', segment.id)

        if (updateError) {
          console.error(`   ❌ Update failed:`, updateError.message)
        } else {
          console.log(`   💾 Updated successfully`)
          totalFixed++
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        console.error(`   ❌ Calculation failed:`, error instanceof Error ? error.message : String(error))
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   Segments processed: ${veryProblematic.length}`)
    console.log(`   Successfully fixed: ${totalFixed}`)

    if (totalFixed > 0) {
      console.log('\n✅ Fix completed! Test the journey calculation again.')
    }

  } catch (error) {
    console.error('❌ Fix failed:', error instanceof Error ? error.message : String(error))
  }
}

fixRemainingSegments().catch(console.error)