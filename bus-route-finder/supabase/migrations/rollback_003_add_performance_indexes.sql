-- Rollback: Remove performance indexes
-- This script removes all indexes added in 003_add_performance_indexes.sql

-- Drop stop coordinate index
DROP INDEX IF EXISTS public.idx_stops_coordinates;

-- Drop bus filter indexes
DROP INDEX IF EXISTS public.idx_buses_is_ac;
DROP INDEX IF EXISTS public.idx_buses_coach_type;
DROP INDEX IF EXISTS public.idx_buses_status_ac;
DROP INDEX IF EXISTS public.idx_buses_status_coach;

-- Drop route_stops indexes
DROP INDEX IF EXISTS public.idx_route_stops_stop_id;
DROP INDEX IF EXISTS public.idx_route_stops_bus_order_dir;
DROP INDEX IF EXISTS public.idx_route_stops_bus_stop_dir;
DROP INDEX IF EXISTS public.idx_route_stops_distance;
