-- Add passenger_name to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS passenger_name text;
