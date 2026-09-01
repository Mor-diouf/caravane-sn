-- Add 'pending' to caravan_status enum if it doesn't exist
ALTER TYPE public.caravan_status ADD VALUE IF NOT EXISTS 'pending';

-- Add payment_link to caravans table
ALTER TABLE public.caravans ADD COLUMN IF NOT EXISTS payment_link text;

-- Add payer_phone to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payer_phone text;
