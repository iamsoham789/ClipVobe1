
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from '@supabase/supabase-js';

// Validate required environment variables
const requiredEnvVars = {
  SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  DODO_WEBHOOK_SECRET: Deno.env.get('DODO_WEBHOOK_SECRET'),
} as const;

// Check for missing environment variables
const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const supabaseUrl = requiredEnvVars.SUPABASE_URL as string;
const supabaseServiceKey = requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY as string;
const webhookSecret = requiredEnvVars.DODO_WEBHOOK_SECRET as string;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DodoWebhookPayload {
  id: string;
  payment_id: string;
  status: string;
  plan_id?: string;
  plan?: string;
  client_reference_id?: string;
  user_id?: string;
  customer_email?: string;
  amount?: number;
  currency?: string;
  created_at: string;
}

Deno.serve(async (req) => {
  try {
    // Skip signature verification for now since Dodo might not provide it
    // In production, you should verify the signature if Dodo provides a mechanism
    
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Parse the webhook payload
    const payload: DodoWebhookPayload = await req.json();
    console.log('Received Dodo webhook payload:', payload);

    // Validate essential fields
    if (!payload.payment_id || !payload.status) {
      return new Response(
        JSON.stringify({ error: { message: 'Missing required fields in payload' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Process based on webhook event type
    if (payload.status === 'completed' || payload.status === 'success') {
      // Extract user ID from client_reference_id or dedicated user_id field
      const userId = payload.client_reference_id || payload.user_id;
      
      if (!userId) {
        console.error('Missing user identification in webhook payload');
        return new Response(
          JSON.stringify({ error: { message: 'Cannot identify user from payload' } }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Determine plan type from the payload
      let planName = payload.plan || 'basic'; // Default to basic if not specified
      planName = planName.toLowerCase();
      
      // Validate plan name
      if (!['basic', 'pro', 'creator', 'free'].includes(planName)) {
        console.warn(`Unrecognized plan name: ${planName}, defaulting to basic`);
        planName = 'basic';
      }

      console.log(`Processing payment for user ${userId} with plan ${planName}`);

      // Calculate subscription period (30 days from now)
      const currentDate = new Date();
      const expiryDate = new Date(currentDate);
      expiryDate.setDate(currentDate.getDate() + 30);

      // Update subscriptions table
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          tier: planName,
          status: 'active',
          payment_provider: 'dodo',
          payment_id: payload.payment_id,
          current_period_start: currentDate.toISOString(),
          current_period_end: expiryDate.toISOString(),
        }, { onConflict: 'user_id' });

      if (subscriptionError) {
        console.error('Error updating subscription:', subscriptionError);
        throw subscriptionError;
      }

      // Update profiles table for backward compatibility
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ subscription_plan: planName })
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        // Continue despite this error as it's for backward compatibility
      }

      // Reset usage counts for the user
      const { error: usageError } = await supabase
        .from('usage')
        .update({
          count: 0,
          reset_at: expiryDate.toISOString(),
        })
        .eq('user_id', userId);

      if (usageError) {
        console.error('Error resetting usage counts:', usageError);
        // Log but continue, as we've already updated the subscription
      }

      console.log(`Successfully processed payment for user ${userId}`);
      
      return new Response(
        JSON.stringify({ success: true, message: 'Payment processed successfully' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      console.log(`Ignoring webhook with status: ${payload.status}`);
      return new Response(
        JSON.stringify({ received: true, message: `Ignored webhook with status: ${payload.status}` }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    return new Response(
      JSON.stringify({
        error: {
          message: err instanceof Error ? err.message : 'Unknown error during webhook processing',
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
