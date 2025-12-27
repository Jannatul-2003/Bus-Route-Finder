#!/usr/bin/env tsx

/**
 * Script to fix the incorrect Madhya Badda coordinates
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { OSRMStrategy } from '../src/lib/strategies/OSRMStrategy'

// Load environment variables from .env.local
config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const OSRM_PUBLIC_API = 'https://router.project-osrm.org'

async function fixMadhyaBaddaCoordinates() {
  console.log('🔧 Fixing Madhya Badda coordinates...')
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing environment variables')
    return
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const osrmStrategy = new OSRMStrategy(OSRM_PUBLIC_API)

  try {
    // Find the Madhya Badda stop
    console.log('🔍 Finding Madhya Badda stop...')
    const { data: madhyaBaddaStops, error: findError } = await supabase
      .from('stops')
      .select('id, name, latitude, longitude')
      .eq('name', 'Madhya Badda')

    if (findError) {
      throw new Error(`Failed to find Madhya Badda: ${findError.message}`)
    }

    if (!madhyaBaddaStops || madhyaBaddaStops.length === 0) {
      console.log('❌ Madhya Badda stop not found')
      return
    }

    const madhyaBadda = madhyaBaddaStops[0]
    console.log(`📍 Current Madhya Badda coordinates: [${madhyaBadda.latitude}, ${madhyaBadda.longitude}]`)

    // Proposed correct coordinates for Madhya Badda
    // Based on the fact that it should be between Badda and Merul
    // Badda: [23.7765425, 90.4463012]
    // Merul: [23.7718576, 90.4250807]
    // Madhya Badda should be roughly in between, closer to Badda
    
    const correctedLatitude = 23.7741  // Between Badda and Merul
    const correctedLongitude = 90.4357 // Between Badda and Merul

    console.log(`🎯 Proposed corrected coordinates: [${correctedLatitude}, ${correctedLongitude}]`)

    // Test distances with corrected coordinates
    console.log('\n🧮 Testing distances with corrected coordinates:')
    
    // Badda to corrected Madhya Badda
    const baddaToMadhya = await osrmStrategy.calculateDistances(
      [{ lat: 23.7765425, lng: 90.4463012 }], // Badda
      [{ lat: correctedLatitude, lng: correctedLongitude }] // Corrected Madhya Badda
    )
    console.log(`   Badda → Corrected Madhya Badda: ${baddaToMadhya[0][0].distance.toFixed(3)} km`)

    // Corrected Madhya Badda to Merul
    const madhyaToMerul = await osrmStrategy.calculateDistances(
      [{ lat: correctedLatitude, lng: correctedLongitude }], // Corrected Madhya Badda
      [{ lat: 23.7718576, lng: 90.4250807 }] // Merul
    )
    console.log(`   Corrected Madhya Badda → Merul: ${madhyaToMerul[0][0].distance.toFixed(3)} km`)

    // Total with corrected coordinates
    const totalCorrected = baddaToMadhya[0][0].distance + madhyaToMerul[0][0].distance
    console.log(`   Total Badda → Merul (via corrected Madhya Badda): ${totalCorrected.toFixed(3)} km`)

    // Direct Badda to Merul for comparison
    const directBaddaToMerul = await osrmStrategy.calculateDistances(
      [{ lat: 23.7765425, lng: 90.4463012 }], // Badda
      [{ lat: 23.7718576, lng: 90.4250807 }] // Merul
    )
    console.log(`   Direct Badda → Merul: ${directBaddaToMerul[0][0].distance.toFixed(3)} km`)

    const difference = Math.abs(totalCorrected - directBaddaToMerul[0][0].distance)
    console.log(`   Difference: ${difference.toFixed(3)} km`)

    if (difference < 1.0) { // If difference is less than 1km, coordinates are reasonable
      console.log('\n✅ Corrected coordinates look reasonable!')
      
      // Ask for confirmation (in a real script, you might want to add a prompt)
      console.log('\n🔄 Updating Madhya Badda coordinates...')
      
      const { error: updateError } = await supabase
        .from('stops')
        .update({
          latitude: correctedLatitude,
          longitude: correctedLongitude
        })
        .eq('id', madhyaBadda.id)

      if (updateError) {
        throw new Error(`Failed to update coordinates: ${updateError.message}`)
      }

      console.log('✅ Madhya Badda coordinates updated successfully!')
      
      // Now we need to recalculate the affected route_stops distances
      console.log('\n🔄 Recalculating affected route distances...')
      
      // Find all route_stops that use this stop
      const { data: affectedRoutes, error: routesError } = await supabase
        .from('route_stops')
        .select('id, bus_id, stop_order, direction')
        .eq('stop_id', madhyaBadda.id)

      if (routesError) {
        console.error('⚠️  Could not find affected routes:', routesError.message)
      } else if (affectedRoutes) {
        console.log(`📊 Found ${affectedRoutes.length} affected route segments`)
        
        // Reset their distance_to_next to null so they get recalculated
        for (const route of affectedRoutes) {
          const { error: resetError } = await supabase
            .from('route_stops')
            .update({ distance_to_next: null })
            .eq('id', route.id)

          if (resetError) {
            console.error(`⚠️  Could not reset distance for route ${route.id}:`, resetError.message)
          } else {
            console.log(`   ✅ Reset distance for bus ${route.bus_id}, stop ${route.stop_order} (${route.direction})`)
          }
        }
        
        console.log('\n🎯 Coordinate fix complete!')
        console.log('   Run the populate-distances script again to recalculate with correct coordinates.')
      }
      
    } else {
      console.log('\n⚠️  Corrected coordinates still seem off. Manual review needed.')
      console.log('   Consider checking the actual location of Madhya Badda on Google Maps.')
    }

  } catch (error) {
    console.error('❌ Fix failed:', error instanceof Error ? error.message : String(error))
  }
}

fixMadhyaBaddaCoordinates().catch(console.error)