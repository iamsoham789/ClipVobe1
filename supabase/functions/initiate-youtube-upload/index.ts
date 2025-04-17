
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
    const { filename, metadata } = await req.json();
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      throw new Error('No authorization header');
    }

    if (!filename || !metadata) {
      throw new Error('Missing required parameters');
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

    // Use direct fetch to YouTube API instead of using the google module
    const response = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${googleIdentity.access_token}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': 'video/*',
        'X-Upload-Content-Length': '0'
      },
      body: JSON.stringify({
        snippet: {
          title: metadata.title,
          description: metadata.description,
          tags: metadata.tags.split(',').map((tag: string) => tag.trim()),
        },
        status: {
          privacyStatus: metadata.visibility,
        },
      })
    });

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const uploadUrl = response.headers.get('location');
    if (!uploadUrl) {
      throw new Error('Failed to get upload URL');
    }

    // Extract upload ID from the location header if available
    const uploadId = new URL(uploadUrl).searchParams.get('upload_id') || '';

    return new Response(
      JSON.stringify({
        uploadUrl,
        uploadId,
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
