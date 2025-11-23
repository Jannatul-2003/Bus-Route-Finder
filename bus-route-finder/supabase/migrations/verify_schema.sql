-- Verification Script: Check database schema after migrations
-- Description: Verifies that all migrations have been applied correctly

-- Check buses table structure
SELECT 
    'buses table columns' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'buses'
ORDER BY ordinal_position;

-- Check route_stops table structure
SELECT 
    'route_stops table columns' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'route_stops'
ORDER BY ordinal_position;

-- Check constraints on buses table
SELECT 
    'buses constraints' as check_type,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' 
    AND table_name = 'buses'
ORDER BY constraint_name;

-- Check constraints on route_stops table
SELECT 
    'route_stops constraints' as check_type,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' 
    AND table_name = 'route_stops'
ORDER BY constraint_name;

-- Check indexes on buses table
SELECT 
    'buses indexes' as check_type,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
    AND tablename = 'buses'
ORDER BY indexname;

-- Check indexes on route_stops table
SELECT 
    'route_stops indexes' as check_type,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
    AND tablename = 'route_stops'
ORDER BY indexname;

-- Verify data counts (if seed data has been run)
SELECT 
    'data counts' as check_type,
    'buses' as table_name,
    COUNT(*) as record_count
FROM public.buses
UNION ALL
SELECT 
    'data counts' as check_type,
    'stops' as table_name,
    COUNT(*) as record_count
FROM public.stops
UNION ALL
SELECT 
    'data counts' as check_type,
    'route_stops' as table_name,
    COUNT(*) as record_count
FROM public.route_stops;

-- Check for buses with amenities
SELECT 
    'bus amenities distribution' as check_type,
    is_ac,
    coach_type,
    COUNT(*) as count
FROM public.buses
GROUP BY is_ac, coach_type
ORDER BY is_ac, coach_type;

-- Check for route_stops with distances
SELECT 
    'route distance statistics' as check_type,
    COUNT(*) as total_segments,
    COUNT(distance_to_next) as segments_with_distance,
    COUNT(duration_to_next) as segments_with_duration,
    ROUND(AVG(distance_to_next)::numeric, 2) as avg_distance_km,
    ROUND(AVG(duration_to_next)::numeric, 0) as avg_duration_seconds
FROM public.route_stops;

-- Sample query: Find buses between two stops with journey length
-- This validates that the schema supports the core use case
SELECT 
    'sample journey query' as check_type,
    b.name as bus_name,
    b.is_ac,
    b.coach_type,
    SUM(rs.distance_to_next) as journey_length_km
FROM public.buses b
JOIN public.route_stops rs ON b.id = rs.bus_id
WHERE rs.bus_id IN (
    SELECT DISTINCT rs1.bus_id
    FROM public.route_stops rs1
    JOIN public.route_stops rs2 ON rs1.bus_id = rs2.bus_id 
        AND rs1.direction = rs2.direction
    WHERE rs1.stop_id = '550e8400-e29b-41d4-a716-446655440002' -- Farmgate
        AND rs2.stop_id = '550e8400-e29b-41d4-a716-446655440003' -- Shahbag
        AND rs1.stop_order < rs2.stop_order
)
AND rs.stop_order >= (
    SELECT stop_order FROM public.route_stops 
    WHERE bus_id = rs.bus_id 
        AND stop_id = '550e8400-e29b-41d4-a716-446655440002'
        AND direction = rs.direction
)
AND rs.stop_order < (
    SELECT stop_order FROM public.route_stops 
    WHERE bus_id = rs.bus_id 
        AND stop_id = '550e8400-e29b-41d4-a716-446655440003'
        AND direction = rs.direction
)
GROUP BY b.id, b.name, b.is_ac, b.coach_type
ORDER BY journey_length_km;
