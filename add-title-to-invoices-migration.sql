-- Migration: Add title column to invoices table
-- Date: September 14, 2025

-- Add title column to invoices table
ALTER TABLE public.invoices
ADD COLUMN title character varying;

-- Add comment to the column
COMMENT ON COLUMN public.invoices.title IS 'Title/description of the invoice';