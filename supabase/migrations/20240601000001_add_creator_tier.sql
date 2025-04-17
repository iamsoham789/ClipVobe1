-- Add creator tier to subscription_tiers enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier') THEN
        CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'pro', 'creator');
    ELSE
        -- Check if 'creator' value exists in the enum
        IF NOT EXISTS (
            SELECT 1
            FROM pg_enum
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_tier')
            AND enumlabel = 'creator'
        ) THEN
            -- Add 'creator' to the enum
            ALTER TYPE subscription_tier ADD VALUE 'creator';
        END IF;
    END IF;
END$$;

-- Ensure the usage table exists
CREATE TABLE IF NOT EXISTS usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    reset_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, feature)
);

-- Enable RLS on the usage table
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;

-- Create policies for the usage table
DROP POLICY IF EXISTS "Users can view their own usage" ON usage;
CREATE POLICY "Users can view their own usage"
    ON usage FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own usage" ON usage;
CREATE POLICY "Users can update their own usage"
    ON usage FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own usage" ON usage;
CREATE POLICY "Users can insert their own usage"
    ON usage FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Enable realtime for the usage table
ALTER PUBLICATION supabase_realtime ADD TABLE usage;