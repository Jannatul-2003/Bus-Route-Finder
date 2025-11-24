-- Migration: Add performance indexes for threshold-based route planning
-- Requirements 2.1, 2.2, 5.1, 6.7: Optimize Supabase queries with proper indexes
-- This migration adds indexes to improve query performance for:
-- 1. Stop discovery by coordinates
-- 2. Bus route queries
-- 3. Filter operations (AC, coach type)
-- 4. Journey length calculations

-- Index for spatial queries on stops (latitude, longitude)
-- Improves performance of stop discovery queries
CREATE INDEX IF NOT EXISTS idx_stops_coordinates 
ON public.stops USING btree (latitude, longitude);

-- Index for bus filtering by AC status
-- Improves performance of AC filter queries
CREATE INDEX IF NOT EXISTS idx_buses_is_ac 
ON public.buses USING btree (is_ac) 
WHERE status = 'active';

-- Index for bus filtering by coach type
-- Improves performance of coach type filter queries
CREATE INDEX IF NOT EXISTS idx_buses_coach_type 
ON public.buses USING btree (coach_type) 
WHERE status = 'active';

-- Composite index for bus status and AC (common filter combination)
-- Improves performance when filtering by both status and AC
CREATE INDEX IF NOT EXISTS idx_buses_status_ac 
ON public.buses USING btree (status, is_ac);

-- Composite index for bus status and coach type (common filter combination)
-- Improves performance when filtering by both status and coach type
CREATE INDEX IF NOT EXISTS idx_buses_status_coach 
ON public.buses USING btree (status, coach_type);

-- Index for route_stops queries by stop_id
-- Improves performance when finding buses serving a specific stop
CREATE INDEX IF NOT EXISTS idx_route_stops_stop_id 
ON public.route_stops USING btree (stop_id);

-- Composite index for route_stops queries (bus_id, stop_order, direction)
-- Improves performance of journey length calculations
CREATE INDEX IF NOT EXISTS idx_route_stops_bus_order_dir 
ON public.route_stops USING btree (bus_id, stop_order, direction);

-- Composite index for finding buses between two stops
-- Improves performance of bus route queries
CREATE INDEX IF NOT EXISTS idx_route_stops_bus_stop_dir 
ON public.route_stops USING btree (bus_id, stop_id, direction);

-- Index for distance_to_next column (used in journey length calculations)
-- Improves performance when summing segment distances
CREATE INDEX IF NOT EXISTS idx_route_stops_distance 
ON public.route_stops USING btree (distance_to_next) 
WHERE distance_to_next IS NOT NULL;

-- Add comments for documentation
COMMENT ON INDEX idx_stops_coordinates IS 'Optimizes stop discovery queries by coordinates';
COMMENT ON INDEX idx_buses_is_ac IS 'Optimizes AC filter queries for active buses';
COMMENT ON INDEX idx_buses_coach_type IS 'Optimizes coach type filter queries for active buses';
COMMENT ON INDEX idx_buses_status_ac IS 'Optimizes combined status and AC filter queries';
COMMENT ON INDEX idx_buses_status_coach IS 'Optimizes combined status and coach type filter queries';
COMMENT ON INDEX idx_route_stops_stop_id IS 'Optimizes queries finding buses serving a stop';
COMMENT ON INDEX idx_route_stops_bus_order_dir IS 'Optimizes journey length calculation queries';
COMMENT ON INDEX idx_route_stops_bus_stop_dir IS 'Optimizes bus route discovery queries';
COMMENT ON INDEX idx_route_stops_distance IS 'Optimizes distance aggregation queries';
