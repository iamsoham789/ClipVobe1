
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "jsr:@stripe/stripe@14.21.0";
import { createClient } from "jsr:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2025-02-24.acacia',
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
    let validPriceId = plan === 'basic' ? Deno.env.get('STRIPE_BASIC_PRICE_ID') : plan === 'pro' ? Deno.env.get('STRIPE_UNLIMITED_PRICE_ID') : '';
    if (priceId !== validPriceId) throw new Error('Price ID mismatch');
    const { data: existingCustomer } = await supabase.from('profiles').select('stripe_customer_id').eq('id', userId).maybeSingle();
    let customerId = existingCustomer?.stripe_customer_id;
    if (!customerId && user.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) { customerId = customers.data[0].id; await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId); }
    }
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { userId } });
      customerId = customer.id;
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId);
    }
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/pricing`,
      customer: customerId,
      client_reference_id: userId,
    });
    return new Response(JSON.stringify({ id: session.id, url: session.url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
});
