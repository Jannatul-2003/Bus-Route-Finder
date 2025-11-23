/**
 * Script to update bus amenities (is_ac, coach_type) for existing buses
 * 
 * Usage: npx tsx scripts/update-bus-amenities.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validate required environment variables
if (!SUPABASE_URL) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL is not set in .env.local');
  process.exit(1);
}

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in .env.local');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface Bus {
  id: string;
  name: string;
  is_ac: boolean | null;
  coach_type: string | null;
}

/**
 * Infer amenities from bus name
 */
function inferAmenities(busName: string): { is_ac: boolean; coach_type: 'standard' | 'express' | 'luxury' } {
  const nameLower = busName.toLowerCase();
  
  // Determine if AC
  const is_ac = nameLower.includes('ac') || 
                nameLower.includes('a/c') || 
                nameLower.includes('air') ||
                nameLower.includes('luxury') ||
                nameLower.includes('premium') ||
                nameLower.includes('express');
  
  // Determine coach type
  let coach_type: 'standard' | 'express' | 'luxury' = 'standard';
  
  if (nameLower.includes('luxury') || nameLower.includes('premium') || nameLower.includes('deluxe')) {
    coach_type = 'luxury';
  } else if (nameLower.includes('express') || nameLower.includes('rapid') || nameLower.includes('fast')) {
    coach_type = 'express';
  }
  
  return { is_ac, coach_type };
}

/**
 * Fetch all buses
 */
async function fetchBuses(): Promise<Bus[]> {
  console.log('Fetching buses...');
  
  const { data: buses, error } = await supabase
    .from('buses')
    .select('id, name, is_ac, coach_type')
    .eq('status', 'active');
  
  if (error) {
    throw new Error(`Failed to fetch buses: ${error.message}`);
  }
  
  return buses || [];
}

/**
 * Update a bus with amenities
 */
async function updateBus(busId: string, is_ac: boolean, coach_type: string): Promise<void> {
  const { error } = await supabase
    .from('buses')
    .update({ is_ac, coach_type })
    .eq('id', busId);
  
  if (error) {
    console.error(`Failed to update bus ${busId}:`, error.message);
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('=== Bus Amenities Update Script ===\n');
  
  try {
    const buses = await fetchBuses();
    console.log(`Found ${buses.length} active buses\n`);
    
    if (buses.length === 0) {
      console.log('No buses found. Nothing to do.');
      return;
    }
    
    // Check which buses need updating
    const needsUpdate = buses.filter(b => b.is_ac === null || b.coach_type === null);
    
    if (needsUpdate.length === 0) {
      console.log('All buses already have amenity data. Nothing to do.');
      return;
    }
    
    console.log(`${needsUpdate.length} buses need amenity updates\n`);
    console.log('Inferring amenities from bus names...\n');
    
    let updated = 0;
    
    for (const bus of needsUpdate) {
      const amenities = inferAmenities(bus.name);
      
      console.log(`${bus.name}:`);
      console.log(`  AC: ${amenities.is_ac ? 'Yes' : 'No'}`);
      console.log(`  Type: ${amenities.coach_type}`);
      
      await updateBus(bus.id, amenities.is_ac, amenities.coach_type);
      updated++;
    }
    
    console.log(`\n=== Update Complete ===`);
    console.log(`Updated ${updated} buses`);
    
    // Show final statistics
    const { data: stats } = await supabase
      .from('buses')
      .select('is_ac, coach_type')
      .eq('status', 'active');
    
    if (stats) {
      const acCount = stats.filter((s: any) => s.is_ac).length;
      const nonAcCount = stats.filter((s: any) => !s.is_ac).length;
      
      const standardCount = stats.filter((s: any) => s.coach_type === 'standard').length;
      const expressCount = stats.filter((s: any) => s.coach_type === 'express').length;
      const luxuryCount = stats.filter((s: any) => s.coach_type === 'luxury').length;
      
      console.log('\nFinal Statistics:');
      console.log(`AC Buses: ${acCount}`);
      console.log(`Non-AC Buses: ${nonAcCount}`);
      console.log(`Standard: ${standardCount}`);
      console.log(`Express: ${expressCount}`);
      console.log(`Luxury: ${luxuryCount}`);
    }
    
    console.log('\nNote: Amenities were inferred from bus names.');
    console.log('Please review and manually adjust any incorrect classifications in Supabase.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
main();
