# Database Migrations and Seeds

This directory contains SQL migration scripts and seed data for the Dhaka Bus Route Planning system.

## Directory Structure

```
supabase/
├── migrations/          # Database schema migrations
│   ├── 001_add_bus_amenities.sql
│   └── 002_add_route_distances.sql
├── seeds/              # Sample data for testing and development
│   └── 001_dhaka_bus_routes.sql
└── README.md           # This file
```

## Migrations

### 001_add_bus_amenities.sql
Adds amenity columns to the `buses` table:
- `is_ac` (BOOLEAN): Indicates whether the bus has air conditioning
- `coach_type` (TEXT): Type of coach (standard, express, luxury)
- Includes check constraints and indexes for efficient filtering

**Requirements:** 7.1, 7.2, 7.4

### 002_add_route_distances.sql
Adds distance and duration columns to the `route_stops` table:
- `distance_to_next` (NUMERIC): Pre-calculated distance in kilometers to the next stop
- `duration_to_next` (INTEGER): Estimated duration in seconds to reach the next stop
- Includes check constraints and composite indexes for efficient journey length queries

**Requirements:** 7.1, 7.2, 7.3

## Seed Data

### 001_dhaka_bus_routes.sql
Populates the database with realistic Dhaka bus routes:
- 20 bus stops across major Dhaka locations
- 8 buses with various amenities (AC/Non-AC, Standard/Express/Luxury)
- Complete route definitions with pre-calculated distances and durations
- Both outbound and inbound routes for selected buses

## Running Migrations

### Using Supabase CLI

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Initialize Supabase** (if not already done):
   ```bash
   supabase init
   ```

3. **Link to your Supabase project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Run migrations**:
   ```bash
   supabase db push
   ```

### Manual Execution

If you prefer to run migrations manually through the Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of each migration file in order:
   - First: `001_add_bus_amenities.sql`
   - Second: `002_add_route_distances.sql`
4. Execute each migration

### Running Seed Data

After running migrations, populate the database with sample data:

1. In the Supabase SQL Editor, copy and paste the contents of `seeds/001_dhaka_bus_routes.sql`
2. Execute the seed script

**Note:** The seed script includes `ON CONFLICT DO NOTHING` clauses to prevent duplicate entries if run multiple times.

## Rollback

If you need to rollback these migrations, you can:

### Rollback Bus Amenities (001)
```sql
-- Remove indexes
DROP INDEX IF EXISTS idx_buses_is_ac;
DROP INDEX IF EXISTS idx_buses_coach_type;

-- Remove constraint
ALTER TABLE public.buses DROP CONSTRAINT IF EXISTS buses_coach_type_check;

-- Remove columns
ALTER TABLE public.buses DROP COLUMN IF EXISTS coach_type;
ALTER TABLE public.buses DROP COLUMN IF EXISTS is_ac;
```

### Rollback Route Distances (002)
```sql
-- Remove indexes
DROP INDEX IF EXISTS idx_route_stops_bus_stop_order;
DROP INDEX IF EXISTS idx_route_stops_bus_id_dir;

-- Remove constraints
ALTER TABLE public.route_stops DROP CONSTRAINT IF EXISTS route_stops_duration_check;
ALTER TABLE public.route_stops DROP CONSTRAINT IF EXISTS route_stops_distance_check;

-- Remove columns
ALTER TABLE public.route_stops DROP COLUMN IF EXISTS duration_to_next;
ALTER TABLE public.route_stops DROP COLUMN IF EXISTS distance_to_next;
```

## Verification

After running migrations, verify the schema changes:

```sql
-- Check buses table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'buses'
ORDER BY ordinal_position;

-- Check route_stops table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'route_stops'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('buses', 'route_stops')
ORDER BY tablename, indexname;

-- Verify seed data
SELECT COUNT(*) as bus_count FROM buses;
SELECT COUNT(*) as stop_count FROM stops;
SELECT COUNT(*) as route_stop_count FROM route_stops;
```

## Notes

- All migrations use `IF NOT EXISTS` and `IF EXISTS` clauses to be idempotent
- Seed data uses `ON CONFLICT DO NOTHING` to prevent duplicate entries
- Distance values are in kilometers (NUMERIC with 3 decimal places)
- Duration values are in seconds (INTEGER)
- All UUIDs in seed data are deterministic for consistency across environments
- The seed data represents realistic Dhaka bus routes with approximate distances

## OSRM Setup

For accurate distance calculations in production, you should set up OSRM with Dhaka city map data:

1. Download Bangladesh OSM data from [Geofabrik](https://download.geofabrik.de/asia/bangladesh.html)
2. Extract and process the data for OSRM
3. Configure the OSRM backend with the processed data
4. Update your application's OSRM endpoint configuration

See the main project documentation for detailed OSRM setup instructions.
