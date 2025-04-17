
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the user's session
    const {
      data: { session },
      error: sessionError,
    } = await supabaseClient.auth.getSession();

    if (sessionError || !session) {
      throw new Error('Not authenticated');
    }

    // Get the user's YouTube credentials from the identity
    const { data: identities, error: identityError } = await supabaseClient.auth.getUserIdentities();
    
    if (identityError || !identities) {
      throw new Error('Failed to get user identities');
    }

    const googleIdentity = identities.identities?.find(
      (identity) => identity.provider === 'google'
    );

    if (!googleIdentity || !googleIdentity.access_token) {
      throw new Error('No Google identity found');
    }

    // Use direct fetch to YouTube API
    const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true', {
      headers: {
        'Authorization': `Bearer ${googleIdentity.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      throw new Error('No channel found');
    }

    return new Response(
      JSON.stringify({
        statistics: data.items[0].statistics,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
}); 
