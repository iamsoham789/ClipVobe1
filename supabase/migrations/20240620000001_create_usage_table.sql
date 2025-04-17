-- Create usage table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    feature TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, feature)
);

-- Enable RLS
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own usage" ON public.usage;
CREATE POLICY "Users can view their own usage"
    ON public.usage FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own usage" ON public.usage;
CREATE POLICY "Users can update their own usage"
    ON public.usage FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own usage" ON public.usage;
CREATE POLICY "Users can insert their own usage"
    ON public.usage FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create subscription table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    plan TEXT NOT NULL,
    status TEXT NOT NULL,
    payment_provider TEXT NOT NULL,
    payment_id TEXT,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view their own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Add realtime
alter publication supabase_realtime add table public.usage;
alter publication supabase_realtime add table public.subscriptions;
