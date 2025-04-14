
-- Update subscription table to ensure it has all the fields we need
ALTER TABLE IF EXISTS public.subscriptions
  ADD COLUMN IF NOT EXISTS tier VARCHAR NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS payment_provider VARCHAR,
  ADD COLUMN IF NOT EXISTS payment_id VARCHAR,
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;

-- Add comment to explain the subscription tiers
COMMENT ON COLUMN public.subscriptions.tier IS 'Subscription tier: free, basic, or pro';

-- Ensure we have the usage table for tracking feature usage
CREATE TABLE IF NOT EXISTS public.usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature VARCHAR NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, feature)
);

-- Default all users with no subscription to free plan
INSERT INTO public.subscriptions (user_id, tier, status)
SELECT id, 'free', 'active'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.subscriptions);

-- Create function to create a subscription for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to create a subscription for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add RLS policies for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read their own subscription" ON public.subscriptions;
CREATE POLICY "Allow users to read their own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow authenticated users to read only their own usage" ON public.usage;
CREATE POLICY "Allow authenticated users to read only their own usage"
  ON public.usage
  FOR SELECT
  USING (auth.uid() = user_id);

