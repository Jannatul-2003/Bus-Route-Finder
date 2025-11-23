-- Rollback Migration: Remove amenity columns from buses table
-- Description: Reverts changes made by 001_add_bus_amenities.sql

-- Remove indexes
DROP INDEX IF EXISTS public.idx_buses_is_ac;
DROP INDEX IF EXISTS public.idx_buses_coach_type;

-- Remove constraint
ALTER TABLE public.buses 
DROP CONSTRAINT IF EXISTS buses_coach_type_check;

-- Remove columns
ALTER TABLE public.buses 
DROP COLUMN IF EXISTS coach_type;

ALTER TABLE public.buses 
DROP COLUMN IF EXISTS is_ac;
