#!/bin/bash

# Script to run populate-route-distances until all segments are processed

echo "Starting distance population loop..."
echo "This will run until all segments have distances."
echo ""

iteration=1
while true; do
  echo "=== Iteration $iteration ==="
  npm run db:populate-distances
  
  # Check if there are any remaining segments
  remaining=$(npx tsx -e "
    import { createClient } from '@supabase/supabase-js';
    import { config } from 'dotenv';
    config({ path: '.env.local' });
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data } = await supabase.from('route_stops').select('distance_to_next').is('distance_to_next', null);
    console.log(data?.length || 0);
  " 2>/dev/null | tail -1)
  
  echo "Remaining segments: $remaining"
  
  if [ "$remaining" -eq "0" ]; then
    echo ""
    echo "✅ All segments processed!"
    npm run db:check-progress
    break
  fi
  
  iteration=$((iteration + 1))
  echo ""
done
