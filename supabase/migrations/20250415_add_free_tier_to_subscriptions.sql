
-- This migration ensures our subscriptions table is set up correctly for the free tier
-- Add plans for free, basic, and pro tiers

-- Check if the subscription tier enum exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier') THEN
    CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'pro', 'creator');
  ELSE
    -- If the enum exists but doesn't have 'free' as an option, add it
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e 
      JOIN pg_type t ON e.enumtypid = t.oid 
      WHERE t.typname = 'subscription_tier' AND e.enumlabel = 'free'
    ) THEN
      ALTER TYPE subscription_tier ADD VALUE 'free' BEFORE 'basic';
    END IF;
  END IF;
END $$;

-- Ensure the subscriptions table exists with the fields we need
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'basic', 'pro', 'creator')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Make sure we have an index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);

-- Enable RLS on the subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own subscription
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'users_can_read_own_subscriptions'
  ) THEN
    CREATE POLICY users_can_read_own_subscriptions ON public.subscriptions 
    FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create policy to allow service role to manage subscriptions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'service_role_can_manage_subscriptions'
  ) THEN
    CREATE POLICY service_role_can_manage_subscriptions ON public.subscriptions 
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Add function to automatically set updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update the updated_at timestamp
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_subscriptions_updated_at'
  ) THEN
    CREATE TRIGGER trigger_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
