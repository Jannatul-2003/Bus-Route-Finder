#!/usr/bin/env tsx

/**
 * Simple test script to debug OSRM API issues
 */

import { config } from 'dotenv'
import { OSRMStrategy } from '../src/lib/strategies/OSRMStrategy'

// Load environment variables from .env.local
config({ path: '.env.local' })

const OSRM_PUBLIC_API = 'https://router.project-osrm.org'

async function testOSRM() {
  console.log('🧪 Testing OSRM Public API...')
  console.log('API URL:', OSRM_PUBLIC_API)

  const osrmStrategy = new OSRMStrategy(OSRM_PUBLIC_API)

  try {
    // Test 1: Check availability
    console.log('\n1️⃣ Testing availability...')
    const isAvailable = await osrmStrategy.isAvailable()
    console.log('Available:', isAvailable)

    if (!isAvailable) {
      console.log('❌ OSRM API is not available. Stopping tests.')
      return
    }

    // Test 2: Simple distance calculation (Dhaka coordinates)
    console.log('\n2️⃣ Testing distance calculation...')
    console.log('From: Badda area (23.7808, 90.4267)')
    console.log('To: Banasree area (23.7615, 90.4297)')

    const result = await osrmStrategy.calculateDistances(
      [{ lat: 23.7808, lng: 90.4267 }], // Badda
      [{ lat: 23.7615, lng: 90.4297 }]  // Banasree
    )

    console.log('Result:', result)
    console.log('Distance:', result[0][0].distance, 'km')
    console.log('Method:', result[0][0].method)

    // Test 3: Test with actual coordinates from your database
    console.log('\n3️⃣ Testing with multiple coordinates...')
    const multiResult = await osrmStrategy.calculateDistances(
      [
        { lat: 23.7808, lng: 90.4267 }, // Badda
        { lat: 23.7615, lng: 90.4297 }  // Banasree
      ],
      [
        { lat: 23.7500, lng: 90.4200 }, // Another point
        { lat: 23.7700, lng: 90.4300 }  // Another point
      ]
    )

    console.log('Multi-result:', multiResult)

  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : String(error))
    console.error('Full error:', error)
  }
}

testOSRM().catch(console.error)