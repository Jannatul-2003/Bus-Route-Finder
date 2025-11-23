/**
 * Script to populate distance_to_next and duration_to_next in route_stops table
 * Uses OSRM for accurate road network distances with Haversine fallback
 * 
 * Usage: npx tsx scripts/populate-route-distances.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const OSRM_ENDPOINT = process.env.OSRM_ENDPOINT || 'https://router.project-osrm.org';
const BATCH_SIZE = 50; // Process routes in batches
const OSRM_TIMEOUT = 30000; // 30 seconds timeout
const AVERAGE_SPEED_KMH = 20; // Average bus speed for duration calculation

// Validate required environment variables
if (!SUPABASE_URL) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL is not set in .env.local');
  process.exit(1);
}

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in .env.local');
  process.exit(1);
}

interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface RouteStop {
  id: string;
  bus_id: string;
  stop_id: string;
  stop_order: number;
  direction: string;
  distance_to_next: number | null;
  duration_to_next: number | null;
}

interface RouteSegment {
  routeStopId: string;
  busId: string;
  direction: string;
  currentStop: Stop;
  nextStop: Stop;
  stopOrder: number;
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Calculate Haversine distance between two points
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate distance using OSRM
 */
async function calculateOSRMDistance(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
): Promise<{ distance: number; duration: number } | null> {
  try {
    const url = `${OSRM_ENDPOINT}/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=false`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OSRM_TIMEOUT);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`OSRM request failed with status ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.warn('OSRM returned no routes');
      return null;
    }
    
    const route = data.routes[0];
    return {
      distance: route.distance / 1000, // Convert meters to kilometers
      duration: Math.round(route.duration), // Duration in seconds
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('OSRM request timed out');
    } else {
      console.warn('OSRM request failed:', error);
    }
    return null;
  }
}

/**
 * Fetch all route segments that need distance calculation
 */
async function fetchRouteSegments(): Promise<RouteSegment[]> {
  console.log('Fetching route segments...');
  
  // First, get all route stops that need distance calculation
  const { data: routeStops, error: rsError } = await supabase
    .from('route_stops')
    .select('id, bus_id, stop_id, stop_order, direction, distance_to_next, duration_to_next')
    .is('distance_to_next', null)
    .order('bus_id')
    .order('direction')
    .order('stop_order');
  
  if (rsError) {
    throw new Error(`Failed to fetch route stops: ${rsError.message}`);
  }
  
  if (!routeStops || routeStops.length === 0) {
    console.log('No route stops found needing distance calculation');
    return [];
  }
  
  console.log(`Found ${routeStops.length} route stops with NULL distances`);
  
  // Get all stops data
  const { data: allStops, error: stopsError } = await supabase
    .from('stops')
    .select('id, name, latitude, longitude');
  
  if (stopsError) {
    throw new Error(`Failed to fetch stops: ${stopsError.message}`);
  }
  
  const stopsMap = new Map(allStops?.map(s => [s.id, s]) || []);
  
  // Group by bus and direction to find consecutive stops
  const segments: RouteSegment[] = [];
  const grouped = new Map<string, any[]>();
  
  routeStops.forEach((rs: any) => {
    const key = `${rs.bus_id}-${rs.direction}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(rs);
  });
  
  // For each group, we need to find the next stop in sequence
  for (const [key, stops] of grouped.entries()) {
    for (const current of stops) {
      // Find the next stop in the same route
      const { data: nextStops, error: nextError } = await supabase
        .from('route_stops')
        .select('stop_id')
        .eq('bus_id', current.bus_id)
        .eq('direction', current.direction)
        .eq('stop_order', current.stop_order + 1)
        .single();
      
      if (!nextError && nextStops) {
        const currentStop = stopsMap.get(current.stop_id);
        const nextStop = stopsMap.get(nextStops.stop_id);
        
        if (currentStop && nextStop) {
          segments.push({
            routeStopId: current.id,
            busId: current.bus_id,
            direction: current.direction,
            currentStop,
            nextStop,
            stopOrder: current.stop_order,
          });
        }
      }
    }
  }
  
  console.log(`Found ${segments.length} segments needing distance calculation`);
  return segments;
}

/**
 * Update a route segment with distance and duration
 */
async function updateRouteSegment(
  routeStopId: string,
  distance: number,
  duration: number
): Promise<void> {
  const { error } = await supabase
    .from('route_stops')
    .update({
      distance_to_next: distance,
      duration_to_next: duration,
    })
    .eq('id', routeStopId);
  
  if (error) {
    console.error(`Failed to update route stop ${routeStopId}:`, error.message);
  }
}

/**
 * Process a batch of segments
 */
async function processBatch(segments: RouteSegment[]): Promise<void> {
  let osrmSuccess = 0;
  let haversineFallback = 0;
  
  for (const segment of segments) {
    const { currentStop, nextStop, routeStopId } = segment;
    
    // Try OSRM first
    const osrmResult = await calculateOSRMDistance(
      currentStop.latitude,
      currentStop.longitude,
      nextStop.latitude,
      nextStop.longitude
    );
    
    let distance: number;
    let duration: number;
    
    if (osrmResult) {
      distance = osrmResult.distance;
      duration = osrmResult.duration;
      osrmSuccess++;
    } else {
      // Fallback to Haversine
      distance = calculateHaversineDistance(
        currentStop.latitude,
        currentStop.longitude,
        nextStop.latitude,
        nextStop.longitude
      );
      // Estimate duration based on average speed
      duration = Math.round((distance / AVERAGE_SPEED_KMH) * 3600);
      haversineFallback++;
      console.log(
        `Using Haversine fallback for ${currentStop.name} → ${nextStop.name}`
      );
    }
    
    // Update the database
    await updateRouteSegment(routeStopId, distance, duration);
    
    // Small delay to avoid overwhelming OSRM
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  
  console.log(`Batch complete: ${osrmSuccess} OSRM, ${haversineFallback} Haversine`);
}

/**
 * Main execution function
 */
async function main() {
  console.log('=== Route Distance Population Script ===\n');
  console.log(`OSRM Endpoint: ${OSRM_ENDPOINT}`);
  console.log(`Batch Size: ${BATCH_SIZE}\n`);
  
  try {
    // Fetch all segments that need processing
    const segments = await fetchRouteSegments();
    
    if (segments.length === 0) {
      console.log('All route segments already have distance data. Nothing to do.');
      return;
    }
    
    // Process in batches
    const totalBatches = Math.ceil(segments.length / BATCH_SIZE);
    console.log(`Processing ${segments.length} segments in ${totalBatches} batches...\n`);
    
    for (let i = 0; i < segments.length; i += BATCH_SIZE) {
      const batch = segments.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      
      console.log(`\nProcessing batch ${batchNum}/${totalBatches}...`);
      await processBatch(batch);
    }
    
    console.log('\n=== Distance Population Complete ===');
    
    // Verify results
    const { data: stats } = await supabase
      .from('route_stops')
      .select('distance_to_next, duration_to_next');
    
    if (stats) {
      const total = stats.length;
      const withDistance = stats.filter((s: any) => s.distance_to_next !== null).length;
      const withDuration = stats.filter((s: any) => s.duration_to_next !== null).length;
      
      console.log('\nFinal Statistics:');
      console.log(`Total route segments: ${total}`);
      console.log(`Segments with distance: ${withDistance} (${Math.round((withDistance / total) * 100)}%)`);
      console.log(`Segments with duration: ${withDuration} (${Math.round((withDuration / total) * 100)}%)`);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
main();
