-- Migration: Add amenity columns to buses table
-- Description: Adds is_ac and coach_type columns to support bus filtering by amenities
-- Requirements: 7.1, 7.2, 7.4

-- Add is_ac column (boolean for AC/Non-AC)
ALTER TABLE public.buses
ADD COLUMN IF NOT EXISTS is_ac BOOLEAN NOT NULL DEFAULT false;

-- Add coach_type column with constraint
ALTER TABLE public.buses
ADD COLUMN IF NOT EXISTS coach_type TEXT NOT NULL DEFAULT 'standard';

-- Add check constraint for coach_type values
ALTER TABLE public.buses
ADD CONSTRAINT buses_coach_type_check 
CHECK (coach_type = ANY (ARRAY['standard'::text, 'express'::text, 'luxury'::text]));

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_buses_is_ac 
ON public.buses USING btree (is_ac);

CREATE INDEX IF NOT EXISTS idx_buses_coach_type 
ON public.buses USING btree (coach_type);

-- Add comment for documentation
COMMENT ON COLUMN public.buses.is_ac IS 'Indicates whether the bus has air conditioning';
COMMENT ON COLUMN public.buses.coach_type IS 'Type of coach: standard, express, or luxury';
