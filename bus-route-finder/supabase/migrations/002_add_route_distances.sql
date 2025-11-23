-- Migration: Add distance and duration columns to route_stops table
-- Description: Adds pre-calculated distance and duration between consecutive stops
-- Requirements: 7.1, 7.2, 7.3

-- Add distance_to_next column (in kilometers)
ALTER TABLE public.route_stops
ADD COLUMN IF NOT EXISTS distance_to_next NUMERIC(10, 3) NULL;

-- Add duration_to_next column (in seconds)
ALTER TABLE public.route_stops
ADD COLUMN IF NOT EXISTS duration_to_next INTEGER NULL;

-- Add check constraints for valid values
ALTER TABLE public.route_stops
ADD CONSTRAINT route_stops_distance_check 
CHECK (distance_to_next IS NULL OR distance_to_next >= 0);

ALTER TABLE public.route_stops
ADD CONSTRAINT route_stops_duration_check 
CHECK (duration_to_next IS NULL OR duration_to_next >= 0);

-- Create composite index for efficient journey length queries
CREATE INDEX IF NOT EXISTS idx_route_stops_bus_stop_order 
ON public.route_stops USING btree (bus_id, stop_order, direction);

-- Create index for bus_id and direction lookups
CREATE INDEX IF NOT EXISTS idx_route_stops_bus_id_dir 
ON public.route_stops USING btree (bus_id, direction);

-- Add comments for documentation
COMMENT ON COLUMN public.route_stops.distance_to_next IS 'Pre-calculated distance in kilometers to the next stop in the route';
COMMENT ON COLUMN public.route_stops.duration_to_next IS 'Estimated duration in seconds to reach the next stop';
