#!/usr/bin/env tsx

/**
 * Test script to debug journey length calculation for specific routes
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { BusRouteService } from '../src/lib/services/BusRouteService'
import { DistanceCalculator } from '../src/lib/strategies/DistanceCalculator'
import { OSRMStrategy } from '../src/lib/strategies/OSRMStrategy'

// Load environment variables from .env.local
config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const OSRM_PUBLIC_API = 'https://router.project-osrm.org'

async function testJourneyCalculation() {
  console.log('🧪 Testing journey length calculation for specific routes...')
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing environment variables')
    return
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const osrmStrategy = new OSRMStrategy(OSRM_PUBLIC_API)
  const distanceCalculator = new DistanceCalculator(osrmStrategy, osrmStrategy)
  const busRouteService = new BusRouteService(supabase, distanceCalculator)

  try {
    // Find Rajdhani and Rois buses
    console.log('🔍 Finding Rajdhani and Rois buses...')
    const { data: buses, error: busError } = await supabase
      .from('buses')
      .select('id, name')
      .or('name.ilike.%rajdhani%,name.ilike.%rois%')

    if (busError) {
      throw new Error(`Failed to find buses: ${busError.message}`)
    }

    if (!buses || buses.length === 0) {
      console.log('❌ No Rajdhani or Rois buses found')
      return
    }

    console.log(`✅ Found ${buses.length} buses:`)
    buses.forEach(bus => console.log(`   - ${bus.name} (${bus.id})`))

    // Find Badda and Banasree stops for each bus
    for (const bus of buses) {
      console.log(`\n🚌 Testing bus: ${bus.name}`)
      
      // Get all stops for this bus
      const { data: stops, error: stopsError } = await supabase
        .from('route_stops')
        .select(`
          stop_order,
          direction,
          distance_to_next,
          stops!inner(name, latitude, longitude)
        `)
        .eq('bus_id', bus.id)
        .order('direction')
        .order('stop_order')

      if (stopsError) {
        console.error(`❌ Failed to get stops for ${bus.name}:`, stopsError.message)
        continue
      }

      if (!stops || stops.length === 0) {
        console.log(`   ⚠️  No stops found for ${bus.name}`)
        continue
      }

      // Find Badda and Banasree stops
      const baddaStops = stops.filter(s => 
        s.stops.name.toLowerCase().includes('badda') && 
        !s.stops.name.toLowerCase().includes('uttar') &&
        !s.stops.name.toLowerCase().includes('madhya')
      )
      const banasreeStops = stops.filter(s => 
        s.stops.name.toLowerCase().includes('banasree')
      )

      console.log(`   📍 Found ${baddaStops.length} Badda stops, ${banasreeStops.length} Banasree stops`)

      // Test journey calculations between Badda and Banasree
      for (const direction of ['outbound', 'inbound']) {
        const directionBadda = baddaStops.filter(s => s.direction === direction)
        const directionBanasree = banasreeStops.filter(s => s.direction === direction)

        if (directionBadda.length > 0 && directionBanasree.length > 0) {
          const badda = directionBadda[0]
          const banasree = directionBanasree[0]

          console.log(`\n   🧭 ${direction.toUpperCase()} direction:`)
          console.log(`      Badda: ${badda.stops.name} (stop ${badda.stop_order})`)
          console.log(`      Banasree: ${banasree.stops.name} (stop ${banasree.stop_order})`)

          try {
            // Calculate journey length using the service
            const journeyLength = await busRouteService.calculateJourneyLength(
              bus.id,
              Math.min(badda.stop_order, banasree.stop_order),
              Math.max(badda.stop_order, banasree.stop_order),
              direction as 'outbound' | 'inbound'
            )

            console.log(`      📏 Journey length: ${journeyLength.toFixed(3)} km`)

            // Also show the individual segments
            const { data: segments, error: segmentsError } = await supabase
              .from('route_stops')
              .select('stop_order, distance_to_next, stops!inner(name)')
              .eq('bus_id', bus.id)
              .eq('direction', direction)
              .gte('stop_order', Math.min(badda.stop_order, banasree.stop_order))
              .lt('stop_order', Math.max(badda.stop_order, banasree.stop_order))
              .order('stop_order')

            if (!segmentsError && segments) {
              console.log(`      📊 Individual segments:`)
              let totalCheck = 0
              segments.forEach(segment => {
                console.log(`         ${segment.stops.name} → next: ${segment.distance_to_next} km`)
                if (segment.distance_to_next) {
                  totalCheck += segment.distance_to_next
                }
              })
              console.log(`      ✅ Manual total: ${totalCheck.toFixed(3)} km`)
            }

          } catch (error) {
            console.error(`      ❌ Journey calculation failed:`, error instanceof Error ? error.message : String(error))
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : String(error))
  }
}

testJourneyCalculation().catch(console.error)