/**
 * Script to check the progress of distance population
 * 
 * Usage: npx tsx scripts/check-progress.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkProgress() {
  console.log('=== Distance Population Progress ===\n');
  
  try {
    // Get overall statistics
    const { data: stats, error } = await supabase
      .from('route_stops')
      .select('distance_to_next, duration_to_next');
    
    if (error) {
      throw new Error(`Failed to fetch stats: ${error.message}`);
    }
    
    if (!stats) {
      console.log('No route stops found');
      return;
    }
    
    const total = stats.length;
    const withDistance = stats.filter((s: any) => s.distance_to_next !== null && s.distance_to_next !== 0).length;
    const withDuration = stats.filter((s: any) => s.duration_to_next !== null && s.duration_to_next !== 0).length;
    const withNull = stats.filter((s: any) => s.distance_to_next === null).length;
    const withZero = stats.filter((s: any) => s.distance_to_next === 0).length;
    const remaining = withNull + withZero;
    
    const percentComplete = Math.round((withDistance / total) * 100);
    
    console.log(`Total route segments: ${total}`);
    console.log(`Segments with distance: ${withDistance} (${percentComplete}%)`);
    console.log(`Segments with duration: ${withDuration}`);
    console.log(`Segments with NULL distance: ${withNull}`);
    console.log(`Segments with ZERO distance: ${withZero}`);
    console.log(`Remaining: ${remaining}\n`);
    
    // Progress bar
    const barLength = 50;
    const filledLength = Math.round((withDistance / total) * barLength);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    console.log(`Progress: [${bar}] ${percentComplete}%\n`);
    
    if (remaining === 0) {
      console.log('✅ All segments have been processed!');
      
      // Show some statistics
      const distances = stats
        .filter((s: any) => s.distance_to_next !== null)
        .map((s: any) => s.distance_to_next);
      
      if (distances.length > 0) {
        const avgDistance = distances.reduce((a: number, b: number) => a + b, 0) / distances.length;
        const minDistance = Math.min(...distances);
        const maxDistance = Math.max(...distances);
        
        console.log('\nDistance Statistics:');
        console.log(`  Average: ${avgDistance.toFixed(2)} km`);
        console.log(`  Minimum: ${minDistance.toFixed(2)} km`);
        console.log(`  Maximum: ${maxDistance.toFixed(2)} km`);
      }
    } else {
      const estimatedMinutesRemaining = Math.ceil((remaining * 0.1) / 60); // ~0.1 seconds per segment
      console.log(`⏳ Estimated time remaining: ~${estimatedMinutesRemaining} minutes`);
      console.log('\nRun this script again to check progress.');
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkProgress();
