-- Add caravan_id to payouts table to link withdrawals to specific events
ALTER TABLE public.payouts
ADD COLUMN caravan_id uuid REFERENCES public.caravans(id) ON DELETE SET NULL;
