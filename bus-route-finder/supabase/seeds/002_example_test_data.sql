-- Example Test Data for Development and Testing
-- This seed file provides additional test scenarios beyond the main seed data
-- Safe to run multiple times due to ON CONFLICT clauses

-- Additional test stops for edge cases
INSERT INTO public.stops (id, name, latitude, longitude, accessible, created_at)
VALUES
  -- Stops very close together (< 100m) for threshold testing
  ('test-stop-close-1', 'Test Close Stop A', 23.7500, 90.4000, true, NOW()),
  ('test-stop-close-2', 'Test Close Stop B', 23.7501, 90.4001, true, NOW()),
  
  -- Stops far apart (> 5km) for threshold testing
  ('test-stop-far-1', 'Test Far Stop A', 23.7000, 90.3500, false, NOW()),
  ('test-stop-far-2', 'Test Far Stop B', 23.7500, 90.4500, false, NOW()),
  
  -- Stops with special characters in names
  ('test-stop-special-1', 'Test Stop (Main)', 23.7600, 90.4100, true, NOW()),
  ('test-stop-special-2', 'Test Stop - Branch #2', 23.7650, 90.4150, true, NOW()),
  
  -- Stops at boundary coordinates
  ('test-stop-boundary-1', 'Test Boundary North', 23.9000, 90.4000, true, NOW()),
  ('test-stop-boundary-2', 'Test Boundary South', 23.6000, 90.4000, true, NOW())
ON CONFLICT (name) DO NOTHING;

-- Test buses with various configurations
INSERT INTO public.buses (id, name, status, is_ac, coach_type, created_at, updated_at)
VALUES
  -- All AC buses for filter testing
  ('test-bus-ac-1', 'Test AC Express #1', 'active', true, 'express', NOW(), NOW()),
  ('test-bus-ac-2', 'Test AC Luxury #1', 'active', true, 'luxury', NOW(), NOW()),
  ('test-bus-ac-3', 'Test AC Standard #1', 'active', true, 'standard', NOW(), NOW()),
  
  -- All Non-AC buses for filter testing
  ('test-bus-nonac-1', 'Test Non-AC Express #1', 'active', false, 'express', NOW(), NOW()),
  ('test-bus-nonac-2', 'Test Non-AC Standard #1', 'active', false, 'standard', NOW(), NOW()),
  
  -- Inactive bus for status filter testing
  ('test-bus-inactive-1', 'Test Inactive Bus', 'inactive', true, 'luxury', NOW(), NOW()),
  
  -- Bus with very short route (< 1km total)
  ('test-bus-short', 'Test Short Route', 'active', false, 'standard', NOW(), NOW()),
  
  -- Bus with very long route (> 20km total)
  ('test-bus-long', 'Test Long Route', 'active', true, 'express', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Test route: Short route with 3 stops
INSERT INTO public.route_stops (id, bus_id, stop_id, stop_order, direction, distance_to_next, duration_to_next, created_at, updated_at)
VALUES
  -- Outbound
  ('test-rs-short-1', 'test-bus-short', 'test-stop-close-1', 1, 'outbound', 0.3, 90, NOW(), NOW()),
  ('test-rs-short-2', 'test-bus-short', 'test-stop-close-2', 2, 'outbound', 0.4, 120, NOW(), NOW()),
  ('test-rs-short-3', 'test-bus-short', 'test-stop-special-1', 3, 'outbound', NULL, NULL, NOW(), NOW()),
  
  -- Inbound
  ('test-rs-short-4', 'test-bus-short', 'test-stop-special-1', 1, 'inbound', 0.4, 120, NOW(), NOW()),
  ('test-rs-short-5', 'test-bus-short', 'test-stop-close-2', 2, 'inbound', 0.3, 90, NOW(), NOW()),
  ('test-rs-short-6', 'test-bus-short', 'test-stop-close-1', 3, 'inbound', NULL, NULL, NOW(), NOW())
ON CONFLICT (bus_id, stop_id, direction) DO NOTHING;

-- Test route: Long route with many stops
INSERT INTO public.route_stops (id, bus_id, stop_id, stop_order, direction, distance_to_next, duration_to_next, created_at, updated_at)
VALUES
  -- Outbound (using existing stops from main seed)
  ('test-rs-long-1', 'test-bus-long', 'test-stop-boundary-2', 1, 'outbound', 5.2, 900, NOW(), NOW()),
  ('test-rs-long-2', 'test-bus-long', 'test-stop-far-1', 2, 'outbound', 4.8, 840, NOW(), NOW()),
  ('test-rs-long-3', 'test-bus-long', 'test-stop-close-1', 3, 'outbound', 3.5, 600, NOW(), NOW()),
  ('test-rs-long-4', 'test-bus-long', 'test-stop-special-2', 4, 'outbound', 4.2, 720, NOW(), NOW()),
  ('test-rs-long-5', 'test-bus-long', 'test-stop-far-2', 5, 'outbound', 3.8, 660, NOW(), NOW()),
  ('test-rs-long-6', 'test-bus-long', 'test-stop-boundary-1', 6, 'outbound', NULL, NULL, NOW(), NOW())
ON CONFLICT (bus_id, stop_id, direction) DO NOTHING;

-- Test route: Route with missing distance_to_next values (for fallback testing)
INSERT INTO public.route_stops (id, bus_id, stop_id, stop_order, direction, distance_to_next, duration_to_next, created_at, updated_at)
VALUES
  ('test-rs-missing-1', 'test-bus-ac-1', 'test-stop-close-1', 1, 'outbound', NULL, NULL, NOW(), NOW()),
  ('test-rs-missing-2', 'test-bus-ac-1', 'test-stop-close-2', 2, 'outbound', NULL, NULL, NOW(), NOW()),
  ('test-rs-missing-3', 'test-bus-ac-1', 'test-stop-special-1', 3, 'outbound', NULL, NULL, NOW(), NOW())
ON CONFLICT (bus_id, stop_id, direction) DO NOTHING;

-- Test route: Complex route for filter testing
-- This route connects multiple test stops with various distances
INSERT INTO public.route_stops (id, bus_id, stop_id, stop_order, direction, distance_to_next, duration_to_next, created_at, updated_at)
VALUES
  -- AC Express bus
  ('test-rs-filter-1', 'test-bus-ac-2', 'test-stop-far-1', 1, 'outbound', 2.5, 450, NOW(), NOW()),
  ('test-rs-filter-2', 'test-bus-ac-2', 'test-stop-close-1', 2, 'outbound', 1.8, 324, NOW(), NOW()),
  ('test-rs-filter-3', 'test-bus-ac-2', 'test-stop-special-1', 3, 'outbound', 2.2, 396, NOW(), NOW()),
  ('test-rs-filter-4', 'test-bus-ac-2', 'test-stop-far-2', 4, 'outbound', NULL, NULL, NOW(), NOW()),
  
  -- Non-AC Standard bus (same route for comparison)
  ('test-rs-filter-5', 'test-bus-nonac-2', 'test-stop-far-1', 1, 'outbound', 2.5, 450, NOW(), NOW()),
  ('test-rs-filter-6', 'test-bus-nonac-2', 'test-stop-close-1', 2, 'outbound', 1.8, 324, NOW(), NOW()),
  ('test-rs-filter-7', 'test-bus-nonac-2', 'test-stop-special-1', 3, 'outbound', 2.2, 396, NOW(), NOW()),
  ('test-rs-filter-8', 'test-bus-nonac-2', 'test-stop-far-2', 4, 'outbound', NULL, NULL, NOW(), NOW())
ON CONFLICT (bus_id, stop_id, direction) DO NOTHING;

-- Verification queries (commented out, uncomment to run)
/*
-- Verify test stops
SELECT COUNT(*) as test_stop_count FROM stops WHERE name LIKE 'Test%';

-- Verify test buses
SELECT name, is_ac, coach_type, status FROM buses WHERE name LIKE 'Test%';

-- Verify test routes
SELECT 
  b.name as bus_name,
  COUNT(*) as stop_count,
  SUM(rs.distance_to_next) as total_distance,
  COUNT(*) FILTER (WHERE rs.distance_to_next IS NULL) as missing_distances
FROM route_stops rs
JOIN buses b ON b.id = rs.bus_id
WHERE b.name LIKE 'Test%'
GROUP BY b.id, b.name
ORDER BY b.name;

-- Test filter scenarios
-- AC buses only
SELECT name, is_ac, coach_type FROM buses WHERE is_ac = true AND name LIKE 'Test%';

-- Express buses only
SELECT name, is_ac, coach_type FROM buses WHERE coach_type = 'express' AND name LIKE 'Test%';

-- AC Express buses
SELECT name, is_ac, coach_type FROM buses 
WHERE is_ac = true AND coach_type = 'express' AND name LIKE 'Test%';

-- Test journey length calculation
SELECT 
  b.name,
  rs.stop_order,
  s.name as stop_name,
  rs.distance_to_next,
  SUM(rs.distance_to_next) OVER (
    PARTITION BY rs.bus_id, rs.direction 
    ORDER BY rs.stop_order
  ) as cumulative_distance
FROM route_stops rs
JOIN buses b ON b.id = rs.bus_id
JOIN stops s ON s.id = rs.stop_id
WHERE b.name = 'Test Short Route' AND rs.direction = 'outbound'
ORDER BY rs.stop_order;
*/

-- Comments for documentation
COMMENT ON TABLE public.stops IS 'Bus stops with geographic coordinates and accessibility information';
COMMENT ON TABLE public.buses IS 'Bus information including amenities (AC, coach type) and status';
COMMENT ON TABLE public.route_stops IS 'Bus route definitions with stop sequences and pre-calculated distances';

COMMENT ON COLUMN public.stops.accessible IS 'Whether the stop has accessibility features for disabled passengers';
COMMENT ON COLUMN public.buses.is_ac IS 'Indicates whether the bus has air conditioning';
COMMENT ON COLUMN public.buses.coach_type IS 'Type of coach: standard, express, or luxury';
COMMENT ON COLUMN public.buses.status IS 'Bus operational status: active or inactive';
COMMENT ON COLUMN public.route_stops.distance_to_next IS 'Pre-calculated distance in kilometers to the next stop in the route';
COMMENT ON COLUMN public.route_stops.duration_to_next IS 'Estimated duration in seconds to reach the next stop';
COMMENT ON COLUMN public.route_stops.stop_order IS 'Sequential order of the stop in the route (1-indexed)';
COMMENT ON COLUMN public.route_stops.direction IS 'Route direction: outbound or inbound';
