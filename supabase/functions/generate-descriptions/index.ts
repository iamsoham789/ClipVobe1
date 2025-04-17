import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const { title, keywords, length } = await req.json();

    if (!title) {
      throw new Error("Title is required");
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key not configured");
    }

    let maxTokens = 800;
    if (length === "short") maxTokens = 400;
    if (length === "long") maxTokens = 1200;

    const systemMessage =
      "You are an expert in writing engaging YouTube descriptions that boost watch time and ranking. Ensure they are structured, compelling, and optimized for SEO.";
    const userInput = `Create a ${length} YouTube video description for a video titled: "${title}"${keywords ? ` that includes these keywords: ${keywords}` : ""}. Include sections, bullet points, timestamps, call to action, and relevant hashtags.`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
        GEMINI_API_KEY,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: systemMessage + "\n\n" + userInput }],
            },
          ],
          generationConfig: {
            temperature: 0.9,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: maxTokens,
            responseMimeType: "text/plain",
          },
        }),
      },
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "Error calling Gemini API");
    }

    const description = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ description }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating description:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
