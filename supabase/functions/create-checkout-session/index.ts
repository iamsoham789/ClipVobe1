import { serve } from "[https://deno.land/std@0.224.0/http/server.ts";](https://deno.land/std@0.224.0/http/server.ts";)
import { Stripe } from "[https://esm.sh/stripe@14.21.0?target=deno";](https://esm.sh/stripe@14.21.0?target=deno";)
import { createClient } from "[https://esm.sh/@supabase/supabase-js@2.45.4?target=deno";](https://esm.sh/@supabase/supabase-js@2.45.4?target=deno";)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error('Unauthorized');

    const { priceId, plan, userId } = await req.json();
    if (!priceId || !userId || !plan) throw new Error('Missing required fields');
    if (userId !== user.id) throw new Error('User ID mismatch');

    const envBasic = Deno.env.get('STRIPE_BASIC_PRICE_ID');
    const envUnlimited = Deno.env.get('STRIPE_UNLIMITED_PRICE_ID');
    console.log('[DEBUG] Received priceId:', priceId);
    console.log('[DEBUG] Plan:', plan);
    console.log('[DEBUG] STRIPE_BASIC_PRICE_ID from env:', envBasic);
    console.log('[DEBUG] STRIPE_UNLIMITED_PRICE_ID from env:', envUnlimited);

    let validPriceId = plan === 'basic'
      ? envBasic
      : plan === 'pro'
        ? envUnlimited
        : '';
    console.log('[DEBUG] validPriceId for plan:', validPriceId);
    if (priceId !== validPriceId) throw new Error('Price ID mismatch');

    // ...rest of your checkout logic...
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});