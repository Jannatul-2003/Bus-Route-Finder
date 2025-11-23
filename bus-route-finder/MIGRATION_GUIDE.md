# Database Migration Guide

This guide walks you through updating your existing Supabase database with the new schema enhancements for threshold-based route planning.

## ✅ What You've Already Done

- [x] Run `001_add_bus_amenities.sql` migration
- [x] Run `002_add_route_distances.sql` migration

## 📋 What You Need to Do Next

### Step 1: Update Bus Amenities

Your existing buses now have `is_ac` and `coach_type` columns, but they're empty. Run this script to populate them:

```bash
npm run db:update-amenities
```

This will:
- Analyze your bus names
- Infer AC status and coach type
- Update the database automatically

**After running**, review the results in Supabase and manually correct any misclassifications.

### Step 2: Populate Route Distances

Your route_stops now have `distance_to_next` and `duration_to_next` columns, but they're empty. Run this script to calculate real distances using OSRM:

```bash
npm run db:populate-distances
```

This will:
- Calculate road network distances between consecutive stops using OSRM
- Fall back to straight-line (Haversine) distance if OSRM is unavailable
- Calculate estimated travel durations
- Process all 5423 route segments in batches

**Note**: This may take 10-20 minutes depending on your data size and OSRM availability.

### Step 3: Verify the Results

Run the verification script in Supabase SQL Editor:

```sql
-- Check bus amenities distribution
SELECT is_ac, coach_type, COUNT(*) as count
FROM buses
WHERE status = 'active'
GROUP BY is_ac, coach_type
ORDER BY is_ac, coach_type;

-- Check route distance statistics
SELECT 
  COUNT(*) as total_segments,
  COUNT(distance_to_next) as segments_with_distance,
  COUNT(duration_to_next) as segments_with_duration,
  ROUND(AVG(distance_to_next)::numeric, 2) as avg_distance_km,
  ROUND(AVG(duration_to_next)::numeric, 0) as avg_duration_seconds
FROM route_stops;

-- Sample query: Find buses between two stops
SELECT 
  b.name as bus_name,
  b.is_ac,
  b.coach_type,
  SUM(rs.distance_to_next) as journey_length_km,
  SUM(rs.duration_to_next) as journey_duration_seconds
FROM buses b
JOIN route_stops rs ON b.id = rs.bus_id
WHERE b.status = 'active'
  AND rs.distance_to_next IS NOT NULL
GROUP BY b.id, b.name, b.is_ac, b.coach_type
LIMIT 10;
```

## 🎯 Expected Results

After completing all steps, you should see:

1. **Bus Amenities**: All active buses have `is_ac` (true/false) and `coach_type` (standard/express/luxury)
2. **Route Distances**: Most route segments have `distance_to_next` and `duration_to_next` values
3. **Journey Calculations**: You can now calculate total journey lengths by summing segment distances

## 🔧 Using OSRM

### Option 1: Public OSRM (Default)
The scripts use the public OSRM endpoint by default. This is free but may be rate-limited.

### Option 2: Your Own OSRM Instance (Recommended for Production)

If you have high volume or need better reliability, set up your own OSRM:

```bash
# 1. Download Bangladesh map data
wget https://download.geofabrik.de/asia/bangladesh-latest.osm.pbf

# 2. Process with OSRM (using Docker)
docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-extract -p /opt/car.lua /data/bangladesh-latest.osm.pbf
docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-partition /data/bangladesh-latest.osrm
docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-customize /data/bangladesh-latest.osrm

# 3. Run OSRM server
docker run -t -i -p 5000:5000 -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-routed --algorithm mld /data/bangladesh-latest.osrm

# 4. Update .env.local
echo "OSRM_ENDPOINT=http://localhost:5000" >> .env.local
```

Then re-run the distance population script.

## 📊 Manual Review Checklist

After running the scripts, manually review:

1. **Bus Classifications**: Check that AC/Non-AC and coach types are correct
2. **Distance Accuracy**: Spot-check a few route segments for reasonable distances
3. **Missing Data**: Identify any segments that couldn't be calculated
4. **Outliers**: Look for unusually long or short distances that might indicate errors

## 🐛 Troubleshooting

### Script Fails with "Cannot find module"
```bash
npm install
```

### OSRM Timeouts
- The script automatically falls back to Haversine distance
- Consider setting up your own OSRM instance
- Or re-run the script to retry failed segments

### Permission Errors
Add your service role key to `.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Incorrect Bus Classifications
Manually update in Supabase:
```sql
UPDATE buses
SET is_ac = true, coach_type = 'luxury'
WHERE name = 'Specific Bus Name';
```

## 📁 Files Created

```
supabase/
├── migrations/
│   ├── 001_add_bus_amenities.sql          ✅ Already run
│   ├── 002_add_route_distances.sql        ✅ Already run
│   ├── rollback_001_add_bus_amenities.sql (if you need to undo)
│   ├── rollback_002_add_route_distances.sql (if you need to undo)
│   └── verify_schema.sql                  (for verification)
├── seeds/
│   └── 001_dhaka_bus_routes.sql          (sample data - not needed)
└── README.md

scripts/
├── populate-route-distances.ts            🔄 Run this next
├── update-bus-amenities.ts                🔄 Run this next
└── README.md
```

## ✨ Next Steps After Migration

Once your data is populated, you can:

1. Start implementing the next task: **Task 2 - Implement Builder Pattern for bus filtering**
2. Test the route planning functionality with real data
3. Build the UI components that use this data
4. Set up monitoring for data quality

## 📞 Need Help?

- Check `scripts/README.md` for detailed script documentation
- Check `supabase/README.md` for migration details
- Review the verification queries to understand the data structure

---

**Summary**: Run `npm run db:update-amenities` then `npm run db:populate-distances` to complete your migration! 🚀
