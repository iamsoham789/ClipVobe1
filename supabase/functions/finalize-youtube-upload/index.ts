
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
    const { uploadId } = await req.json();
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      throw new Error('No authorization header');
    }

    if (!uploadId) {
      throw new Error('No upload ID provided');
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

    // Get the user's YouTube credentials
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

    // For YouTube API, we'll use a direct fetch call instead of the non-existent google module
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status&id=${uploadId}`, {
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
      throw new Error('Upload not found');
    }

    const videoStatus = data.items[0].status;
    if (videoStatus.uploadStatus !== 'processed') {
      throw new Error('Video is still processing');
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        videoId: data.items[0].id,
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
