# Database Population Scripts

These scripts help populate the new database columns added by the migrations with real data using OSRM for accurate distance calculations.

## Prerequisites

1. **Environment Variables**: Make sure your `.env.local` file contains:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   # Optional: Use service role key for better permissions
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Optional: Custom OSRM endpoint (defaults to public OSRM)
   OSRM_ENDPOINT=https://router.project-osrm.org
   ```

2. **Migrations Applied**: Ensure you've run both migration scripts:
   - `001_add_bus_amenities.sql`
   - `002_add_route_distances.sql`

## Scripts

### 1. Update Bus Amenities

Updates the `is_ac` and `coach_type` columns for existing buses by inferring values from bus names.

```bash
npm run db:update-amenities
```

**What it does:**
- Fetches all active buses from the database
- Infers AC status and coach type from bus names
- Updates buses that don't have amenity data
- Shows statistics of the updates

**Inference Logic:**
- **AC Detection**: Looks for keywords like "AC", "A/C", "Air", "Luxury", "Premium", "Express"
- **Coach Type**:
  - `luxury`: Contains "Luxury", "Premium", "Deluxe"
  - `express`: Contains "Express", "Rapid", "Fast"
  - `standard`: Everything else

**Note**: After running, review the results in Supabase and manually adjust any incorrect classifications.

### 2. Populate Route Distances

Calculates and populates `distance_to_next` and `duration_to_next` for all route segments using OSRM with Haversine fallback.

```bash
npm run db:populate-distances
```

**What it does:**
- Fetches all route segments that need distance calculation
- Uses OSRM to calculate real road network distances
- Falls back to Haversine (straight-line) distance if OSRM fails
- Calculates estimated duration based on distance
- Processes in batches to avoid overwhelming OSRM
- Shows progress and statistics

**Configuration:**
- `BATCH_SIZE`: 50 segments per batch
- `OSRM_TIMEOUT`: 30 seconds per request
- `AVERAGE_SPEED_KMH`: 20 km/h for duration estimation

**OSRM Endpoints:**
- **Default**: `https://router.project-osrm.org` (public, free, but rate-limited)
- **Custom**: Set `OSRM_ENDPOINT` in `.env.local` for your own OSRM instance

## Usage Workflow

1. **First, update bus amenities:**
   ```bash
   npm run db:update-amenities
   ```
   
2. **Then, populate route distances:**
   ```bash
   npm run db:populate-distances
   ```
   
3. **Verify the results** in Supabase SQL Editor:
   ```sql
   -- Check bus amenities
   SELECT is_ac, coach_type, COUNT(*) 
   FROM buses 
   GROUP BY is_ac, coach_type;
   
   -- Check route distances
   SELECT 
     COUNT(*) as total_segments,
     COUNT(distance_to_next) as with_distance,
     COUNT(duration_to_next) as with_duration,
     ROUND(AVG(distance_to_next)::numeric, 2) as avg_distance_km
   FROM route_stops;
   ```

## Setting Up Your Own OSRM Instance

For production use with high volume, consider setting up your own OSRM instance:

### Using Docker (Recommended)

1. **Download Bangladesh OSM data:**
   ```bash
   wget https://download.geofabrik.de/asia/bangladesh-latest.osm.pbf
   ```

2. **Process the data:**
   ```bash
   docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-extract -p /opt/car.lua /data/bangladesh-latest.osm.pbf
   docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-partition /data/bangladesh-latest.osrm
   docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-customize /data/bangladesh-latest.osrm
   ```

3. **Run the OSRM server:**
   ```bash
   docker run -t -i -p 5000:5000 -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-routed --algorithm mld /data/bangladesh-latest.osrm
   ```

4. **Update your `.env.local`:**
   ```env
   OSRM_ENDPOINT=http://localhost:5000
   ```

### Using Dhaka-Only Data

For better performance, you can extract just Dhaka city data:

```bash
# Install osmium-tool
sudo apt-get install osmium-tool

# Extract Dhaka area (approximate bounding box)
osmium extract -b 90.3,23.7,90.5,23.9 bangladesh-latest.osm.pbf -o dhaka.osm.pbf

# Then process dhaka.osm.pbf with OSRM as shown above
```

## Troubleshooting

### OSRM Timeout Errors
- The script automatically falls back to Haversine distance
- Consider setting up your own OSRM instance for better reliability
- Increase `OSRM_TIMEOUT` in the script if needed

### Permission Errors
- Use `SUPABASE_SERVICE_ROLE_KEY` instead of `ANON_KEY` for better permissions
- Check that your Supabase RLS policies allow updates

### Incorrect Amenity Inference
- The script infers amenities from bus names, which may not always be accurate
- Manually review and correct in Supabase after running the script
- Consider creating a CSV mapping file for more accurate classification

### Rate Limiting
- The public OSRM endpoint may rate-limit requests
- The script includes a 100ms delay between requests
- For large datasets, use your own OSRM instance

## Manual Updates

If you prefer to update specific buses or routes manually:

### Update Specific Bus Amenities
```sql
UPDATE buses
SET is_ac = true, coach_type = 'express'
WHERE name = 'Your Bus Name';
```

### Update Specific Route Distances
```sql
UPDATE route_stops
SET distance_to_next = 2.5, duration_to_next = 450
WHERE id = 'route_stop_id';
```

## Next Steps

After populating the data:

1. Verify the data in Supabase
2. Test the route planning functionality
3. Monitor for any missing or incorrect data
4. Set up periodic updates if your route data changes frequently
