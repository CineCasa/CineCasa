-- Migration: Drop cinema and series tables
-- Created: 2026-05-01

-- Drop policies for cinema table
DROP POLICY IF EXISTS "allow_public_read" ON public.cinema;
DROP POLICY IF EXISTS "allow_authenticated_read" ON public.cinema;
DROP POLICY IF EXISTS "allow_admin_all" ON public.cinema;

-- Drop policies for series table
DROP POLICY IF EXISTS "allow_public_read" ON public.series;
DROP POLICY IF EXISTS "allow_authenticated_read" ON public.series;
DROP POLICY IF EXISTS "allow_admin_all" ON public.series;

-- Disable RLS
ALTER TABLE IF EXISTS public.cinema DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.series DISABLE ROW LEVEL SECURITY;

-- Drop cinema table and all its data
DROP TABLE IF EXISTS public.cinema CASCADE;

-- Drop series table and all its data
DROP TABLE IF EXISTS public.series CASCADE;

-- Clean up any related sequences
DROP SEQUENCE IF EXISTS public.cinema_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.series_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.series_id_n_seq CASCADE;

-- Clean up any related functions that might have been created
-- Note: Functions will fail if they reference these tables, so we need to drop them

