#!/usr/bin/env tsx

/**
 * Test script to debug database update issues
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function testDatabaseUpdate() {
  console.log('🧪 Testing database update...')
  console.log('SUPABASE_URL:', SUPABASE_URL ? 'Set' : 'Missing')
  console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'Set' : 'Missing')

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing environment variables')
    console.error('SUPABASE_URL:', SUPABASE_URL)
    console.error('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '[HIDDEN]' : 'undefined')
    return
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  try {
    // Test 1: Check if we can read route_stops
    console.log('\n1️⃣ Testing database read access...')
    const { data: testRead, error: readError } = await supabase
      .from('route_stops')
      .select('id, bus_id, stop_order, distance_to_next')
      .is('distance_to_next', null)
      .limit(5)

    if (readError) {
      console.error('❌ Read error:', readError)
      return
    }

    console.log('✅ Read access works')
    console.log('Sample null distance records:', testRead?.length || 0)
    if (testRead && testRead.length > 0) {
      console.log('First record:', testRead[0])
    }

    // Test 2: Try to update one record
    if (testRead && testRead.length > 0) {
      const testRecord = testRead[0]
      console.log('\n2️⃣ Testing database update...')
      console.log('Updating record:', testRecord.id)

      const { error: updateError } = await supabase
        .from('route_stops')
        .update({ distance_to_next: 1.234 })
        .eq('id', testRecord.id)

      if (updateError) {
        console.error('❌ Update error:', updateError)
        return
      }

      console.log('✅ Update successful')

      // Test 3: Verify the update
      console.log('\n3️⃣ Verifying update...')
      const { data: verifyData, error: verifyError } = await supabase
        .from('route_stops')
        .select('id, distance_to_next')
        .eq('id', testRecord.id)
        .single()

      if (verifyError) {
        console.error('❌ Verify error:', verifyError)
        return
      }

      console.log('✅ Verification successful')
      console.log('Updated value:', verifyData.distance_to_next)

      // Test 4: Reset the value back to null
      console.log('\n4️⃣ Resetting value...')
      const { error: resetError } = await supabase
        .from('route_stops')
        .update({ distance_to_next: null })
        .eq('id', testRecord.id)

      if (resetError) {
        console.error('❌ Reset error:', resetError)
      } else {
        console.log('✅ Reset successful')
      }
    }

    // Test 5: Check coordinates data
    console.log('\n5️⃣ Testing coordinate data...')
    const { data: coordData, error: coordError } = await supabase
      .from('route_stops')
      .select(`
        id,
        stop_order,
        distance_to_next,
        stops!inner(latitude, longitude, name)
      `)
      .is('distance_to_next', null)
      .limit(3)

    if (coordError) {
      console.error('❌ Coordinate query error:', coordError)
      return
    }

    console.log('✅ Coordinate data access works')
    console.log('Sample records with coordinates:')
    coordData?.forEach((record, index) => {
      console.log(`  ${index + 1}. ${record.stops?.name}: [${record.stops?.latitude}, ${record.stops?.longitude}]`)
    })

  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : String(error))
  }
}

testDatabaseUpdate().catch(console.error)