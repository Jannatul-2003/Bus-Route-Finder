/**
 * Debug script to check what segments need processing
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function debug() {
  console.log('Fetching route stops with NULL distances...\n');
  
  const { data, error } = await supabase
    .from('route_stops')
    .select('id, bus_id, stop_id, stop_order, direction, distance_to_next')
    .is('distance_to_next', null)
    .limit(10);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${data?.length || 0} segments with NULL distance (showing first 10):`);
  console.log(JSON.stringify(data, null, 2));
}

debug();
