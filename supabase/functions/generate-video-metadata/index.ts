import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.1.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { filename } = await req.json();

    if (!filename) {
      throw new Error('No filename provided');
    }

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '');
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Generate title
    const titlePrompt = `Generate a catchy, SEO-optimized YouTube title for a video with filename: "${filename}". 
    The title should be engaging, include relevant keywords, and be under 100 characters.
    Return only the title, nothing else.`;

    const titleResponse = await model.generateContent(titlePrompt);
    const title = titleResponse.response.text().trim();

    // Generate description
    const descriptionPrompt = `Create a detailed, SEO-friendly YouTube video description for a video titled: "${title}".
    Include:
    - A compelling first 2-3 sentences that hook the viewer
    - Key points or timestamps (at least 3)
    - A call to action
    - Relevant links placeholder
    The description should be between 100-200 words.
    Return only the description, nothing else.`;

    const descriptionResponse = await model.generateContent(descriptionPrompt);
    const description = descriptionResponse.response.text().trim();

    // Generate tags
    const tagsPrompt = `Generate 10-15 relevant hashtags and keywords for a YouTube video titled: "${title}".
    Include a mix of:
    - Popular general tags
    - Niche-specific tags
    - Trending tags
    Return only the tags separated by commas, no #symbols, nothing else.`;

    const tagsResponse = await model.generateContent(tagsPrompt);
    const tags = tagsResponse.response.text().trim().split(',').map(tag => tag.trim());

    return new Response(
      JSON.stringify({
        title,
        description,
        tags,
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