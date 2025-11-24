# Database Migration Guide

## Overview

This guide provides comprehensive instructions for managing database migrations for the Dhaka Bus Route Planning system. The migrations add essential columns for bus amenities and pre-calculated route distances.

## Prerequisites

Before running migrations, ensure you have:

1. **Supabase Project**: An active Supabase project
2. **Database Access**: Admin access to your Supabase database
3. **Supabase CLI** (optional but recommended): For automated migration management

## Migration Files

### Location

All migration files are located in: `supabase/migrations/`

### Available Migrations

1. **001_add_bus_amenities.sql**
   - Adds `is_ac` and `coach_type` columns to `buses` table
   - Creates indexes for efficient filtering
   - Requirements: 7.1, 7.2, 7.4

2. **002_add_route_distances.sql**
   - Adds `distance_to_next` and `duration_to_next` columns to `route_stops` table
   - Creates composite indexes for journey length queries
   - Requirements: 7.1, 7.2, 7.3

3. **003_add_performance_indexes.sql**
   - Adds additional performance indexes
   - Optimizes common query patterns

## Installation Methods

### Method 1: Supabase CLI (Recommended)

The Supabase CLI provides the most reliable and automated way to manage migrations.

#### Step 1: Install Supabase CLI

**Using npm:**
```bash
npm install -g supabase
```

**Using Homebrew (macOS):**
```bash
brew install supabase/tap/supabase
```

**Using Scoop (Windows):**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Verify installation:**
```bash
supabase --version
```

#### Step 2: Initialize Supabase (if not already done)

```bash
# In your project root
supabase init
```

This creates a `supabase/` directory with configuration files.

#### Step 3: Link to Your Supabase Project

```bash
supabase link --project-ref your-project-ref
```

**Finding your project ref:**
1. Go to your Supabase dashboard
2. Navigate to Settings > General
3. Copy the "Reference ID"

**Alternative - Link with database URL:**
```bash
supabase link --db-url postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

#### Step 4: Run Migrations

```bash
# Push all pending migrations to the database
supabase db push

# Or run migrations remotely
supabase db remote commit
```

**Verify migrations:**
```bash
# Check migration status
supabase migration list

# View applied migrations
supabase db remote changes
```

### Method 2: Supabase Dashboard (Manual)

If you prefer a GUI approach or don't want to install the CLI:

#### Step 1: Access SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

#### Step 2: Run Migrations in Order

**Important:** Run migrations in numerical order!

1. **First Migration - Bus Amenities:**
   - Open `supabase/migrations/001_add_bus_amenities.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click **Run** or press `Ctrl+Enter`
   - Verify success message

2. **Second Migration - Route Distances:**
   - Open `supabase/migrations/002_add_route_distances.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click **Run**
   - Verify success message

3. **Third Migration - Performance Indexes:**
   - Open `supabase/migrations/003_add_performance_indexes.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click **Run**
   - Verify success message

#### Step 3: Verify Migrations

Run this verification query in the SQL Editor:

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
```

### Method 3: Direct Database Connection

For advanced users with direct database access:

```bash
# Connect to your database
psql postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Run migrations
\i supabase/migrations/001_add_bus_amenities.sql
\i supabase/migrations/002_add_route_distances.sql
\i supabase/migrations/003_add_performance_indexes.sql

# Exit
\q
```

## Seed Data

After running migrations, populate the database with sample data for testing.

### Running Seed Data

#### Using Supabase CLI:

```bash
supabase db seed
```

#### Using Dashboard:

1. Open SQL Editor
2. Open `supabase/seeds/001_dhaka_bus_routes.sql`
3. Copy and paste the contents
4. Click **Run**

### Seed Data Contents

The seed file (`001_dhaka_bus_routes.sql`) includes:

- **20 bus stops** across major Dhaka locations:
  - Mohakhali, Farmgate, Shahbag, Dhanmondi, Mirpur
  - Uttara, Gulshan, Banani, Motijheel, Sadarghat
  - And more...

- **8 buses** with various configurations:
  - AC and Non-AC buses
  - Standard, Express, and Luxury coach types
  - Active status

- **Complete route definitions**:
  - Pre-calculated distances between stops
  - Duration estimates
  - Both outbound and inbound routes

**Note:** The seed script uses `ON CONFLICT DO NOTHING` to prevent duplicate entries, making it safe to run multiple times.

## Verification

### Verify Schema Changes

Run this comprehensive verification query:

```sql
-- 1. Check buses table has new columns
SELECT 
  COUNT(*) FILTER (WHERE column_name = 'is_ac') as has_is_ac,
  COUNT(*) FILTER (WHERE column_name = 'coach_type') as has_coach_type
FROM information_schema.columns
WHERE table_name = 'buses';

-- 2. Check route_stops table has new columns
SELECT 
  COUNT(*) FILTER (WHERE column_name = 'distance_to_next') as has_distance,
  COUNT(*) FILTER (WHERE column_name = 'duration_to_next') as has_duration
FROM information_schema.columns
WHERE table_name = 'route_stops';

-- 3. Check indexes exist
SELECT 
  COUNT(*) FILTER (WHERE indexname = 'idx_buses_is_ac') as has_ac_index,
  COUNT(*) FILTER (WHERE indexname = 'idx_buses_coach_type') as has_coach_type_index,
  COUNT(*) FILTER (WHERE indexname = 'idx_route_stops_bus_stop_order') as has_route_index
FROM pg_indexes
WHERE tablename IN ('buses', 'route_stops');

-- 4. Check constraints
SELECT 
  constraint_name,
  table_name
FROM information_schema.table_constraints
WHERE table_name IN ('buses', 'route_stops')
  AND constraint_type = 'CHECK'
ORDER BY table_name, constraint_name;
```

Expected results:
- `has_is_ac`: 1
- `has_coach_type`: 1
- `has_distance`: 1
- `has_duration`: 1
- All index counts: 1
- Constraints should include: `buses_coach_type_check`, `route_stops_distance_check`, `route_stops_duration_check`

### Verify Seed Data

```sql
-- Check data counts
SELECT 
  (SELECT COUNT(*) FROM buses) as bus_count,
  (SELECT COUNT(*) FROM stops) as stop_count,
  (SELECT COUNT(*) FROM route_stops) as route_stop_count;

-- Check bus amenities are populated
SELECT 
  name,
  is_ac,
  coach_type,
  status
FROM buses
ORDER BY name;

-- Check route distances are populated
SELECT 
  b.name as bus_name,
  COUNT(*) as stop_count,
  COUNT(*) FILTER (WHERE rs.distance_to_next IS NOT NULL) as stops_with_distance,
  SUM(rs.distance_to_next) as total_route_length
FROM route_stops rs
JOIN buses b ON b.id = rs.bus_id
WHERE rs.direction = 'outbound'
GROUP BY b.id, b.name
ORDER BY b.name;
```

Expected results:
- At least 8 buses
- At least 20 stops
- Multiple route_stops entries
- All buses should have `is_ac` and `coach_type` values
- Most route_stops should have `distance_to_next` values

## Rollback Procedures

If you need to undo migrations, use the rollback scripts.

### Rollback Files

Located in `supabase/migrations/`:
- `rollback_001_add_bus_amenities.sql`
- `rollback_002_add_route_distances.sql`
- `rollback_003_add_performance_indexes.sql`

### Rollback Using CLI

```bash
# Rollback last migration
supabase db reset

# Or manually run rollback scripts
supabase db execute --file supabase/migrations/rollback_003_add_performance_indexes.sql
supabase db execute --file supabase/migrations/rollback_002_add_route_distances.sql
supabase db execute --file supabase/migrations/rollback_001_add_bus_amenities.sql
```

### Rollback Using Dashboard

Run rollback scripts in reverse order:

1. Open SQL Editor
2. Run `rollback_003_add_performance_indexes.sql`
3. Run `rollback_002_add_route_distances.sql`
4. Run `rollback_001_add_bus_amenities.sql`

### Manual Rollback

#### Rollback Bus Amenities (001)

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

#### Rollback Route Distances (002)

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

## Troubleshooting

### Common Issues

#### Issue 1: "relation already exists"

**Cause:** Migration has already been run

**Solution:** This is safe to ignore. The migrations use `IF NOT EXISTS` clauses to be idempotent.

#### Issue 2: "permission denied"

**Cause:** Insufficient database permissions

**Solution:** 
- Ensure you're using the `postgres` role
- Check your database connection string includes the correct password
- Verify your Supabase project is active

#### Issue 3: "column already exists"

**Cause:** Partial migration was run previously

**Solution:**
```sql
-- Check which columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name IN ('buses', 'route_stops');

-- Run only the missing parts of the migration
```

#### Issue 4: Seed data fails with "duplicate key"

**Cause:** Seed data has already been inserted

**Solution:** This is safe to ignore. The seed script uses `ON CONFLICT DO NOTHING`.

#### Issue 5: "constraint violation"

**Cause:** Existing data doesn't meet new constraints

**Solution:**
```sql
-- Check for invalid data
SELECT * FROM buses WHERE coach_type NOT IN ('standard', 'express', 'luxury');
SELECT * FROM route_stops WHERE distance_to_next < 0;

-- Fix invalid data before running migration
UPDATE buses SET coach_type = 'standard' WHERE coach_type IS NULL;
```

### Getting Help

If you encounter issues:

1. **Check Supabase Logs:**
   - Dashboard > Logs > Database Logs

2. **Verify Connection:**
   ```bash
   supabase db ping
   ```

3. **Check Migration Status:**
   ```bash
   supabase migration list
   ```

4. **Community Support:**
   - [Supabase Discord](https://discord.supabase.com)
   - [Supabase GitHub Discussions](https://github.com/supabase/supabase/discussions)

## Best Practices

### 1. Backup Before Migrating

Always backup your database before running migrations:

```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Or from dashboard: Database > Backups > Create Backup
```

### 2. Test in Development First

1. Create a separate Supabase project for development
2. Run migrations there first
3. Verify everything works
4. Then apply to production

### 3. Version Control

Keep migration files in version control:
```bash
git add supabase/migrations/
git commit -m "Add bus amenities and route distances migrations"
```

### 4. Document Custom Changes

If you modify migrations, document the changes:
```sql
-- Migration: 001_add_bus_amenities.sql
-- Modified: 2024-01-15
-- Changes: Added custom index for performance
-- Author: Your Name
```

### 5. Monitor Performance

After migrations, monitor query performance:
```sql
-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename IN ('buses', 'route_stops')
ORDER BY idx_scan DESC;
```

## Production Deployment Checklist

Before deploying to production:

- [ ] Backup production database
- [ ] Test migrations in development environment
- [ ] Review all migration files for correctness
- [ ] Verify rollback scripts work
- [ ] Schedule maintenance window (if needed)
- [ ] Run migrations during low-traffic period
- [ ] Verify schema changes
- [ ] Run seed data (if applicable)
- [ ] Test application functionality
- [ ] Monitor for errors
- [ ] Document deployment in changelog

## Maintenance

### Updating Pre-calculated Distances

If you need to recalculate route distances:

```sql
-- This would typically be done with a script that uses OSRM
-- See scripts/populate-route-distances.ts for the implementation

-- Check for missing distances
SELECT 
  b.name,
  rs.stop_order,
  rs.direction,
  rs.distance_to_next
FROM route_stops rs
JOIN buses b ON b.id = rs.bus_id
WHERE rs.distance_to_next IS NULL
ORDER BY b.name, rs.direction, rs.stop_order;
```

### Adding New Buses

When adding new buses, ensure amenity fields are populated:

```sql
INSERT INTO buses (name, status, is_ac, coach_type)
VALUES 
  ('New Express Bus', 'active', true, 'express'),
  ('New Standard Bus', 'active', false, 'standard');
```

### Adding New Routes

When adding new routes, include distance calculations:

```sql
INSERT INTO route_stops (bus_id, stop_id, stop_order, direction, distance_to_next)
VALUES 
  ('bus-uuid', 'stop-uuid-1', 1, 'outbound', 2.5),
  ('bus-uuid', 'stop-uuid-2', 2, 'outbound', 1.8),
  ('bus-uuid', 'stop-uuid-3', 3, 'outbound', NULL); -- Last stop has NULL
```

## Related Documentation

- [Supabase README](../supabase/README.md)
- [OSRM Setup Guide](./OSRM_SETUP.md)
- [Design Document](../.kiro/specs/threshold-based-route-planning/design.md)
- [API Routes Documentation](../API_ROUTES_IMPLEMENTATION.md)
