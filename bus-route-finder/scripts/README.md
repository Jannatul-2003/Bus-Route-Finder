# Database Scripts

## populate-distances.ts

This script calculates and stores missing `distance_to_next` values in the `route_stops` table using **OSRM Public API** for accurate road-based distance calculations.

### Purpose
- Fixes inconsistent distance calculations between different bus routes
- Populates missing `distance_to_next` values that are currently `null`
- Uses **OSRM Public API** for accurate road-based distances (no fallback to Haversine)

### Prerequisites
1. **Environment Variables**: Ensure these are set in your `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. **Internet Connection**: 
   - Script uses the public OSRM API: `https://router.project-osrm.org`
   - No local OSRM server required
   - Includes rate limiting to respect public API limits

### Usage

```bash
# Run the distance population script
npm run db:populate-distances

# Or run directly with tsx
npx tsx scripts/populate-distances.ts
```

### What it does

1. **Fetches** all route segments with `distance_to_next = null`
2. **Groups** segments by bus route and direction
3. **Calculates** distances between consecutive stops using **OSRM Public API only**
4. **Updates** the database with calculated distances
5. **Processes** in small batches with delays to respect API rate limits

### Rate Limiting Features

- **Small batch size**: 10 segments per batch (vs 50 for local OSRM)
- **Request delays**: 500ms between individual requests
- **Batch delays**: 2 seconds between batches
- **Error handling**: Extra delays after API errors

### Output Example

```
🚌 Starting distance population script using OSRM Public API...
✅ OSRM Public API is available and ready
🌐 Using public API: https://router.project-osrm.org
📊 Fetching route segments with missing distances...
📈 Found 1,234 route segments with missing distances
🗺️  Processing 45 routes

🚌 Processing: Rajdhani Super Bus Route Dhaka (outbound)
   28 segments to process
   📦 Processing batch 1/3 (10 segments)
   ✅ Banasree → Rampura: 1.250 km (OSRM)
   ✅ Rampura → Madhya Badda: 0.850 km (OSRM)
   ✅ Madhya Badda → Badda: 0.420 km (OSRM)
   💾 Updated 9 segments in database
   ⏳ Waiting 2000ms before next batch (respecting API rate limits)...

📊 Summary:
   Total segments processed: 1,234
   Successfully updated: 1,200
   Errors: 34
   
✅ Distance population completed successfully using OSRM Public API!
   Your bus route distances are now accurate and consistent.
   All distances calculated using real road networks.
```

### Benefits After Running

- **100% OSRM accuracy**: All distances calculated using real road networks
- **Consistent distances**: All bus routes use the same calculation method
- **Better performance**: Pre-calculated distances are faster than real-time calculation
- **Fixed discrepancies**: Resolves issues like 21.03 km vs 2.52 km for the same route
- **No local setup**: Uses public API, no need to run OSRM server locally

### Important Notes

- **OSRM Only**: Script rejects any Haversine fallback results for maximum accuracy
- **Rate Limited**: Designed to respect public API limits with appropriate delays
- **Internet Required**: Requires stable internet connection to access public OSRM API
- **Slower Processing**: Takes longer than local OSRM due to rate limiting (but more accessible)

### Troubleshooting

- **API rate limiting**: Script includes built-in delays, but you may need to run it multiple times for large datasets
- **Network errors**: Script will retry and continue processing other segments
- **Database errors**: Check Supabase connection and permissions
- **Missing coordinates**: Some stops might not have latitude/longitude data