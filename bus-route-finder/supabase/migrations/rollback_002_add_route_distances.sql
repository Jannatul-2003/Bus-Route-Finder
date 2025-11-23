-- Rollback Migration: Remove distance and duration columns from route_stops table
-- Description: Reverts changes made by 002_add_route_distances.sql

-- Remove indexes
DROP INDEX IF EXISTS public.idx_route_stops_bus_stop_order;
DROP INDEX IF EXISTS public.idx_route_stops_bus_id_dir;

-- Remove constraints
ALTER TABLE public.route_stops 
DROP CONSTRAINT IF EXISTS route_stops_duration_check;

ALTER TABLE public.route_stops 
DROP CONSTRAINT IF EXISTS route_stops_distance_check;

-- Remove columns
ALTER TABLE public.route_stops 
DROP COLUMN IF EXISTS duration_to_next;

ALTER TABLE public.route_stops 
DROP COLUMN IF EXISTS distance_to_next;
