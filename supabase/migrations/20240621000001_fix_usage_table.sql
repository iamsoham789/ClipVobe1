-- Drop existing usage table if it exists
DROP TABLE IF EXISTS public.usage;

-- Create usage table with proper structure
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

-- Add realtime
alter publication supabase_realtime add table public.usage;
