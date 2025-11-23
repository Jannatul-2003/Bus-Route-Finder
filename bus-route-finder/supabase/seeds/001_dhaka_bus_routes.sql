-- Seed Data: Sample Dhaka bus routes with distances
-- Description: Populates database with realistic Dhaka bus routes including stops and distances
-- Requirements: 7.1, 7.2, 7.3, 7.4

-- Clear existing data (optional - comment out if you want to preserve existing data)
-- DELETE FROM public.route_stops;
-- DELETE FROM public.buses;
-- DELETE FROM public.stops;

-- Insert sample bus stops in Dhaka
INSERT INTO public.stops (id, name, latitude, longitude, accessible, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Mohakhali Bus Terminal', 23.7808, 90.4044, true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'Farmgate', 23.7575, 90.3889, true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'Shahbag', 23.7389, 90.3958, true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', 'Press Club', 23.7342, 90.3964, true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440005', 'Paltan', 23.7344, 90.4119, true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440006', 'Gulistan', 23.7267, 90.4128, true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440007', 'Sadarghat', 23.7106, 90.4078, false, NOW()),
  ('550e8400-e29b-41d4-a716-446655440008', 'Motijheel', 23.7331, 90.4172, true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440009', 'Kamalapur', 23.7289, 90.4264, true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440010', 'Malibagh', 23.7428, 90.4142, true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440011', 'Rampura', 23.7575, 90.4244, true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440012', 'Banani', 23.7939, 90.4044, true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440013', 'Uttara', 23.8759, 90.3795, true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440014', 'Mirpur 10', 23.8069, 90.3681, true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440015', 'Mirpur 1', 23.7956, 90.3537, true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440016', 'Gabtoli', 23.7789, 90.3431, true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440017', 'Dhanmondi 27', 23.7456, 90.3756, true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440018', 'Dhanmondi 32', 23.7489, 90.3711, true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440019', 'Science Lab', 23.7428, 90.3881, true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440020', 'Kalabagan', 23.7403, 90.3828, true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample buses with amenities
INSERT INTO public.buses (id, name, status, is_ac, coach_type, created_at, updated_at) VALUES
  ('650e8400-e29b-41d4-a716-446655440001', 'Dhaka Express - 101', 'active', true, 'express', NOW(), NOW()),
  ('650e8400-e29b-41d4-a716-446655440002', 'City Service - 42', 'active', false, 'standard', NOW(), NOW()),
  ('650e8400-e29b-41d4-a716-446655440003', 'Luxury Paribahan - 15', 'active', true, 'luxury', NOW(), NOW()),
  ('650e8400-e29b-41d4-a716-446655440004', 'Metro Link - 88', 'active', true, 'express', NOW(), NOW()),
  ('650e8400-e29b-41d4-a716-446655440005', 'Standard Route - 25', 'active', false, 'standard', NOW(), NOW()),
  ('650e8400-e29b-41d4-a716-446655440006', 'Green Line - 7', 'active', true, 'luxury', NOW(), NOW()),
  ('650e8400-e29b-41d4-a716-446655440007', 'City Circle - 33', 'active', false, 'standard', NOW(), NOW()),
  ('650e8400-e29b-41d4-a716-446655440008', 'Express AC - 99', 'active', true, 'express', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Route 1: Dhaka Express - 101 (Uttara to Sadarghat via Mohakhali, Farmgate, Shahbag)
-- Outbound direction
INSERT INTO public.route_stops (bus_id, stop_id, stop_order, direction, distance_to_next, duration_to_next, created_at, updated_at) VALUES
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440013', 1, 'outbound', 8.5, 900, NOW(), NOW()),  -- Uttara to Mohakhali
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 2, 'outbound', 2.8, 420, NOW(), NOW()),  -- Mohakhali to Farmgate
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 3, 'outbound', 2.1, 360, NOW(), NOW()),  -- Farmgate to Shahbag
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 4, 'outbound', 0.6, 180, NOW(), NOW()),  -- Shahbag to Press Club
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 5, 'outbound', 1.8, 300, NOW(), NOW()),  -- Press Club to Paltan
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 6, 'outbound', 0.9, 240, NOW(), NOW()),  -- Paltan to Gulistan
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006', 7, 'outbound', 1.9, 420, NOW(), NOW()),  -- Gulistan to Sadarghat
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440007', 8, 'outbound', NULL, NULL, NOW(), NOW())  -- Sadarghat (end)
ON CONFLICT (bus_id, stop_id, direction) DO NOTHING;

-- Route 2: City Service - 42 (Mirpur 10 to Motijheel via Farmgate, Shahbag)
INSERT INTO public.route_stops (bus_id, stop_id, stop_order, direction, distance_to_next, duration_to_next, created_at, updated_at) VALUES
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440014', 1, 'outbound', 3.2, 540, NOW(), NOW()),  -- Mirpur 10 to Farmgate
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 2, 'outbound', 2.1, 360, NOW(), NOW()),  -- Farmgate to Shahbag
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 3, 'outbound', 0.6, 180, NOW(), NOW()),  -- Shahbag to Press Club
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 4, 'outbound', 1.8, 300, NOW(), NOW()),  -- Press Club to Paltan
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 5, 'outbound', 1.2, 300, NOW(), NOW()),  -- Paltan to Motijheel
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440008', 6, 'outbound', NULL, NULL, NOW(), NOW())  -- Motijheel (end)
ON CONFLICT (bus_id, stop_id, direction) DO NOTHING;

-- Route 3: Luxury Paribahan - 15 (Banani to Kamalapur via Mohakhali, Malibagh)
INSERT INTO public.route_stops (bus_id, stop_id, stop_order, direction, distance_to_next, duration_to_next, created_at, updated_at) VALUES
  ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440012', 1, 'outbound', 1.5, 300, NOW(), NOW()),  -- Banani to Mohakhali
  ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 2, 'outbound', 2.8, 420, NOW(), NOW()),  -- Mohakhali to Farmgate
  ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 3, 'outbound', 2.5, 480, NOW(), NOW()),  -- Farmgate to Malibagh
  ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440010', 4, 'outbound', 1.8, 360, NOW(), NOW()),  -- Malibagh to Kamalapur
  ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440009', 5, 'outbound', NULL, NULL, NOW(), NOW())  -- Kamalapur (end)
ON CONFLICT (bus_id, stop_id, direction) DO NOTHING;

-- Route 4: Metro Link - 88 (Uttara to Gulistan via Banani, Mohakhali, Farmgate)
INSERT INTO public.route_stops (bus_id, stop_id, stop_order, direction, distance_to_next, duration_to_next, created_at, updated_at) VALUES
  ('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440013', 1, 'outbound', 6.8, 720, NOW(), NOW()),  -- Uttara to Banani
  ('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440012', 2, 'outbound', 1.5, 300, NOW(), NOW()),  -- Banani to Mohakhali
  ('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 3, 'outbound', 2.8, 420, NOW(), NOW()),  -- Mohakhali to Farmgate
  ('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 4, 'outbound', 2.1, 360, NOW(), NOW()),  -- Farmgate to Shahbag
  ('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 5, 'outbound', 1.5, 300, NOW(), NOW()),  -- Shahbag to Gulistan
  ('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440006', 6, 'outbound', NULL, NULL, NOW(), NOW())  -- Gulistan (end)
ON CONFLICT (bus_id, stop_id, direction) DO NOTHING;

-- Route 5: Standard Route - 25 (Gabtoli to Motijheel via Mirpur, Farmgate, Shahbag)
INSERT INTO public.route_stops (bus_id, stop_id, stop_order, direction, distance_to_next, duration_to_next, created_at, updated_at) VALUES
  ('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440016', 1, 'outbound', 2.5, 480, NOW(), NOW()),  -- Gabtoli to Mirpur 1
  ('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440015', 2, 'outbound', 1.8, 360, NOW(), NOW()),  -- Mirpur 1 to Mirpur 10
  ('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440014', 3, 'outbound', 3.2, 540, NOW(), NOW()),  -- Mirpur 10 to Farmgate
  ('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 4, 'outbound', 2.1, 360, NOW(), NOW()),  -- Farmgate to Shahbag
  ('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 5, 'outbound', 1.5, 300, NOW(), NOW()),  -- Shahbag to Paltan
  ('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 6, 'outbound', 1.2, 300, NOW(), NOW()),  -- Paltan to Motijheel
  ('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440008', 7, 'outbound', NULL, NULL, NOW(), NOW())  -- Motijheel (end)
ON CONFLICT (bus_id, stop_id, direction) DO NOTHING;

-- Route 6: Green Line - 7 (Dhanmondi to Rampura via Farmgate, Shahbag, Malibagh)
INSERT INTO public.route_stops (bus_id, stop_id, stop_order, direction, distance_to_next, duration_to_next, created_at, updated_at) VALUES
  ('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440017', 1, 'outbound', 1.2, 300, NOW(), NOW()),  -- Dhanmondi 27 to Science Lab
  ('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440019', 2, 'outbound', 1.5, 300, NOW(), NOW()),  -- Science Lab to Farmgate
  ('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 3, 'outbound', 2.1, 360, NOW(), NOW()),  -- Farmgate to Shahbag
  ('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 4, 'outbound', 1.8, 360, NOW(), NOW()),  -- Shahbag to Malibagh
  ('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440010', 5, 'outbound', 1.6, 360, NOW(), NOW()),  -- Malibagh to Rampura
  ('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440011', 6, 'outbound', NULL, NULL, NOW(), NOW())  -- Rampura (end)
ON CONFLICT (bus_id, stop_id, direction) DO NOTHING;

-- Route 7: City Circle - 33 (Circular route: Farmgate -> Shahbag -> Paltan -> Gulistan -> Farmgate)
INSERT INTO public.route_stops (bus_id, stop_id, stop_order, direction, distance_to_next, duration_to_next, created_at, updated_at) VALUES
  ('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', 1, 'outbound', 2.1, 360, NOW(), NOW()),  -- Farmgate to Shahbag
  ('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 2, 'outbound', 1.5, 300, NOW(), NOW()),  -- Shahbag to Paltan
  ('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440005', 3, 'outbound', 0.9, 240, NOW(), NOW()),  -- Paltan to Gulistan
  ('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440006', 4, 'outbound', 3.5, 600, NOW(), NOW()),  -- Gulistan back to Farmgate
  ('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', 5, 'outbound', NULL, NULL, NOW(), NOW())  -- Farmgate (end)
ON CONFLICT (bus_id, stop_id, direction) DO NOTHING;

-- Route 8: Express AC - 99 (Mohakhali to Kamalapur via Shahbag, Paltan, Motijheel)
INSERT INTO public.route_stops (bus_id, stop_id, stop_order, direction, distance_to_next, duration_to_next, created_at, updated_at) VALUES
  ('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440001', 1, 'outbound', 2.8, 420, NOW(), NOW()),  -- Mohakhali to Farmgate
  ('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440002', 2, 'outbound', 2.1, 360, NOW(), NOW()),  -- Farmgate to Shahbag
  ('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 3, 'outbound', 1.5, 300, NOW(), NOW()),  -- Shahbag to Paltan
  ('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440005', 4, 'outbound', 1.2, 300, NOW(), NOW()),  -- Paltan to Motijheel
  ('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440008', 5, 'outbound', 1.1, 300, NOW(), NOW()),  -- Motijheel to Kamalapur
  ('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440009', 6, 'outbound', NULL, NULL, NOW(), NOW())  -- Kamalapur (end)
ON CONFLICT (bus_id, stop_id, direction) DO NOTHING;

-- Add some inbound routes (return journeys) for selected buses
-- Route 1 Inbound: Dhaka Express - 101 (Sadarghat to Uttara)
INSERT INTO public.route_stops (bus_id, stop_id, stop_order, direction, distance_to_next, duration_to_next, created_at, updated_at) VALUES
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440007', 1, 'inbound', 1.9, 420, NOW(), NOW()),  -- Sadarghat to Gulistan
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006', 2, 'inbound', 0.9, 240, NOW(), NOW()),  -- Gulistan to Paltan
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 3, 'inbound', 1.8, 300, NOW(), NOW()),  -- Paltan to Press Club
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 4, 'inbound', 0.6, 180, NOW(), NOW()),  -- Press Club to Shahbag
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 5, 'inbound', 2.1, 360, NOW(), NOW()),  -- Shahbag to Farmgate
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 6, 'inbound', 2.8, 420, NOW(), NOW()),  -- Farmgate to Mohakhali
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 7, 'inbound', 8.5, 900, NOW(), NOW()),  -- Mohakhali to Uttara
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440013', 8, 'inbound', NULL, NULL, NOW(), NOW())  -- Uttara (end)
ON CONFLICT (bus_id, stop_id, direction) DO NOTHING;
