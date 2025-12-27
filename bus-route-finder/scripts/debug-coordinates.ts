#!/usr/bin/env tsx

/**
 * Debug script to check coordinates and distances for Badda area stops
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { OSRMStrategy } from '../src/lib/strategies/OSRMStrategy'

// Load environment variables from .env.local
config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const OSRM_PUBLIC_API = 'https://router.project-osrm.org'

async function debugCoordinates() {
  console.log('🧪 Debugging coordinates for Badda area stops...')
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing environment variables')
    return
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const osrmStrategy = new OSRMStrategy(OSRM_PUBLIC_API)

  try {
    // Get Rajdhani bus stops in the Badda area
    console.log('🔍 Finding Rajdhani bus stops...')
    const { data: rajdhaniStops, error: rajdhaniError } = await supabase
      .from('route_stops')
      .select(`
        stop_order,
        direction,
        distance_to_next,
        buses!inner(name),
        stops!inner(name, latitude, longitude)
      `)
      .eq('buses.name', 'Rajdhani Super Bus Route Dhaka')
      .eq('direction', 'outbound')
      .in('stop_order', [23, 24, 25, 26, 27])
      .order('stop_order')

    if (rajdhaniError) {
      throw new Error(`Failed to get Rajdhani stops: ${rajdhaniError.message}`)
    }

    console.log('\n📍 Rajdhani stops (outbound):')
    rajdhaniStops?.forEach(stop => {
      console.log(`   ${stop.stop_order}. ${stop.stops.name}`)
      console.log(`      Coordinates: [${stop.stops.latitude}, ${stop.stops.longitude}]`)
      console.log(`      Distance to next: ${stop.distance_to_next} km`)
    })

    // Test direct distances between key stops
    if (rajdhaniStops && rajdhaniStops.length >= 2) {
      console.log('\n🧮 Testing direct OSRM distances:')
      
      const badda = rajdhaniStops.find(s => s.stops.name === 'Badda')
      const madhyaBadda = rajdhaniStops.find(s => s.stops.name === 'Madhya Badda')
      const merul = rajdhaniStops.find(s => s.stops.name === 'Merul')
      const rampuraBridge = rajdhaniStops.find(s => s.stops.name === 'Rampura Bridge')
      const banasree = rajdhaniStops.find(s => s.stops.name === 'Banasree')

      if (badda && banasree) {
        console.log('\n   🎯 Direct Badda → Banasree:')
        const directDistance = await osrmStrategy.calculateDistances(
          [{ lat: badda.stops.latitude, lng: badda.stops.longitude }],
          [{ lat: banasree.stops.latitude, lng: banasree.stops.longitude }]
        )
        console.log(`      Direct distance: ${directDistance[0][0].distance.toFixed(3)} km`)
        
        // Calculate sum of segments
        const segmentSum = rajdhaniStops
          .filter(s => s.stop_order >= 23 && s.stop_order < 27)
          .reduce((sum, s) => sum + (s.distance_to_next || 0), 0)
        console.log(`      Sum of segments: ${segmentSum.toFixed(3)} km`)
        console.log(`      Difference: ${Math.abs(directDistance[0][0].distance - segmentSum).toFixed(3)} km`)
      }

      if (badda && madhyaBadda) {
        console.log('\n   🎯 Direct Badda → Madhya Badda:')
        const distance = await osrmStrategy.calculateDistances(
          [{ lat: badda.stops.latitude, lng: badda.stops.longitude }],
          [{ lat: madhyaBadda.stops.latitude, lng: madhyaBadda.stops.longitude }]
        )
        console.log(`      Direct distance: ${distance[0][0].distance.toFixed(3)} km`)
        console.log(`      Stored distance: ${badda?.distance_to_next} km`)
      }

      if (madhyaBadda && merul) {
        console.log('\n   🎯 Direct Madhya Badda → Merul:')
        const distance = await osrmStrategy.calculateDistances(
          [{ lat: madhyaBadda.stops.latitude, lng: madhyaBadda.stops.longitude }],
          [{ lat: merul.stops.latitude, lng: merul.stops.longitude }]
        )
        console.log(`      Direct distance: ${distance[0][0].distance.toFixed(3)} km`)
        console.log(`      Stored distance: ${madhyaBadda?.distance_to_next} km`)
      }
    }

    // Compare with Rois bus
    console.log('\n🔍 Finding Rois bus stops...')
    const { data: roisStops, error: roisError } = await supabase
      .from('route_stops')
      .select(`
        stop_order,
        direction,
        distance_to_next,
        buses!inner(name),
        stops!inner(name, latitude, longitude)
      `)
      .eq('buses.name', 'Rois Bus Route Dhaka')
      .eq('direction', 'outbound')
      .in('stop_order', [9, 10, 11])
      .order('stop_order')

    if (!roisError && roisStops) {
      console.log('\n📍 Rois stops (outbound):')
      roisStops.forEach(stop => {
        console.log(`   ${stop.stop_order}. ${stop.stops.name}`)
        console.log(`      Coordinates: [${stop.stops.latitude}, ${stop.stops.longitude}]`)
        console.log(`      Distance to next: ${stop.distance_to_next} km`)
      })

      const roisBadda = roisStops.find(s => s.stops.name === 'Badda')
      const roisBanasree = roisStops.find(s => s.stops.name === 'Banasree')

      if (roisBadda && roisBanasree) {
        console.log('\n   🎯 Rois Direct Badda → Banasree:')
        const directDistance = await osrmStrategy.calculateDistances(
          [{ lat: roisBadda.stops.latitude, lng: roisBadda.stops.longitude }],
          [{ lat: roisBanasree.stops.latitude, lng: roisBanasree.stops.longitude }]
        )
        console.log(`      Direct distance: ${directDistance[0][0].distance.toFixed(3)} km`)
        
        const segmentSum = roisStops
          .filter(s => s.stop_order >= 9 && s.stop_order < 11)
          .reduce((sum, s) => sum + (s.distance_to_next || 0), 0)
        console.log(`      Sum of segments: ${segmentSum.toFixed(3)} km`)
      }
    }

    // Check if coordinates are suspicious
    console.log('\n🔍 Checking for coordinate issues...')
    const allStops = [...(rajdhaniStops || []), ...(roisStops || [])]
    allStops.forEach(stop => {
      const lat = stop.stops.latitude
      const lng = stop.stops.longitude
      
      // Check if coordinates are in Dhaka area (roughly 23.7-23.9 lat, 90.3-90.5 lng)
      if (lat < 23.6 || lat > 23.9 || lng < 90.2 || lng > 90.6) {
        console.log(`   ⚠️  Suspicious coordinates for ${stop.stops.name}: [${lat}, ${lng}]`)
      }
    })

  } catch (error) {
    console.error('❌ Debug failed:', error instanceof Error ? error.message : String(error))
  }
}

debugCoordinates().catch(console.error)